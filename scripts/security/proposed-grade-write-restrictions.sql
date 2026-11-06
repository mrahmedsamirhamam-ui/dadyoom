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

BEGIN;

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

-- Explicitly revoke separately granted column-level write privileges too.
-- REVOKE on the table does not remove UPDATE(grade)/INSERT(grade) grants.
-- Do not alter grants inherited through PUBLIC or unrelated roles silently;
-- fail closed if such an effective path still exists.
DO $columns$
DECLARE item record;
BEGIN
  FOR item IN
    SELECT c.relname AS table_name, a.attname AS column_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid
    WHERE n.nspname = 'public'
      AND c.relname IN (
        'question_attempts', 'lesson_activity_attempts',
        'student_lesson_progress', 'lesson_mastery',
        'assessment_sessions', 'assessment_session_answers'
      )
      AND a.attnum > 0 AND NOT a.attisdropped AND a.attacl IS NOT NULL
  LOOP
    EXECUTE format(
      'REVOKE INSERT (%I), UPDATE (%I) ON TABLE public.%I FROM anon, authenticated',
      item.column_name, item.column_name, item.table_name
    );
  END LOOP;
END $columns$;

-- Atomic acceptance gate: any remaining effective write permission,
-- including inherited/PUBLIC and individual-column privileges, rolls back
-- this candidate instead of committing a partially secured database.
DO $verify$
DECLARE
  table_name text;
  role_name text;
BEGIN
  FOR table_name IN SELECT unnest(ARRAY[
    'question_attempts', 'lesson_activity_attempts',
    'student_lesson_progress', 'lesson_mastery',
    'assessment_sessions', 'assessment_session_answers'
  ])
  LOOP
    FOR role_name IN SELECT unnest(ARRAY['anon', 'authenticated'])
    LOOP
      IF has_any_column_privilege(role_name, format('public.%I', table_name), 'INSERT')
         OR has_any_column_privilege(role_name, format('public.%I', table_name), 'UPDATE')
         OR has_table_privilege(role_name, format('public.%I', table_name), 'DELETE')
         OR has_table_privilege(role_name, format('public.%I', table_name), 'TRUNCATE')
      THEN
        RAISE EXCEPTION 'GRADE_WRITE_PRIVILEGE_REMAINS: % %', role_name, table_name;
      END IF;
    END LOOP;
  END LOOP;
END $verify$;

COMMIT;
