\set ON_ERROR_STOP on
-- Catalog inventory in isolated database ONLY. Prints both legacy and new names.
SELECT kind,name
FROM (
  SELECT 'relation'::text AS kind,c.relname::text AS name FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND (c.relname LIKE 'dadyoom\_lq1\_%' ESCAPE '\'
      OR c.relname IN ('lesson_review_workflows','lesson_quality_axis_reviews','lesson_review_events',
        'lesson_review_versions','lesson_quality_axis_events'))
  UNION ALL
  SELECT 'function',p.proname FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND (p.proname LIKE 'dadyoom\_lq1\_%' ESCAPE '\'
      OR p.proname IN ('advance_lesson_review','lesson_review_dashboard','log_lesson_quality_axis',
       'guard_lesson_quality_axis'))
) objects ORDER BY kind,name;

DO $
DECLARE v_conflicts text[];
BEGIN
 IF current_database() <> 'dadyoom_lq1_ci_isolated' THEN RAISE EXCEPTION 'ISOLATION_GUARD'; END IF;
 SELECT array_agg(name) INTO v_conflicts FROM (
  SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relname LIKE 'dadyoom_lq1_%'
  UNION ALL
  SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname LIKE 'dadyoom_lq1_%'
 ) x;
 IF cardinality(v_conflicts)>0 THEN RAISE EXCEPTION 'LQ1_NAME_COLLISIONS: %',v_conflicts; END IF;
 RAISE NOTICE 'PREFLIGHT_PASS: no dadyoom_lq1_ objects';
END;
$$;
