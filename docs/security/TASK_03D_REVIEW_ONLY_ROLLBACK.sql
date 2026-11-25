-- =====================================================================
-- TASK 03-D / Issue #117 — REVIEW ONLY SECURITY-PRESERVING ROLLBACK
-- =====================================================================
-- NOT APPLIED. Rehearse only in the same disposable database used for the
-- review SQL. Do NOT restore the vulnerable metadata-derived handle_new_user,
-- "Users insert own profile", broad UPDATE, or permissive role trigger.
-- No DELETE, TRUNCATE, or rewrite of existing profile/user data is performed.
-- =====================================================================
BEGIN;

-- Disable further privileged approval capability first. Existing approvals,
-- applications, audit rows and safe baseline profiles remain intact.
REVOKE EXECUTE ON FUNCTION
  public.task03d_approve_profile_role_request(uuid,uuid,text,text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION
  public.task03d_issue_legacy_onboarding_token(uuid,uuid,text)
  FROM PUBLIC, anon, authenticated, service_role;

-- Disable and remove the user-facing completion RPC. It reads the token table
-- removed below, so leaving it callable would break every later invocation and
-- reverting to direct client writes would reopen Issue #117.
REVOKE EXECUTE ON FUNCTION
  public.task03d_complete_self_signup(text,text,text)
  FROM PUBLIC, anon, authenticated, service_role;
DROP FUNCTION IF EXISTS public.task03d_complete_self_signup(text,text,text);

-- Remove the new trigger objects if the whole review change must be unwound.
-- Keep restrictive RLS policies and revoked table privileges in place.
DROP TRIGGER IF EXISTS trg_task03d_guard_profile_identity ON public.profiles;
DROP TRIGGER IF EXISTS trg_task03d_guard_profile_insert ON public.profiles;

DROP FUNCTION IF EXISTS public.task03d_guard_profile_identity();
DROP FUNCTION IF EXISTS public.task03d_guard_profile_insert();
DROP FUNCTION IF EXISTS public.task03d_approve_profile_role_request(uuid,uuid,text,text);
DROP FUNCTION IF EXISTS public.task03d_issue_legacy_onboarding_token(uuid,uuid,text);

-- Drop only the newly introduced approval/token tables. Audit history can be
-- preserved for review; drop it only with explicit operator approval.
DROP TABLE IF EXISTS public.profile_role_requests;
DROP TABLE IF EXISTS public.profile_onboarding_pending;
DROP TABLE IF EXISTS private.role_approval_authorities;
-- DROP TABLE IF EXISTS public.profile_role_review_audit;
-- DROP TABLE IF EXISTS public.profile_self_signup_audit;

-- Restore a safe baseline trigger that ignores metadata roles and references
-- no dropped table. This is NOT the original Issue #117 vulnerable definition.
-- After rollback, privileged roles still require a separately reviewed path.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, country)
  VALUES (NEW.id, NEW.email, 'student', NULL, NULL)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user()
  TO postgres, service_role, supabase_auth_admin;

COMMIT;

-- Post-rollback assertions (read-only):
-- SELECT has_table_privilege('authenticated','public.profiles','INSERT'); -- false
-- SELECT has_table_privilege('authenticated','public.profiles','UPDATE'); -- false
-- SELECT to_regprocedure('public.task03d_complete_self_signup(text,text,text)'); -- NULL
-- SELECT to_regclass('public.profile_onboarding_pending'); -- NULL
-- SELECT prosecdef, proconfig, pg_get_functiondef(oid)
--   FROM pg_proc WHERE oid='public.handle_new_user()'::regprocedure;
-- pg_get_functiondef(handle_new_user) must not mention profile_onboarding_pending
-- or profile_role_requests after rollback.
