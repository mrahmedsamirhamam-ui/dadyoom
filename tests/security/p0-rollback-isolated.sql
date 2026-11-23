\set ON_ERROR_STOP on
-- Executed ONLY after the security-preserving rollback against synthetic DB.
SET ROLE service_role;
DO $test$
BEGIN
 BEGIN
  PERFORM public.approve_profile_role_request(
   'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
   'dddddddd-dddd-4ddd-dddd-dddddddddddd','approved',
   'should never work during rollback');
  RAISE EXCEPTION 'FAIL: rollback left privileged approval open';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $test$;
RESET ROLE;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',false);
DO $test$
BEGIN
 BEGIN
  UPDATE public.profiles SET role='admin'
   WHERE id='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
  RAISE EXCEPTION 'FAIL: rollback reopened direct role mutation';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  PERFORM correct_answer FROM public.questions;
  RAISE EXCEPTION 'FAIL: rollback reopened answer key leak';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $test$;
RESET ROLE;
\echo 'P0_SECURITY_PRESERVING_ROLLBACK=PASS'
