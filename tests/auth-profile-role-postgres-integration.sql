-- Execute ONLY against ephemeral CI PostgreSQL after fixture + review SQL.
-- All identities are synthetic; never run this against user production data.
\set ON_ERROR_STOP on

INSERT INTO auth.users (id,email,raw_user_meta_data) VALUES
 ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','teacher@invalid.example','{"role":"teacher","full_name":"Test Teacher","country":"BH"}'::jsonb),
 ('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb','school@invalid.example','{"role":"school","full_name":"Test School","country":"BH"}'::jsonb),
 ('cccccccc-cccc-4ccc-cccc-cccccccccccc','student@invalid.example','{"role":"student","full_name":"Test Student","country":"BH"}'::jsonb),
 ('dddddddd-dddd-4ddd-dddd-dddddddddddd','parent@invalid.example','{"role":"parent","full_name":"Test Parent","country":"BH"}'::jsonb),
 ('eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee','adminfake@invalid.example','{"role":"admin","full_name":"Fake Admin","country":"BH"}'::jsonb);

DO $$
BEGIN
  IF (SELECT role FROM public.profiles WHERE id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa') <> 'student'
    OR (SELECT role FROM public.profiles WHERE id='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb') <> 'student'
    OR (SELECT role FROM public.profiles WHERE id='eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee') <> 'student'
    THEN RAISE EXCEPTION 'Untrusted metadata produced a privileged profile'; END IF;
  IF (SELECT role FROM public.profiles WHERE id='dddddddd-dddd-4ddd-dddd-dddddddddddd') <> 'parent'
    THEN RAISE EXCEPTION 'Existing parent behavior unexpectedly changed'; END IF;
  IF (SELECT COUNT(*) FROM public.profile_role_requests WHERE status='pending'
        AND requested_role IN ('teacher','school')) <> 2
    THEN RAISE EXCEPTION 'Privileged intents must be pending, not granted'; END IF;
  IF EXISTS (SELECT 1 FROM public.profile_role_requests WHERE user_id='eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee')
    THEN RAISE EXCEPTION 'Invalid admin intent must not create an approval request'; END IF;
  IF has_table_privilege('authenticated','public.profiles','INSERT')
    OR has_table_privilege('anon','public.profiles','INSERT')
    THEN RAISE EXCEPTION 'Direct public INSERT remains enabled'; END IF;
  IF has_table_privilege('authenticated','public.profile_role_requests','INSERT')
    OR has_table_privilege('authenticated','public.profile_role_requests','UPDATE')
    OR has_table_privilege('authenticated','public.profile_role_requests','DELETE')
    THEN RAISE EXCEPTION 'Role requests writable by learner'; END IF;
END $$;

-- Simulate a signed-in student with the same request context Supabase exposes.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-cccc-cccccccccccc', false);

UPDATE public.profiles SET full_name='Student Name Updated'
 WHERE id='cccccccc-cccc-4ccc-cccc-cccccccccccc';
DO $$
BEGIN
  IF (SELECT full_name FROM public.profiles WHERE id='cccccccc-cccc-4ccc-cccc-cccccccccccc') <> 'Student Name Updated'
    THEN RAISE EXCEPTION 'Legitimate profile-name edit failed'; END IF;
END $$;

-- Reject every self-promotion and protect identity/email as well.
DO $$
DECLARE
  attempted_role text;
BEGIN
  FOREACH attempted_role IN ARRAY ARRAY['teacher','school','parent','child','admin'] LOOP
    BEGIN
      UPDATE public.profiles SET role=attempted_role
        WHERE id='cccccccc-cccc-4ccc-cccc-cccccccccccc';
      RAISE EXCEPTION 'Unauthorized role update unexpectedly succeeded: %', attempted_role;
    EXCEPTION
      WHEN SQLSTATE '42501' THEN NULL;
    END;
  END LOOP;

  BEGIN
    UPDATE public.profiles SET email='someoneelse@invalid.example'
      WHERE id='cccccccc-cccc-4ccc-cccc-cccccccccccc';
    RAISE EXCEPTION 'Unauthorized email mutation succeeded';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN NULL;
  END;

  BEGIN
    UPDATE public.profiles SET id='ffffffff-ffff-4fff-ffff-ffffffffffff'
      WHERE id='cccccccc-cccc-4ccc-cccc-cccccccccccc';
    RAISE EXCEPTION 'Unauthorized ID reassignment succeeded';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN NULL;
  END;
END $$;

-- Role requests must be readable by their owner only.
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.profile_role_requests) <> 0
    THEN RAISE EXCEPTION 'Student can read other users role requests'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',false);
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.profile_role_requests) <> 1
    THEN RAISE EXCEPTION 'Applicant cannot read own pending request'; END IF;
END $$;

RESET ROLE;
-- Verified backend (postgres simulation) may approve; not exposed to clients.
UPDATE public.profiles SET role='teacher' WHERE id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
DO $$
BEGIN
  IF (SELECT role FROM public.profiles WHERE id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa') <> 'teacher'
    THEN RAISE EXCEPTION 'Privileged backend approval path broken'; END IF;
  IF (SELECT role FROM public.profiles WHERE id='cccccccc-cccc-4ccc-cccc-cccccccccccc') <> 'student'
    THEN RAISE EXCEPTION 'Unauthorized role changed during rejection test'; END IF;
END $$;

\echo 'DISPOSABLE POSTGRES ROLE/PROFILES SECURITY REGRESSION PASSED'
