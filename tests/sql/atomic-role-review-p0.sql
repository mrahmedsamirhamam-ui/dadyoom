-- Synthetic, disposable PostgreSQL only. Never run against production.
\set ON_ERROR_STOP on

-- Create synthetic, untrusted student/teacher/school signup intents.
-- The base SQL under test must persist teacher/school only as student + pending.
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES
  ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','teacher@invalid.example',
   '{"role":"teacher","full_name":"Teacher Test"}'::jsonb),
  ('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb','school@invalid.example',
   '{"role":"school","full_name":"School Test"}'::jsonb),
  ('cccccccc-cccc-4ccc-cccc-cccccccccccc','student@invalid.example',
   '{"role":"student","full_name":"Student Test"}'::jsonb);

-- Create a trusted test admin by a privileged DB operation, not browser metadata.
INSERT INTO auth.users(id,email,raw_user_meta_data)
VALUES ('ffffffff-ffff-4fff-8fff-ffffffffffff','admin@invalid.example','{}'::jsonb);
UPDATE public.profiles SET role='admin'
WHERE id='ffffffff-ffff-4fff-8fff-ffffffffffff';

-- Malicious student cannot invoke the privileged RPC even by guessing admin id.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-cccc-cccccccccccc',false);
DO $$
BEGIN
  BEGIN
    PERFORM public.approve_profile_role_request(
      'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      'ffffffff-ffff-4fff-8fff-ffffffffffff', 'approved');
    RAISE EXCEPTION 'Unauthorized invocation unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',false);

-- A valid backend reviewer cannot pretend that a student is an admin.
DO $$
BEGIN
  BEGIN
    PERFORM public.approve_profile_role_request(
      'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      'cccccccc-cccc-4ccc-cccc-cccccccccccc', 'approved');
    RAISE EXCEPTION 'Non-admin reviewer unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

-- Atomic approval must both change profile and log a single outcome.
SELECT public.approve_profile_role_request(
  'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
  'ffffffff-ffff-4fff-8fff-ffffffffffff', 'approved');

DO $$
BEGIN
  IF (SELECT role FROM public.profiles WHERE id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa') <> 'teacher'
  OR (SELECT status FROM public.profile_role_requests WHERE user_id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa') <> 'approved'
  OR (SELECT count(*) FROM public.profile_role_review_audit WHERE
        target_user_id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
        AND decision='approved'
        AND reviewer_id='ffffffff-ffff-4fff-8fff-ffffffffffff') <> 1
  THEN RAISE EXCEPTION 'Atomic approval inconsistent'; END IF;
END $$;

-- Duplicate decision is rejected without extra audit entries.
DO $$
BEGIN
  BEGIN
    PERFORM public.approve_profile_role_request(
      'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      'ffffffff-ffff-4fff-8fff-ffffffffffff','approved');
    RAISE EXCEPTION 'Duplicate approval unexpectedly succeeded';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
END $$;

-- Rejection never grants school rights.
SELECT public.approve_profile_role_request(
  'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
  'ffffffff-ffff-4fff-8fff-ffffffffffff','rejected');
DO $$
BEGIN
  IF (SELECT role FROM public.profiles WHERE id='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb') <> 'student'
  OR (SELECT status FROM public.profile_role_requests WHERE user_id='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb') <> 'rejected'
  THEN RAISE EXCEPTION 'Rejection changed role'; END IF;
END $$;

\echo 'ATOMIC ROLE REVIEW P0 ISOLATED CHECKS PASSED'
