-- REVIEWED STAGING CANDIDATE ONLY. NEVER paste into production without
-- real JWT tests, rollback plan, and an explicit release approval.
--
-- Issue #117: public.profiles is RLS-enabled but its existing UPDATE
-- trigger/policy still allows student -> teacher/school and its INSERT policy
-- allows unverified privileged accounts.
--
-- Defense in depth: an independent BEFORE INSERT/UPDATE trigger on top of
-- existing RLS. This does NOT replace per-table RLS for resources, nor
-- approve any service_role caller. Browser users cannot create teacher/school
-- accounts or mutate roles; a server-only approved administrator workflow
-- is required for those roles.
--
-- PRE-APPLY (read-only, on staging):
-- select polname, polcmd, pg_get_expr(polqual,polrelid) as using_expr,
--        pg_get_expr(polwithcheck,polrelid) as check_expr
-- from pg_policy where polrelid = 'public.profiles'::regclass;
-- select tgname, pg_get_triggerdef(oid) from pg_trigger
-- where tgrelid='public.profiles'::regclass and not tgisinternal;
-- select grantee,privilege_type from information_schema.role_table_grants
-- where table_schema='public' and table_name='profiles';
--
BEGIN;
CREATE OR REPLACE FUNCTION public.dadyoom_reject_unapproved_profile_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- A service_role or vetted privileged administrator must still be
  -- independently checked in its SERVER API before it can create a role.
  -- Never equate browser-controlled JWT user_metadata with approval.
  IF current_user = 'authenticated' THEN
    IF auth.uid() IS NULL OR NEW.id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'profile owner mismatch' USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'INSERT' THEN
      -- Parent registration does NOT grant cross-child access by itself;
      -- linked-child access must have independent RLS and consent checks.
      IF NEW.role::text NOT IN ('student', 'child', 'parent') THEN
        RAISE EXCEPTION 'unverified profile role' USING ERRCODE = '42501';
      END IF;
    ELSE
      IF NEW.role IS DISTINCT FROM OLD.role
         OR NEW.id IS DISTINCT FROM OLD.id
         OR NEW.email IS DISTINCT FROM OLD.email THEN
        RAISE EXCEPTION 'immutable profile identity and role' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dadyoom_block_unapproved_profile_role ON public.profiles;
CREATE TRIGGER trg_dadyoom_block_unapproved_profile_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.dadyoom_reject_unapproved_profile_roles();

REVOKE EXECUTE ON FUNCTION public.dadyoom_reject_unapproved_profile_roles()
  FROM PUBLIC, anon, authenticated;
COMMIT;

-- REQUIRED STAGING TEST MATRIX (real authenticated JWTs, not a postgres
-- superuser): student -> teacher, parent, school and admin UPDATE = DENIED;
-- direct self INSERT as teacher/school/admin = DENIED;
-- different id/email UPDATE = DENIED; own name/country UPDATE = ALLOWED;
-- self student/child/parent INSERT = ALLOWED only if existing INSERT policy
-- permits; approved service_role admin INSERT teacher = ALLOWED;
-- check parent/teacher/school row-level access on foreign tenants.
--
-- AFTER-APPLY (read only): verify both old and new triggers exist,
-- inspect RLS policies and grants, run security advisors and application
-- regression tests. Back up the original trigger/function definitions.
--
-- ROLLBACK (staging only, after authorization):
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_dadyoom_block_unapproved_profile_role ON public.profiles;
-- DROP FUNCTION IF EXISTS public.dadyoom_reject_unapproved_profile_roles();
-- COMMIT;
