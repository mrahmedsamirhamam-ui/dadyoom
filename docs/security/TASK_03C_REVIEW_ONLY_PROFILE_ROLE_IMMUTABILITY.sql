-- =====================================================================
-- TASK 03-C / Issue #117 — REVIEW ONLY. NOT A MIGRATION. NOT APPLIED.
-- =====================================================================
-- Location is intentionally docs/security/, NOT supabase/migrations/, so no
-- automated migration path can apply it. Do not run against production.
--
-- Scope: the application-layer fix in this branch removes client-controlled
-- role selection from profile completion, email signup and OAuth callback.
-- Issue #117 also documents database-layer paths (direct PostgREST UPDATE of
-- profiles.role, direct privileged INSERT, and auth.users metadata-derived
-- role assignment) that an application guard alone cannot stop.
--
-- SUPERSEDED FOR TASK 03-D: use
-- TASK_03D_REVIEW_ONLY_ISSUE117_DB_PROTECTION.sql, which also covers pending
-- approval, audit/atomicity, RPC grants, one-time self-signup role selection,
-- and a reviewed rollback. This file is retained for diff/change history.
--
-- Assumptions: only objects explicitly named in Issue #117 are referenced:
-- public.profiles and public.handle_new_user(). The current production
-- definition, grants and policies are NOT in this repository. Take a read-only
-- inventory and adapt this draft in a disposable database before any review.
--
-- Required preconditions before even a disposable test:
--   1. Verify every server/admin writer of public.profiles (service role).
--   2. Verify the actual handle_new_user() definition and grants.
--   3. Snapshot current policies, triggers, grants and function definitions.
--   4. Rehearse rollback without restoring the vulnerable self-promotion path.
-- =====================================================================

BEGIN;

-- 1. Remove broad table-wide INSERT/UPDATE from client roles.
--    Service-role server paths bypass RLS and remain available.
REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated;

-- 2. Allow only non-authorization fields to be changed by an authenticated
--    owner. Column-level UPDATE does not grant role/id/email mutation.
GRANT UPDATE (full_name, country) ON public.profiles TO authenticated;

-- 3. Lock authorization columns on UPDATE. Trusted server roles are excluded;
--    client roles can never change id, email or role, even via direct REST.
CREATE OR REPLACE FUNCTION public.task03c_lock_profile_authorization()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('postgres', 'service_role') THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'PROFILE_AUTHORIZATION_FIELDS_IMMUTABLE'
      USING errcode = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task03c_lock_profile_authorization ON public.profiles;
CREATE TRIGGER trg_task03c_lock_profile_authorization
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.task03c_lock_profile_authorization();

-- 4. Restrictive policies intersect with existing permissive policies.
--    They grant no new access; they only narrow anon/authenticated writes.
DROP POLICY IF EXISTS task03c_no_direct_profile_insert ON public.profiles;
CREATE POLICY task03c_no_direct_profile_insert
  ON public.profiles AS RESTRICTIVE
  FOR INSERT TO anon, authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS task03c_owner_profile_update ON public.profiles;
CREATE POLICY task03c_owner_profile_update
  ON public.profiles AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 5. NOT IMPLEMENTED HERE: public.handle_new_user() currently derives
--    profiles.role from user-editable raw_user_meta_data.role (Issue #117).
--    Its definition is absent from this repository. After read-only retrieval,
--    a reviewed replacement must create new profiles with role = 'student'
--    and must never read metadata.role as an authority. Do not guess the
--    function body or apply this file without that reviewed replacement.

COMMIT;

-- Rollback must be rehearsed from the saved definitions. Do not restore the
-- vulnerable RLS policies/trigger that allowed self-service role promotion.
