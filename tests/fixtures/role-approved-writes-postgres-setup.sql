-- Disposable PostgreSQL regression fixture, not representative of all real table columns.
-- The purpose is proving that restrictive approval policies intersect with
-- a permissive owner-writes policy; production schema must be separately tested.
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT coalesce(current_setting('request.jwt.claim.is_admin', true), '') = 'true';
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.teacher_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL DEFAULT 'test-only'
);
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.teacher_classes TO authenticated;
CREATE POLICY fake_owner_all_teacher_classes ON public.teacher_classes
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.teacher_class_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL DEFAULT 'test-only'
);
ALTER TABLE public.teacher_class_students ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.teacher_class_students TO authenticated;
CREATE POLICY fake_owner_all_teacher_class_students ON public.teacher_class_students
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.edu_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL DEFAULT 'test-only'
);
ALTER TABLE public.edu_assignments ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.edu_assignments TO authenticated;
CREATE POLICY fake_owner_all_edu_assignments ON public.edu_assignments
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.edu_assignment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL DEFAULT 'test-only'
);
ALTER TABLE public.edu_assignment_questions ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.edu_assignment_questions TO authenticated;
CREATE POLICY fake_owner_all_edu_assignment_questions ON public.edu_assignment_questions
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.edu_assignment_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL DEFAULT 'test-only'
);
ALTER TABLE public.edu_assignment_targets ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.edu_assignment_targets TO authenticated;
CREATE POLICY fake_owner_all_edu_assignment_targets ON public.edu_assignment_targets
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.edu_marketplace_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL DEFAULT 'test-only'
);
ALTER TABLE public.edu_marketplace_courses ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.edu_marketplace_courses TO authenticated;
CREATE POLICY fake_owner_all_edu_marketplace_courses ON public.edu_marketplace_courses
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.edu_marketplace_course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL DEFAULT 'test-only'
);
ALTER TABLE public.edu_marketplace_course_lessons ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.edu_marketplace_course_lessons TO authenticated;
CREATE POLICY fake_owner_all_edu_marketplace_course_lessons ON public.edu_marketplace_course_lessons
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

