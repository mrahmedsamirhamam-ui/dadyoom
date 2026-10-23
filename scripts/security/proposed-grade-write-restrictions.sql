-- NON-DEPLOYABLE PROPOSAL. This is NOT a Supabase migration.
-- The stage guard deliberately rejects execution against any real database.
-- Run only against the disposable shadow_grading CI database and its synthetic
-- fixtures after authentic role, RLS, RPC and end-to-end Preview review.
--
-- Server-authoritative grading requires these six result tables to be
-- READABLE through owner RLS, but NOT WRITABLE by browser tokens.
-- Teacher/admin editing of lessons/questions is intentionally unaffected.
DO $guard$
BEGIN
  IF current_database() <> 'shadow_grading'
     OR current_setting('dadyoom.grade_grant_rehearsal', true) IS DISTINCT FROM 'enabled'
  THEN
    RAISE EXCEPTION 'PRODUCTION_REVOKE_BLOCKED_DISPOSABLE_TEST_ONLY';
  END IF;
END
$guard$;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  public.question_attempts,
  public.lesson_activity_attempts,
  public.student_lesson_progress,
  public.lesson_mastery,
  public.assessment_sessions,
  public.assessment_session_answers
FROM anon, authenticated;

-- Deliberately preserve SELECT and policies on these tables:
-- Next.js/Next Server Action still needs owner-scoped progress/attempt reads.
-- Trusted service_role write grants are not touched.
-- No rows or Auth users are modified.
