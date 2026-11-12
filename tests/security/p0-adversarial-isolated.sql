-- ONLY AFTER: node scripts/security/p0-assert-isolated-env.mjs + disposable schema.
\set ON_ERROR_STOP on
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
 ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','student-a@invalid.example','{"role":"teacher"}'),
 ('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb','student-b@invalid.example','{"role":"school"}'),
 ('cccccccc-cccc-4ccc-cccc-cccccccccccc','student-c@invalid.example','{"role":"admin"}'),
 ('dddddddd-dddd-4ddd-dddd-dddddddddddd','reviewer@invalid.example','{}'),
 ('eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee','teacher@invalid.example','{}');
DO $test$
BEGIN
 IF EXISTS (SELECT 1 FROM public.profiles WHERE role <> 'student') THEN
   RAISE EXCEPTION 'FAIL: untrusted registration role was granted';
 END IF;
END $test$;
INSERT INTO public.questions(id,lesson_id,question_order,question,question_type,options,points,correct_answer,explanation)
VALUES ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',
 1,'Synthetic question','mcq','["A","B"]'::jsonb,1,'A','Synthetic explanation');
INSERT INTO public.question_attempts(user_id,question_id,selected_answer,is_correct)
VALUES ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','B',false),
       ('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb','11111111-1111-4111-8111-111111111111','A',true);
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',false);
DO $test$
DECLARE r text;
BEGIN
 FOREACH r IN ARRAY ARRAY['teacher','school','admin'] LOOP
  BEGIN
   UPDATE public.profiles SET role=r WHERE id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
   RAISE EXCEPTION 'FAIL: student self-promotion to %',r;
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
 END LOOP;
 BEGIN
  INSERT INTO public.profiles(id,email,role) VALUES
   ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','wrong@invalid.example','teacher');
  RAISE EXCEPTION 'FAIL: direct INSERT';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  PERFORM correct_answer FROM public.questions;
  RAISE EXCEPTION 'FAIL: direct correct_answer leak';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  INSERT INTO public.question_attempts(user_id,question_id,is_correct) VALUES
   ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',true);
  RAISE EXCEPTION 'FAIL: forged grade INSERT';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  UPDATE public.question_attempts SET is_correct=true
    WHERE user_id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  RAISE EXCEPTION 'FAIL: forged grade UPDATE';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  PERFORM public.approve_profile_role_request(
    'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    'dddddddd-dddd-4ddd-dddd-dddddddddddd','approved','request from browser');
  RAISE EXCEPTION 'FAIL: direct RPC';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 IF (SELECT count(*) FROM public.question_attempts) <> 1 THEN
  RAISE EXCEPTION 'FAIL: cross-student answer visible';
 END IF;
 IF (SELECT count(*) FROM public.profiles) <> 1 THEN
  RAISE EXCEPTION 'FAIL: cross-profile visible';
 END IF;
END $test$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',false);
-- Pre-existing teacher may NOT become admin from browser.
UPDATE public.profiles SET role='teacher' WHERE id='eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee';
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee',false);
DO $test$
BEGIN
 BEGIN
  UPDATE public.profiles SET role='admin'
   WHERE id='eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee';
  RAISE EXCEPTION 'FAIL: teacher self-promotion';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $test$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',false);
SET ROLE anon;
DO $test$
BEGIN
 BEGIN
  PERFORM id FROM public.profiles;
  RAISE EXCEPTION 'FAIL: anonymous profile read';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  PERFORM id FROM public.question_attempts;
  RAISE EXCEPTION 'FAIL: anonymous attempt read';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  PERFORM correct_answer FROM public.questions;
  RAISE EXCEPTION 'FAIL: anonymous answer key read';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $test$;
RESET ROLE;
-- Simulate a pre-verified ADMIN and an independently signed review authority.
UPDATE public.profiles SET role='admin' WHERE id='dddddddd-dddd-4ddd-dddd-dddddddddddd';
INSERT INTO private.role_approval_authorities(reviewer_id,authorization_reference)
 VALUES('dddddddd-dddd-4ddd-dddd-dddddddddddd','synthetic-DBA-witness-001');
INSERT INTO public.profile_role_requests(user_id,requested_role)
 VALUES('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','teacher');
SET ROLE service_role;
SELECT public.approve_profile_role_request(
 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
 'dddddddd-dddd-4ddd-dddd-dddddddddddd','approved','synthetic independent approval');
RESET ROLE;
DO $test$
BEGIN
 IF (SELECT role FROM public.profiles WHERE id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa') <> 'teacher'
 OR (SELECT status FROM public.profile_role_requests WHERE user_id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa') <> 'approved'
 OR (SELECT count(*) FROM public.profile_role_review_audit
   WHERE target_user_id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa') <> 1
 THEN RAISE EXCEPTION 'FAIL: audited trusted approval is not atomic'; END IF;
END $test$;
\echo 'P0_DISPOSABLE_POSTGRES_ADVERSARIAL=PASS'
