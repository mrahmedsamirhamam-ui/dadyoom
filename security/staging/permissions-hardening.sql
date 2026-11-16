-- STAGING ONLY. DO NOT RUN ON PRODUCTION. Requires verified isolated project.
-- IMPORTANT: table-level SELECT/UPDATE grants override column-level REVOKE.
-- Use explicit safe-column grants instead. Review existing consumers first.
BEGIN;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assessments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_session_answers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions FORCE ROW LEVEL SECURITY;

-- Remove broad table-level privileges first; REVOKE(column) alone is ineffective.
REVOKE ALL PRIVILEGES ON TABLE public.questions FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.ai_assessments FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.assessment_session_answers FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.assessment_sessions FROM PUBLIC, anon, authenticated;

-- Restrict SELECT to explicitly enumerated non-secret columns.
-- Table SELECT is deliberately NOT re-granted.
GRANT SELECT (id,lesson_id,question_order,question,question_type,options,points)
  ON public.questions TO authenticated;
GRANT SELECT (id,student_email,title,passage,question,choices,skill,difficulty,lesson_id,completed)
  ON public.ai_assessments TO authenticated;
GRANT SELECT (id,session_id,assessment_id,student_id,lesson_id,skill,selected_answer,is_correct,created_at)
  ON public.assessment_session_answers TO authenticated;
GRANT SELECT (id,student_id,lesson_id,current_question,total_questions,correct_answers,wrong_answers,difficulty,finished,created_at,updated_at)
  ON public.assessment_sessions TO authenticated;
-- The existing RLS SELECT policies MUST continue restricting these columns to own rows.
-- No direct INSERT/UPDATE/DELETE grants: only audited server RPC may mutate.
-- Existing question/assessment creation and session start routes WILL need migration.

-- SECURITY INVOKER prevents the view from bypassing underlying RLS (PostgreSQL 15+).
CREATE OR REPLACE VIEW public.v_secure_questions
  WITH (security_invoker = true)
AS SELECT id,lesson_id,question_order,question,question_type,options,points
FROM public.questions;
REVOKE ALL ON public.v_secure_questions FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.v_secure_questions TO authenticated;
COMMIT;

-- BLOCKER: this intentionally breaks legacy direct INSERT/UPDATE workflows until migrated.
-- BLOCKER: inherited grants / additional roles / view dependencies must be audited.
-- BLOCKER: FORCE RLS does not constrain BYPASSRLS roles or superusers.
-- BLOCKER: review existing RLS policies, function owner and RPC grants before executing.
