-- DRAFT ONLY / NO-GO. Based on actual Supabase schema observed 2026-11-16.
-- NOT APPLIED. Requires isolated integration tests and compatibility review.
-- Legacy XP / mastery engines are NOT integrated. Ledger records only pending awards.
BEGIN;
CREATE TABLE IF NOT EXISTS public.assessment_reward_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES public.ai_assessments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points integer NOT NULL CHECK (points >= 0),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, assessment_id)
);
ALTER TABLE public.assessment_reward_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_reward_outbox FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.assessment_reward_outbox FROM PUBLIC, anon, authenticated;
-- Existing tables: revoke all direct mutations until their read/create workflows are migrated.
-- DO NOT enable these REVOKEs before replacing legacy start/submit routes.
REVOKE UPDATE, DELETE ON public.assessment_sessions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.assessment_session_answers FROM anon, authenticated;
REVOKE UPDATE, DELETE ON public.ai_assessments FROM anon, authenticated;
-- WARNING: ai_assessments.correct_answer and assessment_session_answers.correct_answer
-- remain exposed by any existing SELECT grants until column grants and API reads are redesigned.
CREATE OR REPLACE FUNCTION public.submit_atomic_assessment_answer(
  p_attempt_id uuid, p_question_id uuid, p_selected_option integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := auth.jwt() ->> 'email';
  v_session public.assessment_sessions%ROWTYPE;
  v_question public.ai_assessments%ROWTYPE;
  v_correct boolean;
  v_correct_count integer;
  v_wrong_count integer;
  v_finished boolean;
BEGIN
  IF v_uid IS NULL OR v_email IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='28000', MESSAGE='unauthenticated';
  END IF;
  IF p_attempt_id IS NULL OR p_question_id IS NULL OR p_selected_option IS NULL OR p_selected_option < 0 THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='invalid_answer';
  END IF;
  SELECT * INTO v_session FROM public.assessment_sessions
    WHERE id=p_attempt_id FOR UPDATE;
  IF NOT FOUND OR v_session.student_id <> v_uid THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='attempt_not_owned';
  END IF;
  IF v_session.finished THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='attempt_finished';
  END IF;
  IF EXISTS(SELECT 1 FROM public.assessment_session_answers
    WHERE session_id=p_attempt_id AND assessment_id=p_question_id) THEN
    RAISE EXCEPTION USING ERRCODE='23505', MESSAGE='duplicate_answer';
  END IF;
  SELECT * INTO v_question FROM public.ai_assessments
    WHERE id=p_question_id FOR UPDATE;
  IF NOT FOUND OR v_question.student_email <> v_email
    OR v_question.lesson_id IS DISTINCT FROM v_session.lesson_id THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='question_not_owned';
  END IF;
  IF coalesce(v_question.completed,false) THEN
    RAISE EXCEPTION USING ERRCODE='23505', MESSAGE='duplicate_answer';
  END IF;
  IF jsonb_typeof(v_question.choices) <> 'array'
    OR p_selected_option >= jsonb_array_length(v_question.choices) THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='invalid_option';
  END IF;
  v_correct := p_selected_option = v_question.correct_answer;
  INSERT INTO public.assessment_session_answers
    (session_id,assessment_id,student_id,lesson_id,skill,selected_answer,correct_answer,is_correct)
  VALUES (p_attempt_id,p_question_id,v_uid,v_session.lesson_id,
    coalesce(v_question.skill,''),p_selected_option,v_question.correct_answer,v_correct);
  v_correct_count := v_session.correct_answers + CASE WHEN v_correct THEN 1 ELSE 0 END;
  v_wrong_count := v_session.wrong_answers + CASE WHEN v_correct THEN 0 ELSE 1 END;
  v_finished := v_correct_count + v_wrong_count >= v_session.total_questions;
  UPDATE public.assessment_sessions SET
    correct_answers=v_correct_count, wrong_answers=v_wrong_count,
    current_question=least(total_questions,v_correct_count+v_wrong_count+1),
    finished=v_finished,
    difficulty=CASE WHEN v_correct_count*100 / greatest(v_correct_count+v_wrong_count,1) >= 80 THEN 'hard'
      WHEN v_correct_count*100 / greatest(v_correct_count+v_wrong_count,1) >= 50 THEN 'medium'
      ELSE 'easy' END,
    updated_at=now()
  WHERE id=p_attempt_id;
  UPDATE public.ai_assessments SET completed=true WHERE id=p_question_id;
  INSERT INTO public.assessment_reward_outbox
    (session_id,assessment_id,student_id,points)
  VALUES (p_attempt_id,p_question_id,v_uid,CASE WHEN v_correct THEN 1 ELSE 0 END);
  RETURN jsonb_build_object(
    'correct',v_correct,'finished',v_finished,
    'correctAnswers',v_correct_count,'wrongAnswers',v_wrong_count,
    'score',round(v_correct_count*100.0/greatest(v_correct_count+v_wrong_count,1)),
    'nextQuestionId',NULL
  );
END;
$$;
REVOKE ALL ON FUNCTION public.submit_atomic_assessment_answer(uuid,uuid,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_atomic_assessment_answer(uuid,uuid,integer) TO authenticated;
COMMIT;
-- SECURITY BLOCKER: function owner and all legacy grants/policies must be reviewed.
-- The public RPC is SECURITY DEFINER and must be audited for privilege bypass.
-- nextQuestionId=null: scheduling is not implemented; DO NOT MERGE.
