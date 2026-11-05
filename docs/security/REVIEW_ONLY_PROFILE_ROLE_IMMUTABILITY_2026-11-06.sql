-- SECURITY REVIEW ONLY — NOT EXECUTED ON PRODUCTION.
-- Dadyoom profiles existing trigger trg_protect_profile_role_escalation is already in production.
-- On 2026-11-06 its handler forbids assigning 'admin' directly, but allows
-- self-service role changes student -> teacher/parent/school.
-- This change protects all persisted roles from authenticated self-updates.
-- DO NOT run before validating signup, onboarding, teacher enrollment and
-- support-admin profile workflows in a nonproduction copy.
--
-- Proposed migration (to be generated with Supabase CLI once approved):
CREATE OR REPLACE FUNCTION public.protect_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Authenticated browser clients cannot change any existing profile role.
  -- Privileged server operations use a service-role credential, not the
  -- end user's JWT, and can still migrate roles through approved workflows.
  IF (SELECT auth.uid()) IS NOT NULL AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Profile role changes require an authorized administrator'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- Post-deployment verification (run from a disposable authenticated test user
-- on nonproduction; do not impersonate real student identities):
-- 1. student -> teacher through REST PATCH must be rejected with 42501.
-- 2. student -> school, parent, child, admin must also be rejected.
-- 3. Updating full_name/country without a role change must still work.
-- 4. Server-backed complete-profile for a brand-new user must still work.
-- 5. A privileged admin's intentional role reassignment must still work.
-- 6. Confirm all 22-country grade roles and current RLS remain unaffected.
--
-- Rollback (only after recording and reviewing old function definition):
-- Restore previous function with the same signature and trigger binding.
-- No action has been taken against production by storing this file.
