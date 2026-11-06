-- ISOLATED POSTGRES ONLY, synthetic accounts. Run after original profile role
-- tests, teacher write fixtures and the review-only restrictive policies.
\set ON_ERROR_STOP on

-- A normal student must never create a teacher-class/assignment/course even
-- if the permissive ownership policy would otherwise accept their own user id.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-cccc-cccccccccccc',false);
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'teacher_classes','teacher_class_students','edu_assignments',
    'edu_assignment_questions','edu_assignment_targets',
    'edu_marketplace_courses','edu_marketplace_course_lessons'
  ] LOOP
    BEGIN
      EXECUTE format('INSERT INTO public.%I (teacher_id) VALUES (auth.uid())',tbl);
      RAISE EXCEPTION 'Unapproved learner wrote to %',tbl;
    EXCEPTION
      WHEN SQLSTATE '42501' THEN NULL;
    END;
  END LOOP;
END $$;

-- A legacy teacher role without an APPROVED application must also be denied.
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',false);
DO $$
BEGIN
  BEGIN
    INSERT INTO public.teacher_classes (teacher_id) VALUES (auth.uid());
    RAISE EXCEPTION 'Unreviewed legacy teacher was not blocked';
  EXCEPTION WHEN SQLSTATE '42501' THEN NULL;
  END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',false);

-- Simulate a privileged backend approving only after out-of-band verification.
-- This is test data and is NOT an implementation of admin approval.
UPDATE public.profile_role_requests
  SET status='approved',
      reviewed_by='cccccccc-cccc-4ccc-cccc-cccccccccccc',
      reviewed_at=now()
  WHERE user_id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
    AND requested_role='teacher';

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',false);

DO $$
DECLARE tbl text; total integer;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'teacher_classes','teacher_class_students','edu_assignments',
    'edu_assignment_questions','edu_assignment_targets',
    'edu_marketplace_courses','edu_marketplace_course_lessons'
  ] LOOP
    EXECUTE format('INSERT INTO public.%I (teacher_id) VALUES (auth.uid())',tbl);
    EXECUTE format('SELECT count(*) FROM public.%I WHERE teacher_id=auth.uid()',tbl) INTO total;
    IF total<>1 THEN RAISE EXCEPTION 'Approved teacher could not write %',tbl; END IF;
  END LOOP;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',false);

-- Revoked teacher role must not maintain rights based on stale approval.
UPDATE public.profile_role_requests SET status='rejected', reviewed_at=now(),
 reviewed_by='cccccccc-cccc-4ccc-cccc-cccccccccccc'
WHERE user_id='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',false);
DO $
BEGIN
  -- UPDATE with a restrictive USING policy can affect zero rows rather than
  -- raising 42501. Verify the protected field, not only the HTTP/SQL status.
  UPDATE public.teacher_classes SET title='after-revocation' WHERE teacher_id=auth.uid();
  IF EXISTS (SELECT 1 FROM public.teacher_classes WHERE title='after-revocation') THEN
    RAISE EXCEPTION 'Revoked teacher could update own class';
  END IF;
END $;
RESET ROLE;
\echo 'DISPOSABLE APPROVAL-GATED TEACHER DATA API REGRESSION PASSED'
