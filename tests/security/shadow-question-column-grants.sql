-- DISPOSABLE ONLY, after shadow-question-grants.sql restores original
-- invoker view and table permissions. Never execute against live Supabase.
-- Investigates a narrower alternative to using a RLS-bypassing definer view:
-- table-level SELECT revoked, allow SELECT only on public columns.
-- Crucial caveat: options JSON can itself carry grading flags. This fixture
-- intentionally contains a nested isCorrect in raw options. Therefore this
-- test is NOT sufficient approval for production raw options to remain public.
\set ON_ERROR_STOP on
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon')
    OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
   RAISE EXCEPTION 'SHADOW_FIXTURE_ROLES_MISSING';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.dadyoom_student_questions) THEN
   RAISE EXCEPTION 'SHADOW_QUESTION_VIEW_MISSING';
 END IF;
END $$;
REVOKE SELECT ON public.questions FROM anon,authenticated;
GRANT SELECT (id,lesson_id,question_order,question,question_type,options,points)
 ON public.questions TO anon,authenticated;

SET ROLE anon;
DO $$
DECLARE visible_count integer; raw_correct boolean:=false;
  raw_explanation boolean:=false; raw_options jsonb;
BEGIN
 SELECT count(*) INTO visible_count FROM public.dadyoom_student_questions;
 IF visible_count<>1 THEN
   RAISE EXCEPTION 'ANON_INVOKER_VIEW_FAILED_AFTER_COLUMN_REVOKE';
 END IF;
 IF EXISTS (SELECT 1 FROM public.dadyoom_student_questions
             WHERE options::text LIKE '%isCorrect%') THEN
   RAISE EXCEPTION 'ANON_PUBLIC_VIEW_NESTED_KEY_EXPOSED';
 END IF;
 BEGIN
  PERFORM correct_answer FROM public.questions LIMIT 1;
 EXCEPTION WHEN insufficient_privilege THEN raw_correct:=true;
 END;
 BEGIN
  PERFORM explanation FROM public.questions LIMIT 1;
 EXCEPTION WHEN insufficient_privilege THEN raw_explanation:=true;
 END;
 IF NOT raw_correct OR NOT raw_explanation THEN
   RAISE EXCEPTION 'ANON_TABLE_SECRET_COLUMN_ACCESS_REMAINS';
 END IF;
 SELECT options INTO raw_options FROM public.questions LIMIT 1;
 IF NOT jsonb_path_exists(raw_options,'$.**.isCorrect') THEN
   RAISE EXCEPTION 'EXPECTED_RAW_JSON_OPTION_RISK_NOT_REPRODUCED';
 END IF;
END $$;
RESET ROLE;
\echo SHADOW_ANON_INVOKER_COLUMN_ONLY_SAFE_KEYS=PASS
\echo SHADOW_RAW_OPTIONS_NESTED_GRADING_RISK_DOCUMENTED=PASS

SET ROLE authenticated;
DO $$
DECLARE visible_count integer; raw_denied boolean:=false;
BEGIN
 SELECT count(*) INTO visible_count FROM public.dadyoom_student_questions;
 IF visible_count<>1 THEN
   RAISE EXCEPTION 'AUTH_INVOKER_VIEW_FAILED_AFTER_COLUMN_REVOKE';
 END IF;
 BEGIN
  PERFORM correct_answer FROM public.questions LIMIT 1;
 EXCEPTION WHEN insufficient_privilege THEN raw_denied:=true;
 END;
 IF NOT raw_denied THEN
   RAISE EXCEPTION 'AUTH_RAW_ANSWER_KEY_SELECT_STILL_ALLOWED';
 END IF;
END $$;
RESET ROLE;
\echo SHADOW_AUTH_INVOKER_COLUMN_ONLY_SAFE_KEYS=PASS

-- Verify no change of ownership, the view stays SECURITY INVOKER and RLS
-- still hides unpublished lessons. Never lift the invoker guard.
DO $$
DECLARE v_security_invoker boolean;
BEGIN
 SELECT COALESCE('security_invoker=true'=ANY(c.reloptions),false)
 INTO v_security_invoker
 FROM pg_class c WHERE c.oid='public.dadyoom_student_questions'::regclass;
 IF v_security_invoker IS DISTINCT FROM true THEN
   RAISE EXCEPTION 'COLUMN_REVOKE_CHANGED_VIEW_SECURITY_MODE';
 END IF;
END $$;

-- Local rollback: no schema changes and no student rows modified.
GRANT SELECT ON public.questions TO anon,authenticated;
REVOKE SELECT (id,lesson_id,question_order,question,question_type,options,points)
 ON public.questions FROM anon,authenticated;

SET ROLE anon;
DO $$
BEGIN
 IF (SELECT count(*) FROM public.dadyoom_student_questions)<>1 THEN
   RAISE EXCEPTION 'COLUMN_REVOKE_ROLLBACK_VIEW_FAILED';
 END IF;
 IF NOT has_column_privilege('anon','public.questions','correct_answer','SELECT') THEN
   RAISE EXCEPTION 'COLUMN_REVOKE_ROLLBACK_FAILED';
 END IF;
END $$;
RESET ROLE;
\echo SHADOW_COLUMN_GRANTS_ROLLBACK=PASS
