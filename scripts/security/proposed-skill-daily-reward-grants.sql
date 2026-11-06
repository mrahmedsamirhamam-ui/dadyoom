-- SHADOW-ONLY privilege rehearsal. NOT a production migration.
-- Read-only Dadyoom production catalog shows both tables have owner RLS,
-- but authenticated browser roles still have grade/XP INSERT/UPDATE/DELETE.
-- The preceding skill POST endpoint now fails closed on unverified scores;
-- still, clients can bypass that POST until live database grants are cut over.
-- Never apply this candidate without authenticated student+teacher staging E2E.
\set ON_ERROR_STOP on
DO $guard$
BEGIN
  IF current_database() <> 'shadow_skill_rewards'
     OR current_setting('dadyoom.skill_rewards_rehearsal', true) IS DISTINCT FROM 'enabled'
  THEN
    RAISE EXCEPTION 'PRODUCTION_SKILL_REWARD_REVOKE_BLOCKED_SHADOW_ONLY';
  END IF;
END
$guard$;

BEGIN;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  public.student_skill_progress,
  public.student_daily_challenges
FROM anon, authenticated;

-- TABLE REVOKE does not remove column-specific INSERT / UPDATE grants.
DO $columns$
DECLARE v record;
BEGIN
  FOR v IN
    SELECT c.relname table_name, a.attname column_name
    FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid
    WHERE n.nspname = 'public'
      AND c.relname IN ('student_skill_progress','student_daily_challenges')
      AND a.attnum > 0 AND NOT a.attisdropped
      AND a.attacl IS NOT NULL
  LOOP
    EXECUTE format(
      'REVOKE INSERT (%I), UPDATE (%I) ON TABLE public.%I FROM anon,authenticated',
      v.column_name, v.column_name, v.table_name
    );
  END LOOP;
END
$columns$;

-- Effective privilege checks catch PUBLIC or inherited role/column grants too.
DO $verify$
DECLARE v_table text; v_role text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['student_skill_progress','student_daily_challenges']
  LOOP
    FOREACH v_role IN ARRAY ARRAY['anon','authenticated']
    LOOP
      IF has_any_column_privilege(v_role,format('public.%I',v_table),'INSERT')
        OR has_any_column_privilege(v_role,format('public.%I',v_table),'UPDATE')
        OR has_table_privilege(v_role,format('public.%I',v_table),'DELETE')
        OR has_table_privilege(v_role,format('public.%I',v_table),'TRUNCATE')
        OR NOT has_table_privilege(v_role,format('public.%I',v_table),'SELECT')
      THEN
        RAISE EXCEPTION 'SKILL_REWARD_BROWSER_GRANT_REMAINS: % / %',
          v_table,v_role;
      END IF;
    END LOOP;
    IF NOT has_table_privilege('service_role',format('public.%I',v_table),'INSERT')
      OR NOT has_table_privilege('service_role',format('public.%I',v_table),'UPDATE')
      OR NOT has_table_privilege('service_role',format('public.%I',v_table),'SELECT')
    THEN
      RAISE EXCEPTION 'SKILL_REWARD_TRUSTED_WRITER_LOST: %',v_table;
    END IF;
  END LOOP;
END
$verify$;
COMMIT;
