-- REVIEW ONLY / NEVER RUN AGAINST PRODUCTION WITHOUT APPROVAL.
-- Complements REVIEW_ONLY_ROLE_APPROVAL_AND_RLS_2026-11-06.sql.
-- Addresses direct REST writes which bypass app-layer guards in Issue #117.
-- Expected database: PostgreSQL 15+ with existing public.is_admin() check.
-- Apply ONLY in a disposable clone after taking and testing a full rollback.
-- The business owner must review teacher-vs-school write permissions first.
BEGIN;

-- Unlike a SECURITY DEFINER function, this respects the caller's RLS
-- on profiles and profile_role_requests (both have owner SELECT policies).
CREATE OR REPLACE FUNCTION public.dadyoom_verified_teacher_for_write()
RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = ''
AS $fn$
  SELECT coalesce(
    (EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.profile_role_requests r ON r.user_id=p.id
      WHERE p.id=(SELECT auth.uid())
        AND p.role='teacher'
        AND r.requested_role='teacher'
        AND r.status='approved'
        AND r.reviewed_by IS NOT NULL
        AND r.reviewed_at IS NOT NULL
    )) OR (SELECT public.is_admin()), false);
$fn$;
REVOKE ALL ON FUNCTION public.dadyoom_verified_teacher_for_write() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.dadyoom_verified_teacher_for_write() TO authenticated;

-- Restrictive policies INTERSECT with existing ownership checks;
-- they do not grant any new SELECT/INSERT/UPDATE/DELETE rights.
-- Service-role server writes must be separately audited and allowlisted.

DROP POLICY IF EXISTS dadyoom_verified_teacher_insert_gate ON public.teacher_classes;
CREATE POLICY dadyoom_verified_teacher_insert_gate ON public.teacher_classes
AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_update_gate ON public.teacher_classes;
CREATE POLICY dadyoom_verified_teacher_update_gate ON public.teacher_classes
AS RESTRICTIVE FOR UPDATE TO authenticated
USING ((SELECT public.dadyoom_verified_teacher_for_write()))
WITH CHECK ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_delete_gate ON public.teacher_classes;
CREATE POLICY dadyoom_verified_teacher_delete_gate ON public.teacher_classes
AS RESTRICTIVE FOR DELETE TO authenticated
USING ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_insert_gate ON public.teacher_class_students;
CREATE POLICY dadyoom_verified_teacher_insert_gate ON public.teacher_class_students
AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_update_gate ON public.teacher_class_students;
CREATE POLICY dadyoom_verified_teacher_update_gate ON public.teacher_class_students
AS RESTRICTIVE FOR UPDATE TO authenticated
USING ((SELECT public.dadyoom_verified_teacher_for_write()))
WITH CHECK ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_delete_gate ON public.teacher_class_students;
CREATE POLICY dadyoom_verified_teacher_delete_gate ON public.teacher_class_students
AS RESTRICTIVE FOR DELETE TO authenticated
USING ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_insert_gate ON public.edu_assignments;
CREATE POLICY dadyoom_verified_teacher_insert_gate ON public.edu_assignments
AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_update_gate ON public.edu_assignments;
CREATE POLICY dadyoom_verified_teacher_update_gate ON public.edu_assignments
AS RESTRICTIVE FOR UPDATE TO authenticated
USING ((SELECT public.dadyoom_verified_teacher_for_write()))
WITH CHECK ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_delete_gate ON public.edu_assignments;
CREATE POLICY dadyoom_verified_teacher_delete_gate ON public.edu_assignments
AS RESTRICTIVE FOR DELETE TO authenticated
USING ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_insert_gate ON public.edu_assignment_questions;
CREATE POLICY dadyoom_verified_teacher_insert_gate ON public.edu_assignment_questions
AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_update_gate ON public.edu_assignment_questions;
CREATE POLICY dadyoom_verified_teacher_update_gate ON public.edu_assignment_questions
AS RESTRICTIVE FOR UPDATE TO authenticated
USING ((SELECT public.dadyoom_verified_teacher_for_write()))
WITH CHECK ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_delete_gate ON public.edu_assignment_questions;
CREATE POLICY dadyoom_verified_teacher_delete_gate ON public.edu_assignment_questions
AS RESTRICTIVE FOR DELETE TO authenticated
USING ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_insert_gate ON public.edu_assignment_targets;
CREATE POLICY dadyoom_verified_teacher_insert_gate ON public.edu_assignment_targets
AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_update_gate ON public.edu_assignment_targets;
CREATE POLICY dadyoom_verified_teacher_update_gate ON public.edu_assignment_targets
AS RESTRICTIVE FOR UPDATE TO authenticated
USING ((SELECT public.dadyoom_verified_teacher_for_write()))
WITH CHECK ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_delete_gate ON public.edu_assignment_targets;
CREATE POLICY dadyoom_verified_teacher_delete_gate ON public.edu_assignment_targets
AS RESTRICTIVE FOR DELETE TO authenticated
USING ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_insert_gate ON public.edu_marketplace_courses;
CREATE POLICY dadyoom_verified_teacher_insert_gate ON public.edu_marketplace_courses
AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_update_gate ON public.edu_marketplace_courses;
CREATE POLICY dadyoom_verified_teacher_update_gate ON public.edu_marketplace_courses
AS RESTRICTIVE FOR UPDATE TO authenticated
USING ((SELECT public.dadyoom_verified_teacher_for_write()))
WITH CHECK ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_delete_gate ON public.edu_marketplace_courses;
CREATE POLICY dadyoom_verified_teacher_delete_gate ON public.edu_marketplace_courses
AS RESTRICTIVE FOR DELETE TO authenticated
USING ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_insert_gate ON public.edu_marketplace_course_lessons;
CREATE POLICY dadyoom_verified_teacher_insert_gate ON public.edu_marketplace_course_lessons
AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_update_gate ON public.edu_marketplace_course_lessons;
CREATE POLICY dadyoom_verified_teacher_update_gate ON public.edu_marketplace_course_lessons
AS RESTRICTIVE FOR UPDATE TO authenticated
USING ((SELECT public.dadyoom_verified_teacher_for_write()))
WITH CHECK ((SELECT public.dadyoom_verified_teacher_for_write()));

DROP POLICY IF EXISTS dadyoom_verified_teacher_delete_gate ON public.edu_marketplace_course_lessons;
CREATE POLICY dadyoom_verified_teacher_delete_gate ON public.edu_marketplace_course_lessons
AS RESTRICTIVE FOR DELETE TO authenticated
USING ((SELECT public.dadyoom_verified_teacher_for_write()));

COMMIT;

-- RELEASE BLOCKERS:
-- 1. Profile role/registration proposal must be approved and applied first.
-- 2. Confirm policy coverage for all teacher/school writes, storage and RPCs,
--    including whether any school owners should use separate approved permissions.
-- 3. Use REAL signed test JWTs and verify student cannot create a teacher class,
--    teacher cannot read another tenant, approved teacher works, admin still works.
-- 4. Do not merge on the basis of tests using only mock PostgreSQL schemas.
-- 5. On rollback NEVER re-enable the pre-existing self-promotion hole.
