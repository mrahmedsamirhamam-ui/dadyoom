-- Executed ONLY in shadow_receipts PostgreSQL 16 database.
-- No student or production Supabase accounts participate.
\set ON_ERROR_STOP on
DO $roles$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
   CREATE ROLE anon NOLOGIN;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
   CREATE ROLE authenticated NOLOGIN;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
   CREATE ROLE service_role NOLOGIN BYPASSRLS;
 END IF;
END $roles$;
GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;

DO $verify$
DECLARE t regclass := 'public.assessment_completion_receipts'::regclass;
DECLARE role_name text;
BEGIN
 IF (SELECT relrowsecurity FROM pg_class WHERE oid=t) IS DISTINCT FROM true
 THEN RAISE EXCEPTION 'RECEIPTS_RLS_NOT_ENABLED'; END IF;
 FOR role_name IN SELECT unnest(ARRAY['anon','authenticated']) LOOP
  IF has_table_privilege(role_name,t,'SELECT') OR
     has_table_privilege(role_name,t,'INSERT') OR
     has_table_privilege(role_name,t,'UPDATE') OR
     has_table_privilege(role_name,t,'DELETE') OR
     has_table_privilege(role_name,t,'TRUNCATE')
  THEN RAISE EXCEPTION 'RECEIPT_BROWSER_ACCESS_EXISTS: %',role_name; END IF;
 END LOOP;
 IF NOT has_table_privilege('service_role',t,'SELECT') OR
    NOT has_table_privilege('service_role',t,'INSERT') OR
    has_table_privilege('service_role',t,'UPDATE') OR
    has_table_privilege('service_role',t,'DELETE') OR
    has_table_privilege('service_role',t,'TRUNCATE')
 THEN RAISE EXCEPTION 'RECEIPT_TRUSTED_INSERT_ONLY_GRANTS_INCORRECT'; END IF;
END $verify$;
\echo SHADOW_RECEIPTS_BROWSER_DENY_AND_SERVER_INSERT_ONLY=PASS

SET ROLE service_role;
INSERT INTO public.assessment_completion_receipts
(session_id,student_id,lesson_id,total_questions,correct_answers,wrong_answers)
VALUES('11111111-1111-4111-8111-111111111111',
'22222222-2222-4222-8222-222222222222',
'33333333-3333-4333-8333-333333333333',5,4,1);

DO $verify$
DECLARE denied boolean := false;
BEGIN
 IF (SELECT count(*) FROM public.assessment_completion_receipts)<>1
 THEN RAISE EXCEPTION 'RECEIPT_TRUSTED_READ_MISSING'; END IF;
 BEGIN
  UPDATE public.assessment_completion_receipts
  SET correct_answers=5 WHERE total_questions=5;
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'RECEIPT_NOT_IMMUTABLE'; END IF;

 denied:=false;
 BEGIN
  INSERT INTO public.assessment_completion_receipts
  (session_id,student_id,lesson_id,total_questions,correct_answers,wrong_answers)
  VALUES('11111111-1111-4111-8111-111111111111',
   '22222222-2222-4222-8222-222222222222',
   '33333333-3333-4333-8333-333333333333',5,5,0);
 EXCEPTION WHEN unique_violation THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'DUPLICATE_RECEIPT_ACCEPTED'; END IF;

 denied:=false;
 BEGIN
  INSERT INTO public.assessment_completion_receipts
  (session_id,student_id,lesson_id,total_questions,correct_answers,wrong_answers)
  VALUES('44444444-4444-4444-8444-444444444444',
   '22222222-2222-4222-8222-222222222222',
   '33333333-3333-4333-8333-333333333333',5,6,0);
 EXCEPTION WHEN check_violation THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'INVALID_RECEIPT_TOTAL_ACCEPTED'; END IF;
END $verify$;
RESET ROLE;
\echo SHADOW_RECEIPTS_INSERT_READ_IMMUTABLE_UNIQUE_CHECK=PASS

SET ROLE authenticated;
DO $verify$
DECLARE denied boolean:=false;
BEGIN
 BEGIN
  INSERT INTO public.assessment_completion_receipts
  (session_id,student_id,lesson_id,total_questions,correct_answers,wrong_answers)
  VALUES('55555555-5555-4555-8555-555555555555',
   '22222222-2222-4222-8222-222222222222',
   '33333333-3333-4333-8333-333333333333',5,5,0);
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'STUDENT_RECEIPT_FORGERY_ALLOWED'; END IF;
END $verify$;
RESET ROLE;
\echo SHADOW_RECEIPTS_STUDENT_FORGERY_DENIED=PASS
