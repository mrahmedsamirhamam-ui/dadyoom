\set ON_ERROR_STOP on
DO $$
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
