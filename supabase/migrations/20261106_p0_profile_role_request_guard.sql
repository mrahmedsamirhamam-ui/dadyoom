-- P0 #117: remove client-controlled privilege grants through profiles and Auth signup.
-- APPLY ONLY IN A COORDINATED RELEASE with role-request-aware application code.
-- Existing teacher/school roles are preserved, NOT silently grandfathered as
-- verified: administrators must review their pre-migration provenance.
-- This migration contains no student record deletes or blanket role rewrites.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS requested_role text,
  ADD COLUMN IF NOT EXISTS requested_role_at timestamptz,
  ADD COLUMN IF NOT EXISTS role_approved_by uuid,
  ADD COLUMN IF NOT EXISTS role_approved_at timestamptz;

-- When present, requested_role is only a REQUEST, never authorization.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_requested_role_safe_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_requested_role_safe_check
      CHECK (requested_role IS NULL OR requested_role IN ('teacher', 'school'));
  END IF;
END;
$$;

-- Old client policies allowed direct insert of teacher/school. Neither a
-- separate INSERT policy nor a UI-only check is an authorization boundary.
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
REVOKE INSERT ON TABLE public.profiles FROM anon, authenticated;
REVOKE DELETE ON TABLE public.profiles FROM anon, authenticated;

-- Preserve self-service editing of non-privileged profile fields only. An
-- authenticated user cannot change id, email, role, requested_role or audit
-- data even by calling the Supabase REST endpoint directly.
REVOKE UPDATE ON TABLE public.profiles FROM anon, authenticated;
GRANT UPDATE (
  full_name, country, grade_number, interests, learning_goal,
  preferred_learning_style, onboarding_completed, grade_academic_year,
  country_source, onboarding_updated_at
) ON TABLE public.profiles TO authenticated;

-- Defense-in-depth: if grants accidentally change later, reject role,
-- identity and approval-field mutations from ordinary logged-in clients.
-- Service-role/admin-controlled operations can still approve requested roles.
CREATE OR REPLACE FUNCTION public.protect_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND (
    NEW.id IS DISTINCT FROM OLD.id OR
    NEW.email IS DISTINCT FROM OLD.email OR
    NEW.role IS DISTINCT FROM OLD.role OR
    NEW.requested_role IS DISTINCT FROM OLD.requested_role OR
    NEW.role_approved_by IS DISTINCT FROM OLD.role_approved_by OR
    NEW.role_approved_at IS DISTINCT FROM OLD.role_approved_at
  ) THEN
    RAISE EXCEPTION 'Protected account role or identity may only be changed by an authorised service'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- Existing BEFORE UPDATE OF role trigger must protect other identity fields
-- too. Rename is unnecessary: keep familiar trigger name, change its scope.
DROP TRIGGER IF EXISTS trg_protect_profile_role_escalation ON public.profiles;
CREATE TRIGGER trg_protect_profile_role_escalation
  BEFORE UPDATE ON public.profiles FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role_escalation();

-- IMPORTANT: signup data in auth.users.raw_user_meta_data is user-editable.
-- New teacher/school signups stay in a safe student role until an approved
-- administrator explicitly approves the requested role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  selected_role text;
  safe_role text;
  requested text;
BEGIN
  selected_role := lower(trim(coalesce(NEW.raw_user_meta_data->>'role', 'student')));
  safe_role := CASE
    WHEN selected_role IN ('student', 'child', 'parent') THEN selected_role
    ELSE 'student'
  END;
  requested := CASE
    WHEN selected_role IN ('teacher', 'school') THEN selected_role
    ELSE NULL
  END;

  INSERT INTO public.profiles (
    id, full_name, role, country, email, requested_role, requested_role_at
  )
  VALUES (
    NEW.id,
    LEFT(coalesce(
      nullif(trim(NEW.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(NEW.raw_user_meta_data->>'name'), ''),
      split_part(coalesce(NEW.email, ''), '@', 1),
      'مستخدم ضاديوم'
    ), 120),
    safe_role,
    nullif(upper(trim(NEW.raw_user_meta_data->>'country')), ''),
    NEW.email,
    requested,
    CASE WHEN requested IS NOT NULL THEN now() ELSE NULL END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Neither of these SECURITY DEFINER triggers should be invoked as public RPCs.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_role_escalation() FROM PUBLIC, anon, authenticated;

COMMIT;

-- Post-release (read-only) checks:
-- SELECT has_table_privilege('authenticated','public.profiles','INSERT');
-- SELECT has_column_privilege('authenticated','public.profiles','role','UPDATE');
-- SELECT has_column_privilege('authenticated','public.profiles','full_name','UPDATE');
-- SELECT pg_get_functiondef('public.handle_new_user()'::regprocedure);
-- SELECT pg_get_triggerdef(oid) FROM pg_trigger
--   WHERE tgrelid='public.profiles'::regclass
--   AND tgname='trg_protect_profile_role_escalation';
--
-- STOP-SHIP: Migrate app role-request handling and test Google/email signup,
-- admin approval, student->teacher denial and rollback on an isolated DB
-- BEFORE executing this on production.
