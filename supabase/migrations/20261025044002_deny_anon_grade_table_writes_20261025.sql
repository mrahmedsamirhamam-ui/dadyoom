-- LIVE 2026-10-25: Applied with Supabase migration history.
-- Defensive removal of unused ANON DML on seven learner-result tables.
-- RLS had no anon/PUBLIC write policies. Authenticated and service-role
-- privileges are untouched. This does NOT fix authenticated score forgery.
--
-- Rollback, only if separately approved after incident review:
-- GRANT INSERT, UPDATE, DELETE, TRUNCATE ON
--   public.question_attempts, public.lesson_activity_attempts,
--   public.student_lesson_progress, public.lesson_mastery,
--   public.assessment_sessions, public.assessment_session_answers,
--   public.edu_game_attempts TO anon;
--
-- This source snapshot records the already-executed production migration:
-- do not re-run a second time against that same environment.
DO $preflight$
DECLARE rec record;
BEGIN
 FOR rec IN SELECT t.name FROM (VALUES
   ('question_attempts'),('lesson_activity_attempts'),
   ('student_lesson_progress'),('lesson_mastery'),
   ('assessment_sessions'),('assessment_session_answers'),
   ('edu_game_attempts')) t(name)
 LOOP
   IF NOT EXISTS (
     SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public' AND c.relname=rec.name
       AND c.relkind='r' AND c.relrowsecurity
   ) THEN RAISE EXCEPTION 'ANON_GRADE_HARDENING_TABLE_OR_RLS_MISSING: %', rec.name; END IF;
   IF EXISTS (
     SELECT 1 FROM pg_policies p
     WHERE p.schemaname='public' AND p.tablename=rec.name
       AND (p.roles @> ARRAY['anon']::name[] OR p.roles @> ARRAY['public']::name[])
       AND p.cmd IN ('ALL','INSERT','UPDATE','DELETE')
   ) THEN RAISE EXCEPTION 'ANONYMOUS_GRADE_POLICY_REVIEW_REQUIRED: %',rec.name; END IF;
 END LOOP;
END $preflight$;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE
  public.question_attempts, public.lesson_activity_attempts,
  public.student_lesson_progress, public.lesson_mastery,
  public.assessment_sessions, public.assessment_session_answers,
  public.edu_game_attempts FROM anon;

DO $verify$
DECLARE rec record; f text;
BEGIN
 FOR rec IN SELECT * FROM (VALUES
   ('question_attempts'),('lesson_activity_attempts'),
   ('student_lesson_progress'),('lesson_mastery'),
   ('assessment_sessions'),('assessment_session_answers'),
   ('edu_game_attempts')) AS t(name)
 LOOP
   f:='public.'||quote_ident(rec.name);
   IF has_any_column_privilege('anon',f,'INSERT')
     OR has_any_column_privilege('anon',f,'UPDATE')
     OR has_table_privilege('anon',f,'DELETE')
     OR has_table_privilege('anon',f,'TRUNCATE')
     OR NOT has_table_privilege('authenticated',f,'INSERT')
     OR NOT has_table_privilege('authenticated',f,'SELECT')
     OR NOT has_table_privilege('service_role',f,'INSERT')
   THEN RAISE EXCEPTION 'ANON_GRADING_ACL_CUTOVER_FAILED: %',f; END IF;
 END LOOP;
END $verify$;
