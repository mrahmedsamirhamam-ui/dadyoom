\set ON_ERROR_STOP on
-- Verify FORCE RLS and absence of effective sensitive column access.
DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['questions','ai_assessments','assessment_sessions','assessment_session_answers'] LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname=t AND c.relrowsecurity AND c.relforcerowsecurity)
  THEN RAISE EXCEPTION 'RLS missing on %',t; END IF;
 END LOOP;
 FOREACH t IN ARRAY ARRAY['questions','ai_assessments','assessment_session_answers'] LOOP
  IF has_column_privilege('authenticated','public.'||t,'correct_answer','SELECT')
    OR has_column_privilege('authenticated','public.'||t,'correct_answer','UPDATE')
  THEN RAISE EXCEPTION 'secret column exposed: %',t; END IF;
 END LOOP;
 IF has_table_privilege('authenticated','public.assessment_sessions','UPDATE')
  OR has_column_privilege('authenticated','public.assessment_sessions','correct_answers','UPDATE')
 THEN RAISE EXCEPTION 'direct score modification exposed'; END IF;
END $$;
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
SELECT set_config('request.jwt.claims','{"email":"student-a@test.invalid"}',true);
DO $$
BEGIN
 IF (SELECT count(*) FROM public.assessment_sessions) <> 1 THEN
  RAISE EXCEPTION 'cross student row leak'; END IF;
 IF (SELECT count(*) FROM public.assessment_sessions WHERE id='33333333-3333-4333-8333-333333333333') <> 0
 THEN RAISE EXCEPTION 'other student visible'; END IF;
 IF (SELECT count(*) FROM public.v_secure_questions) <> 1 THEN
  RAISE EXCEPTION 'secure view failed'; END IF;
END $$;
ROLLBACK;
