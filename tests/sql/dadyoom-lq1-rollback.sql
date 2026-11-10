\set ON_ERROR_STOP on
DO $$
BEGIN
 IF current_database() <> 'dadyoom_lq1_ci_isolated' THEN RAISE EXCEPTION 'ISOLATION_GUARD'; END IF;
END;
$$;
BEGIN;
DROP FUNCTION public.dadyoom_lq1_review_dashboard(text,integer,text,integer,integer);
DROP FUNCTION public.dadyoom_lq1_advance_lesson_review(uuid,text,uuid,text,text);
DROP TRIGGER dadyoom_lq1_trg_quality_axis_guard ON public.dadyoom_lq1_quality_axis_reviews;
DROP TRIGGER dadyoom_lq1_trg_quality_axis_audit ON public.dadyoom_lq1_quality_axis_reviews;
DROP FUNCTION public.dadyoom_lq1_guard_quality_axis();
DROP FUNCTION public.dadyoom_lq1_log_quality_axis();
DROP TABLE public.dadyoom_lq1_quality_axis_events;
DROP TABLE public.dadyoom_lq1_review_versions;
DROP TABLE public.dadyoom_lq1_review_events;
DROP TABLE public.dadyoom_lq1_quality_axis_reviews;
DROP TABLE public.dadyoom_lq1_review_workflows;
COMMIT;

DO $$
DECLARE v_remaining integer;
BEGIN
 SELECT count(*) INTO v_remaining FROM (
   SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public' AND c.relname LIKE 'dadyoom_lq1_%'
   UNION ALL
   SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.proname LIKE 'dadyoom_lq1_%'
 ) x;
 IF v_remaining<>0 THEN RAISE EXCEPTION 'ROLLBACK_REMAINS:%',v_remaining; END IF;
 IF (SELECT status FROM public.lessons WHERE id='11111111-1111-4111-8111-111111111111') <> 'published'
   THEN RAISE EXCEPTION 'PUBLIC_STATUS_CHANGED'; END IF;
 RAISE NOTICE 'ROLLBACK_PASS: no namespaced objects and publication unchanged';
END;
$$;
