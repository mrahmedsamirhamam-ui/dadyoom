-- NON-DEPLOYABLE security proposal. NEVER execute on live Dadyoom.
-- Future grant cutover must be rehearsed on disposable PostgreSQL 16 and
-- reviewed with authenticated student/teacher E2E before release.
-- This proposal ONLY handles edu_game_attempts; the earlier six grading
-- tables and question/activity answer keys have separate P0 candidates.
DO $guard$
BEGIN
  IF current_database() <> 'shadow_game_rewards'
     OR current_setting('dadyoom.game_grant_rehearsal', true) IS DISTINCT FROM 'enabled'
  THEN
    RAISE EXCEPTION 'PRODUCTION_GAME_GRANT_CUTOVER_BLOCKED_SHADOW_ONLY';
  END IF;
END $guard$;

BEGIN;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE
  ON TABLE public.edu_game_attempts FROM anon, authenticated;

-- Table-level REVOKE alone does NOT remove explicit column-level privileges.
DO $columns$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT a.attname AS name
    FROM pg_attribute a
    WHERE a.attrelid = 'public.edu_game_attempts'::regclass
      AND a.attnum > 0 AND NOT a.attisdropped AND a.attacl IS NOT NULL
  LOOP
    EXECUTE format(
      'REVOKE INSERT (%I), UPDATE (%I) ON TABLE public.edu_game_attempts FROM anon, authenticated',
      r.name, r.name
    );
  END LOOP;
END $columns$;

-- Fail the whole transaction if any browser-origin writer remains.
DO $verify$
DECLARE role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated']
  LOOP
    IF has_any_column_privilege(role_name,'public.edu_game_attempts','INSERT')
      OR has_any_column_privilege(role_name,'public.edu_game_attempts','UPDATE')
      OR has_table_privilege(role_name,'public.edu_game_attempts','DELETE')
      OR has_table_privilege(role_name,'public.edu_game_attempts','TRUNCATE')
      OR NOT has_table_privilege(role_name,'public.edu_game_attempts','SELECT')
    THEN
      RAISE EXCEPTION 'GAME_ATTEMPT_BROWSER_GRANT_NOT_SAFE: %',role_name;
    END IF;
  END LOOP;
END $verify$;
COMMIT;
