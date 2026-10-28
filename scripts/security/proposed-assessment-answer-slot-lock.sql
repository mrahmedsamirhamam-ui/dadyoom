-- NONDEPLOYABLE DESIGN REHEARSAL ONLY — no production migration.
-- PostgreSQL transaction-backed one-answer-per-current-question guard.
--
-- Current unique (session_id,assessment_id) cannot prevent two distinct
-- assessments from claiming the SAME current_question during concurrent
-- /submit HTTP requests. A session row lock + primary key(session_id, slot)
-- makes every answer slot exclusive. Only service_role may write the ledger;
-- never grant the browser direct writes. This candidate does NOT cure
-- existing client DML/answer-key access. See security Issue #57.
--
-- IMPORTANT: Running this outside a throwaway database is deliberately
-- blocked. Before any separately authored deploy migration, validate legacy
-- data, authenticated Preview, writer grants, live locks, and rollback.
DO $guard$
BEGIN
  IF current_database() <> 'shadow_assessment_slots'
    OR current_setting('dadyoom.assessment_slot_rehearsal', true)
       IS DISTINCT FROM 'enabled'
  THEN
    RAISE EXCEPTION 'PRODUCTION_ASSESSMENT_SLOT_DDL_BLOCKED_DISPOSABLE_ONLY';
  END IF;
END $guard$;

-- Abort on historical disagreements. Never silently delete or rewrite a
-- real assessment or session to force a migration through.
DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.assessment_session_answers a
    LEFT JOIN public.assessment_sessions s ON s.id = a.session_id
    WHERE s.id IS NULL OR a.student_id IS DISTINCT FROM s.student_id
      OR a.lesson_id IS DISTINCT FROM s.lesson_id
  ) THEN
    RAISE EXCEPTION 'ASSESSMENT_SLOT_FOREIGN_OR_UNOWNED_ANSWER_REVIEW_REQUIRED';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.assessment_sessions s
    LEFT JOIN (
      SELECT session_id, count(*)::integer AS n
      FROM public.assessment_session_answers GROUP BY session_id
    ) answers ON answers.session_id=s.id
    WHERE s.total_questions NOT BETWEEN 1 AND 50
      OR s.current_question NOT BETWEEN 1 AND s.total_questions
      OR s.correct_answers < 0 OR s.wrong_answers < 0
      OR s.correct_answers + s.wrong_answers <> s.current_question -
        CASE WHEN s.finished THEN 0 ELSE 1 END
      OR COALESCE(answers.n,0) <> (s.correct_answers+s.wrong_answers +
        CASE WHEN s.finished THEN 0
          WHEN COALESCE(answers.n,0) > s.correct_answers+s.wrong_answers THEN 1
          ELSE 0 END)
      OR COALESCE(answers.n,0) > s.total_questions
  ) THEN
    RAISE EXCEPTION 'ASSESSMENT_SLOT_LEGACY_COUNTERS_MANUAL_REVIEW_REQUIRED';
  END IF;
END $preflight$;

CREATE TABLE public.assessment_answer_slots (
  session_id uuid NOT NULL REFERENCES public.assessment_sessions(id),
  question_number integer NOT NULL CHECK (question_number BETWEEN 1 AND 50),
  assessment_id uuid NOT NULL,
  PRIMARY KEY (session_id, question_number),
  UNIQUE (session_id, assessment_id)
);
ALTER TABLE public.assessment_answer_slots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.assessment_answer_slots FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.assessment_answer_slots TO service_role;

-- Historical rows are matched to a sequence only for the disposable proof.
-- Production migration needs a verified, stable historical answer ordering.
INSERT INTO public.assessment_answer_slots(session_id,question_number,assessment_id)
SELECT session_id,
       row_number() OVER (PARTITION BY session_id ORDER BY created_at,id)::integer,
       assessment_id
FROM public.assessment_session_answers;

CREATE OR REPLACE FUNCTION public.dadyoom_rehearsal_claim_answer_slot()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  s record;
  previous_answers bigint;
BEGIN
  -- Serialize all attempts against the same current session row.
  SELECT student_id, lesson_id, current_question, total_questions,
         correct_answers, wrong_answers, finished
  INTO s
  FROM public.assessment_sessions
  WHERE id=NEW.session_id FOR UPDATE;

  IF NOT FOUND OR s.finished
    OR s.student_id IS DISTINCT FROM NEW.student_id
    OR s.lesson_id IS DISTINCT FROM NEW.lesson_id
    OR s.total_questions NOT BETWEEN 1 AND 50
    OR s.current_question NOT BETWEEN 1 AND s.total_questions
    OR s.correct_answers + s.wrong_answers <> s.current_question-1
  THEN
    RAISE EXCEPTION 'ASSESSMENT_SLOT_SESSION_NOT_ELIGIBLE'
      USING ERRCODE = '23514';
  END IF;

  SELECT count(*) INTO previous_answers
  FROM public.assessment_session_answers
  WHERE session_id=NEW.session_id;

  IF previous_answers <> s.current_question-1 THEN
    RAISE EXCEPTION 'ASSESSMENT_SLOT_PENDING_ANSWER_NOT_ADVANCED'
      USING ERRCODE = '23514';
  END IF;

  -- PK(session_id,question_number) handles even simultaneous distinct
  -- assessment IDs; the entire INSERT transaction rolls back on conflict.
  INSERT INTO public.assessment_answer_slots
    (session_id,question_number,assessment_id)
  VALUES (NEW.session_id,s.current_question,NEW.assessment_id);
  RETURN NEW;
END
$function$;

REVOKE ALL ON FUNCTION public.dadyoom_rehearsal_claim_answer_slot()
  FROM PUBLIC,anon,authenticated;
CREATE TRIGGER dadyoom_rehearsal_answer_slot_before_insert
BEFORE INSERT ON public.assessment_session_answers
FOR EACH ROW EXECUTE FUNCTION public.dadyoom_rehearsal_claim_answer_slot();
