-- =====================================================================
-- TASK 03-D / Issue #117 — REVIEW ONLY ISOLATED SQL TEST PLAN
-- =====================================================================
-- NOT RUN in this environment. No PostgreSQL/Supabase binary was available.
-- Execute ONLY after the disposable fixture and the reviewed protection SQL
-- have been installed in a disposable, unlinked, loopback database.
-- All emails and UUIDs below are synthetic. Never use real user data.
--
-- This file uses SET ROLE + request.jwt claims to SIMULATE PostgREST. Those
-- assertions are necessary but NOT SUFFICIENT. The same matrix must be rerun
-- with real local GoTrue JWTs and real PostgREST before any release decision.
-- =====================================================================
\set ON_ERROR_STOP on

DO $guard$
BEGIN
  IF current_database() ~* '(^|[^a-z0-9])(prod|production)([^a-z0-9]|$)' THEN
    RAISE EXCEPTION 'TASK03D_TEST_REFUSED: production-like database';
  END IF;
  IF inet_server_addr() IS NOT NULL
     AND NOT (inet_server_addr() <<= inet '127.0.0.0/8') THEN
    RAISE EXCEPTION 'TASK03D_TEST_REFUSED: non-loopback endpoint';
  END IF;
END
$guard$;

-- Seven synthetic signups. Metadata role is deliberately hostile for 3 of them.
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
 ('11111111-1111-4111-8111-111111111111','student@invalid.example','{"role":"student","full_name":"Synthetic Student","country":"BH"}'::jsonb),
 ('22222222-2222-4222-8222-222222222222','teacher@invalid.example','{"role":"teacher","full_name":"Synthetic Teacher","country":"BH"}'::jsonb),
 ('33333333-3333-4333-8333-333333333333','school@invalid.example','{"role":"school","full_name":"Synthetic School","country":"BH"}'::jsonb),
 ('44444444-4444-4444-8444-444444444444','adminfake@invalid.example','{"role":"admin","full_name":"Fake Admin","country":"BH"}'::jsonb),
 ('55555555-5555-4555-8555-555555555555','parent@invalid.example','{"role":"parent","full_name":"Synthetic Parent","country":"BH"}'::jsonb),
 ('66666666-6666-4666-8666-666666666666','child@invalid.example','{"role":"child","full_name":"Synthetic Child","country":"BH"}'::jsonb),
 ('77777777-7777-4777-8777-777777777777','legacy@invalid.example','{"role":"student"}'::jsonb);

DO $signup$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles
     WHERE role <> 'student' OR full_name IS NOT NULL OR country IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'FAIL: handle_new_user trusted metadata or created a complete profile';
  END IF;
  IF (SELECT count(*) FROM public.profile_role_requests
       WHERE status='pending' AND requested_role IN ('teacher','school')) <> 2 THEN
    RAISE EXCEPTION 'FAIL: privileged metadata intents did not become pending only';
  END IF;
  IF (SELECT count(*) FROM public.profile_onboarding_pending) <> 7 THEN
    RAISE EXCEPTION 'FAIL: auth trigger did not issue one-time onboarding tokens';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.profile_role_requests
     WHERE user_id='44444444-4444-4444-8444-444444444444'
  ) THEN
    RAISE EXCEPTION 'FAIL: forged admin metadata created an approval request';
  END IF;
  IF has_table_privilege('authenticated','public.profiles','INSERT')
     OR has_table_privilege('anon','public.profiles','INSERT')
     OR has_table_privilege('authenticated','public.profiles','UPDATE') THEN
    RAISE EXCEPTION 'FAIL: broad client profile write privilege remains';
  END IF;
  IF has_table_privilege('authenticated','public.profile_role_requests','INSERT')
     OR has_table_privilege('authenticated','public.profile_role_requests','UPDATE')
     OR has_table_privilege('authenticated','public.profile_role_requests','DELETE')
     OR has_table_privilege('authenticated','public.profile_role_review_audit','SELECT') THEN
    RAISE EXCEPTION 'FAIL: approval/audit tables are client-writable or readable';
  END IF;
  IF pg_get_functiondef(
       'public.task03d_complete_self_signup(text,text,text)'::regprocedure
     ) ~* '(link_child_by_code|create_parent_link_code|parent_student|student_parent)' THEN
    RAISE EXCEPTION 'FAIL: onboarding RPC can create family relationships';
  END IF;
END
$signup$;

-- Simulate a real signed-in student. Real JWT tests are still mandatory.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SELECT set_config('request.jwt.claim.role','authenticated',false);

DO $client_writes$
DECLARE v_role text;
BEGIN
  FOREACH v_role IN ARRAY ARRAY['student','child','parent','teacher','school','admin'] LOOP
    BEGIN
      UPDATE public.profiles SET role=v_role
       WHERE id='11111111-1111-4111-8111-111111111111';
      RAISE EXCEPTION 'FAIL: direct role update succeeded: %', v_role;
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
  END LOOP;

  BEGIN
    INSERT INTO public.profiles (id,email,role)
    VALUES ('11111111-1111-4111-8111-111111111111','wrong@invalid.example','teacher');
    RAISE EXCEPTION 'FAIL: direct privileged INSERT succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM public.task03d_complete_self_signup('Synthetic Student','BH','teacher');
    RAISE EXCEPTION 'FAIL: self-signup RPC accepted a privileged role';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM public.task03d_approve_profile_role_request(
      '22222222-2222-4222-8222-222222222222',
      '44444444-4444-4444-8444-444444444444',
      'approved','synthetic browser attempt');
    RAISE EXCEPTION 'FAIL: client can execute approval RPC';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM public.task03d_issue_legacy_onboarding_token(
      '77777777-7777-4777-8777-777777777777',
      '44444444-4444-4444-8444-444444444444',
      'synthetic browser repair attempt');
    RAISE EXCEPTION 'FAIL: client can issue a legacy repair token';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  IF (SELECT count(*) FROM public.profiles) <> 1 THEN
    RAISE EXCEPTION 'FAIL: cross-user profile SELECT is visible';
  END IF;
  IF (SELECT count(*) FROM public.profile_role_requests) <> 0 THEN
    RAISE EXCEPTION 'FAIL: other users role requests are visible';
  END IF;
END
$client_writes$;

-- A teacher/school applicant must be able to read only their own pending row.
SELECT set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false);
DO $own_request_read$
BEGIN
  IF (SELECT count(*) FROM public.profile_role_requests
       WHERE user_id='22222222-2222-4222-8222-222222222222') <> 1 THEN
    RAISE EXCEPTION 'FAIL: owner cannot read own pending role request';
  END IF;
  IF (SELECT count(*) FROM public.profile_role_requests
       WHERE user_id='33333333-3333-4333-8333-333333333333') <> 0 THEN
    RAISE EXCEPTION 'FAIL: another users pending role request is visible';
  END IF;
END
$own_request_read$;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);

-- Legitimate self-service onboarding through the controlled RPC.
SELECT public.task03d_complete_self_signup('Student Completed','BH','student');

SELECT set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',false);
SELECT public.task03d_complete_self_signup('Parent Completed','BH','parent');

DO $self_signup$
BEGIN
  IF (SELECT role FROM public.profiles
       WHERE id='55555555-5555-4555-8555-555555555555') <> 'parent' THEN
    RAISE EXCEPTION 'FAIL: legitimate parent self-selection broken';
  END IF;
  IF (SELECT selected_role FROM public.profile_self_signup_audit
       WHERE user_id='55555555-5555-4555-8555-555555555555') <> 'parent' THEN
    RAISE EXCEPTION 'FAIL: self-signup selection was not audited';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profile_onboarding_pending
              WHERE user_id='55555555-5555-4555-8555-555555555555') THEN
    RAISE EXCEPTION 'FAIL: one-time onboarding token was not consumed';
  END IF;

  BEGIN
    PERFORM public.task03d_complete_self_signup('Later Change','BH','student');
    RAISE EXCEPTION 'FAIL: self-signup role can be changed by replay';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL;
  END;
END
$self_signup$;

-- Legacy incomplete profile: no trigger token, owner cannot self-repair.
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',false);
SELECT set_config('request.jwt.claim.role','service_role',false);
DELETE FROM public.profile_onboarding_pending
 WHERE user_id='77777777-7777-4777-8777-777777777777';

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',false);
SELECT set_config('request.jwt.claim.role','authenticated',false);
DO $legacy_denied$
BEGIN
  BEGIN
    PERFORM public.task03d_complete_self_signup('Pretend Legacy','BH','parent');
    RAISE EXCEPTION 'FAIL: owner self-repaired a legacy baseline profile';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL;
  END;
END
$legacy_denied$;

RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',false);
SELECT set_config('request.jwt.claim.role','service_role',false);
DO $repair_unauthorized$
BEGIN
  BEGIN
    PERFORM public.task03d_issue_legacy_onboarding_token(
      '77777777-7777-4777-8777-777777777777',
      '44444444-4444-4444-8444-444444444444',
      'synthetic unenrolled operator attempt');
    RAISE EXCEPTION 'FAIL: unenrolled operator issued a repair token';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;
END
$repair_unauthorized$;

-- A separate, independently enrolled admin verifies and issues the token.
UPDATE public.profiles SET role='admin'
 WHERE id='44444444-4444-4444-8444-444444444444';
INSERT INTO private.role_approval_authorities
  (reviewer_id, authorization_reference)
VALUES
  ('44444444-4444-4444-8444-444444444444','synthetic-dba-witness-001')
ON CONFLICT (reviewer_id) DO NOTHING;

SELECT public.task03d_issue_legacy_onboarding_token(
  '77777777-7777-4777-8777-777777777777',
  '44444444-4444-4444-8444-444444444444',
  'synthetic verified legacy owner review');

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',false);
SELECT set_config('request.jwt.claim.role','authenticated',false);
SELECT public.task03d_complete_self_signup('Legacy Repaired','BH','child');

DO $legacy_repaired$
BEGIN
  IF (SELECT role FROM public.profiles
       WHERE id='77777777-7777-4777-8777-777777777777') <> 'child' THEN
    RAISE EXCEPTION 'FAIL: verified legacy repair did not complete onboarding';
  END IF;
  IF (SELECT count(*) FROM public.profile_onboarding_repair_audit
       WHERE target_user_id='77777777-7777-4777-8777-777777777777') <> 1 THEN
    RAISE EXCEPTION 'FAIL: legacy repair was not audited exactly once';
  END IF;
END
$legacy_repaired$;

-- Server-only privileged approval with independent authority and audit.
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',false);
SELECT set_config('request.jwt.claim.role','service_role',false);

-- The reviewer must be a separate, independently enrolled admin.
UPDATE public.profiles SET role='admin'
 WHERE id='44444444-4444-4444-8444-444444444444';
INSERT INTO private.role_approval_authorities
  (reviewer_id, authorization_reference)
VALUES
  ('44444444-4444-4444-8444-444444444444','synthetic-dba-witness-001')
ON CONFLICT (reviewer_id) DO NOTHING;

SELECT public.task03d_approve_profile_role_request(
  '22222222-2222-4222-8222-222222222222',
  '44444444-4444-4444-8444-444444444444',
  'approved',
  'synthetic independent approval decision');

DO $approval$
BEGIN
  IF (SELECT role FROM public.profiles
       WHERE id='22222222-2222-4222-8222-222222222222') <> 'teacher' THEN
    RAISE EXCEPTION 'FAIL: atomic privileged approval did not set role';
  END IF;
  IF (SELECT status FROM public.profile_role_requests
       WHERE user_id='22222222-2222-4222-8222-222222222222') <> 'approved'
     OR (SELECT reviewed_by FROM public.profile_role_requests
          WHERE user_id='22222222-2222-4222-8222-222222222222') IS NULL THEN
    RAISE EXCEPTION 'FAIL: approval review fields not updated atomically';
  END IF;
  IF (SELECT count(*) FROM public.profile_role_review_audit
       WHERE target_user_id='22222222-2222-4222-8222-222222222222'
         AND decision='approved') <> 1 THEN
    RAISE EXCEPTION 'FAIL: approval was not audited exactly once';
  END IF;

  BEGIN
    PERFORM public.task03d_approve_profile_role_request(
      '22222222-2222-4222-8222-222222222222',
      '44444444-4444-4444-8444-444444444444',
      'approved','synthetic replay attempt');
    RAISE EXCEPTION 'FAIL: replayed approval was accepted';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL;
  END;
END
$approval$;

-- An existing student with no onboarding token cannot pretend to be new.
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',false);
SELECT set_config('request.jwt.claim.role','service_role',false);
UPDATE public.profiles SET role='student'
 WHERE id='55555555-5555-4555-8555-555555555555';
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',false);
SELECT set_config('request.jwt.claim.role','authenticated',false);
DO $existing$
BEGIN
  BEGIN
    PERFORM public.task03d_complete_self_signup('Pretend New','BH','parent');
    RAISE EXCEPTION 'FAIL: existing student changed role by replaying onboarding';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL;
  END;
END
$existing$;

RESET ROLE;
\echo 'TASK03D_REVIEW_ONLY_SQL_MATRIX_PASSED (simulated claims; real JWT/PostgREST still required)'
