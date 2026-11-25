-- =====================================================================
-- TASK 03-D / Issue #117 — REVIEW ONLY. NOT A MIGRATION. NOT APPLIED.
-- =====================================================================
-- Location is intentionally docs/security/, NOT supabase/migrations/, so no
-- automated migration path can apply it. Do not run against production,
-- staging, a linked Supabase project, or any database containing real data.
--
-- Purpose: close the DATABASE-layer paths that the TASK 03-C application fix
-- cannot close: direct PostgREST INSERT/UPDATE of public.profiles.role and a
-- SECURITY DEFINER handle_new_user() that reads user-editable auth metadata.
--
-- Verified from the local clone and Issue #117 (do not invent further schema):
--   * public.profiles has id, email, role, full_name, country (repo callers).
--   * auth.users has id, email, raw_user_meta_data (Supabase/Issue #117).
--   * "Users insert own profile" and "Users update own profile" exist.
--   * trg_protect_profile_role_escalation exists but is insufficient.
--   * public.handle_new_user() exists; its definition is NOT in this repo.
--
-- Hard preconditions before any isolated rehearsal:
--   1. Take a read-only catalog snapshot of policies, grants, triggers,
--      function definitions and role memberships; keep it outside the DB.
--   2. Confirm profiles.role/full_name/country are nullable as assumed below.
--      If NOT NULL, use a reviewed empty-string baseline instead of NULL.
--   3. Confirm the auth.users trigger that calls handle_new_user() exists and
--      that no other SECURITY DEFINER writer can assign profiles.role.
--   4. Rehearse in a DISPOSABLE, UNLINKED, LOOPBACK PostgreSQL/Supabase DB
--      with synthetic users only. Real GoTrue/PostgREST tests are mandatory.
--   5. Update complete-profile, OAuth callback and onboarding page to call the
--      reviewed RPC below only when TASK03D_ONBOARDING_RPC_MODE=on. Production
--      must remain in the default 'off' mode until this SQL is applied and
--      verified. Without coordination, parent/child self-selection can be
--      frozen at the safe 'student' baseline; do not ship SQL alone.
--   6. The one-time onboarding token (profile_onboarding_pending) is created by
--      the auth trigger and consumed atomically by the RPC. It prevents an
--      existing student from changing roles by replaying the onboarding API.
--
-- Explicit permissions only. There is no numeric role hierarchy.
--   SELF-SIGNUP ALLOWLIST: student, child, parent
--   PRIVILEGED (approval required): teacher, school, admin
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Read-only isolation and inventory. Run this section first.
-- ---------------------------------------------------------------------
DO $isolation$
BEGIN
  IF current_database() ~* '(^|[^a-z0-9])(prod|production)([^a-z0-9]|$)' THEN
    RAISE EXCEPTION 'TASK03D_REFUSED: production-like database name';
  END IF;
  -- The workflow fails closed unless the client-side DB_URL is loopback.
  -- Supabase Local publishes that port from Docker, so the backend may report
  -- a private bridge address. Public server IPs remain refused here.
  IF inet_server_addr() IS NOT NULL
     AND NOT (
       inet_server_addr() <<= inet '127.0.0.0/8'
       OR inet_server_addr() <<= inet '10.0.0.0/8'
       OR inet_server_addr() <<= inet '172.16.0.0/12'
       OR inet_server_addr() <<= inet '192.168.0.0/16'
     ) THEN
    RAISE EXCEPTION 'TASK03D_REFUSED: database endpoint is not loopback or private container network';
  END IF;
END
$isolation$;

-- Record these results in the review report before changing anything:
-- SELECT current_database(), inet_server_addr(), current_user, version();
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
--   FROM pg_policies
--  WHERE schemaname IN ('public','auth')
--  ORDER BY 1,2,3;
-- SELECT table_name, grantee, privilege_type, column_name
--   FROM information_schema.role_table_grants
--  WHERE table_schema='public' AND table_name='profiles'
--  ORDER BY 2,3,4;
-- SELECT p.oid::regprocedure AS function, p.prosecdef, p.proconfig,
--        pg_get_functiondef(p.oid) AS definition
--   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
--  WHERE n.nspname='public' AND p.proname IN
--        ('handle_new_user','protect_profile_role_escalation','is_admin')
--  ORDER BY 1;
-- SELECT tgname, pg_get_triggerdef(oid) AS definition
--   FROM pg_trigger
--  WHERE tgrelid IN ('public.profiles'::regclass,'auth.users'::regclass)
--    AND NOT tgisinternal
--  ORDER BY 1;

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Approval and audit tables. No client role can write these objects.
--    Approval authority starts EMPTY; a verified operator must provision it.
-- ---------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE TABLE IF NOT EXISTS private.role_approval_authorities (
  reviewer_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  authorization_reference text NOT NULL
    CHECK (length(btrim(authorization_reference)) > 8),
  enrolled_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE private.role_approval_authorities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.role_approval_authorities
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE private.role_approval_authorities TO service_role;

CREATE TABLE IF NOT EXISTS public.profile_role_requests (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role text NOT NULL
    CHECK (requested_role IN ('teacher','school','admin')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  CONSTRAINT task03d_review_fields_consistent CHECK (
    (status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL)
    OR (status IN ('approved','rejected')
        AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
  )
);
ALTER TABLE public.profile_role_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profile_role_requests
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.profile_role_requests TO authenticated;
GRANT SELECT ON TABLE public.profile_role_requests TO service_role;

-- Permissive owner-read policy: RLS has no implicit allow, so a restrictive
-- policy alone would hide every row. No client INSERT/UPDATE/DELETE grant exists.
DROP POLICY IF EXISTS task03d_own_role_request_read
  ON public.profile_role_requests;
CREATE POLICY task03d_own_role_request_read
  ON public.profile_role_requests FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE TABLE IF NOT EXISTS public.profile_role_review_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role text NOT NULL
    CHECK (requested_role IN ('teacher','school','admin')),
  decision text NOT NULL CHECK (decision IN ('approved','rejected')),
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL CHECK (length(btrim(reason)) >= 12),
  decided_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.profile_role_review_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profile_role_review_audit
  FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.profile_self_signup_audit (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_role text NOT NULL
    CHECK (selected_role IN ('student','child','parent')),
  selected_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.profile_self_signup_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profile_self_signup_audit
  FROM PUBLIC, anon, authenticated;

-- One-time onboarding token. Created only by the auth trigger for a NEW
-- account and consumed by the RPC with DELETE ... RETURNING. A pre-existing
-- student has no token and cannot claim to be a newly registered user.
CREATE TABLE IF NOT EXISTS public.profile_onboarding_pending (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.profile_onboarding_pending ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profile_onboarding_pending
  FROM PUBLIC, anon, authenticated;

-- Audited repair for genuinely pre-existing incomplete profiles. It is never
-- callable by the account owner; an independently authorized operator must
-- verify and issue the token. See task03d_issue_legacy_onboarding_token().
CREATE TABLE IF NOT EXISTS public.profile_onboarding_repair_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL CHECK (length(btrim(reason)) >= 12),
  decided_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.profile_onboarding_repair_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profile_onboarding_repair_audit
  FROM PUBLIC, anon, authenticated;

-- Server-held verification reads only. These grants never reach anon or
-- authenticated clients; RLS and column grants remain client barriers.
GRANT SELECT ON TABLE public.profile_role_review_audit TO service_role;
GRANT SELECT ON TABLE public.profile_self_signup_audit TO service_role;
GRANT SELECT ON TABLE public.profile_onboarding_pending TO service_role;
GRANT SELECT ON TABLE public.profile_onboarding_repair_audit TO service_role;

-- ---------------------------------------------------------------------
-- 2. Safe auth trigger. SECURITY DEFINER is required only to create the
--    baseline profile when auth.users is inserted by GoTrue. It NEVER reads
--    raw_user_meta_data.role as authorization. A privileged metadata intent
--    creates a pending application, not a privileged profile.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_intent text := lower(btrim(
    coalesce(NEW.raw_user_meta_data ->> 'role', '')
  ));
  v_inserted integer := 0;
BEGIN
  -- Explicit baseline. full_name/country remain NULL so onboarding can
  -- distinguish a fresh account from a completed profile. Verify nullability
  -- before applying; see preconditions above.
  INSERT INTO public.profiles (id, email, role, full_name, country)
  VALUES (NEW.id, NEW.email, 'student', NULL, NULL)
  ON CONFLICT (id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- Only a genuinely new auth.users INSERT receives a one-time token.
  IF v_inserted = 1 THEN
    INSERT INTO public.profile_onboarding_pending (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- An application is not an approval. Do not create this row for 'admin'.
  IF v_intent IN ('teacher','school') THEN
    INSERT INTO public.profile_role_requests (user_id, requested_role)
    VALUES (NEW.id, v_intent)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user()
  TO postgres, service_role, supabase_auth_admin;

-- ---------------------------------------------------------------------
-- 3. Independent database barriers for client (PostgREST) writes.
--    Service-role/admin server paths remain available and must be audited.
-- ---------------------------------------------------------------------
REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.profiles TO service_role;
GRANT UPDATE (full_name, country) ON TABLE public.profiles TO authenticated;
-- Deliberately NO table-wide INSERT/UPDATE/DELETE and NO UPDATE(role/id/email).

CREATE OR REPLACE FUNCTION public.task03d_guard_profile_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
DECLARE
  v_db_role text := current_user;
  v_jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  v_jwt_sub text := coalesce(current_setting('request.jwt.claim.sub', true), '');
  v_onboarding_sub text := coalesce(current_setting('task03d.onboarding_update', true), '');
BEGIN
  IF v_db_role IN ('anon','authenticated') OR v_jwt_role = 'authenticated' THEN
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'TASK03D_PROFILE_AUTHORIZATION_FIELDS_IMMUTABLE'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      -- The only permitted client-originated role change is the controlled
      -- SECURITY DEFINER RPC. It sets a transaction-local context to the
      -- authenticated user id immediately before its guarded UPDATE. Reject
      -- every other change, including a bare authenticated UPDATE.
      IF v_onboarding_sub = ''
         OR v_onboarding_sub IS DISTINCT FROM OLD.id::text
         OR v_jwt_sub IS DISTINCT FROM OLD.id::text
         OR lower(btrim(coalesce(OLD.role, ''))) <> 'student'
         OR lower(btrim(coalesce(NEW.role, ''))) NOT IN ('student','child','parent') THEN
        RAISE EXCEPTION 'TASK03D_PROFILE_AUTHORIZATION_FIELDS_IMMUTABLE'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.task03d_guard_profile_identity()
  FROM PUBLIC, anon, authenticated;

-- If the separate TASK 03-C draft was ever applied in this catalog, retire it
-- here so the TASK 03-D guard is the single role-authorization barrier.
DROP TRIGGER IF EXISTS trg_task03c_lock_profile_authorization ON public.profiles;
DROP FUNCTION IF EXISTS public.task03c_lock_profile_authorization();

DROP TRIGGER IF EXISTS trg_task03d_guard_profile_identity ON public.profiles;
CREATE TRIGGER trg_task03d_guard_profile_identity
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.task03d_guard_profile_identity();

CREATE OR REPLACE FUNCTION public.task03d_guard_profile_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
DECLARE
  v_db_role text := current_user;
  v_jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF (v_db_role IN ('anon','authenticated') OR v_jwt_role = 'authenticated')
     AND NEW.role NOT IN ('student','child','parent') THEN
    RAISE EXCEPTION 'TASK03D_PRIVILEGED_PROFILE_INSERT_DENIED'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.task03d_guard_profile_insert()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_task03d_guard_profile_insert ON public.profiles;
CREATE TRIGGER trg_task03d_guard_profile_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.task03d_guard_profile_insert();

DROP POLICY IF EXISTS task03d_profile_read_restrict ON public.profiles;
CREATE POLICY task03d_profile_read_restrict
  ON public.profiles AS RESTRICTIVE FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS task03d_profile_update_restrict ON public.profiles;
CREATE POLICY task03d_profile_update_restrict
  ON public.profiles AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS task03d_profile_no_client_insert ON public.profiles;
CREATE POLICY task03d_profile_no_client_insert
  ON public.profiles AS RESTRICTIVE FOR INSERT TO anon, authenticated
  WITH CHECK (false);

-- ---------------------------------------------------------------------
-- 4. Controlled one-time self-signup completion RPC.
--    The role parameter is still user-supplied, but it is only a selection
--    from an explicit non-privileged allowlist; identity comes from auth.uid().
--    A auth-trigger-issued token is consumed with DELETE ... RETURNING, so the
--    call is authenticated, atomic and one-time. An existing student has no
--    token and cannot pretend to be a newly registered user. This RPC never
--    touches parent/child link tables or any other user's data. Privileged
--    roles and admin are unreachable from this function.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.task03d_complete_self_signup(
  p_full_name text,
  p_country text,
  p_role text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_user_id uuid := (SELECT auth.uid());
  v_old_role text;
  v_requested_role text := lower(btrim(coalesce(p_role, '')));
  v_name text := btrim(coalesce(p_full_name, ''));
  v_country text := upper(btrim(coalesce(p_country, '')));
  v_selected_role text;
  v_pending_at timestamptz;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'TASK03D_UNAUTHENTICATED' USING ERRCODE = '42501';
  END IF;
  IF v_name = '' OR length(v_name) > 120 OR v_country = '' THEN
    RAISE EXCEPTION 'TASK03D_INVALID_PROFILE_FIELDS' USING ERRCODE = '22023';
  END IF;
  IF v_requested_role NOT IN ('student','child','parent') THEN
    RAISE EXCEPTION 'TASK03D_ROLE_NOT_SELF_SIGNABLE' USING ERRCODE = '42501';
  END IF;

  -- Atomic one-time token. Concurrent calls cannot both delete the same row.
  DELETE FROM public.profile_onboarding_pending
   WHERE user_id = v_user_id
   RETURNING created_at INTO v_pending_at;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK03D_NO_PENDING_ONBOARDING'
      USING ERRCODE = '22023';
  END IF;

  SELECT role INTO v_old_role
    FROM public.profiles
   WHERE id = v_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK03D_PROFILE_NOT_FOUND' USING ERRCODE = '22023';
  END IF;
  v_old_role := lower(btrim(coalesce(v_old_role, '')));

  IF v_old_role <> 'student' THEN
    RAISE EXCEPTION 'TASK03D_PROFILE_BASELINE_CHANGED'
      USING ERRCODE = '40001';
  END IF;

  SELECT selected_role INTO v_selected_role
    FROM public.profile_self_signup_audit
   WHERE user_id = v_user_id;

  IF FOUND AND v_selected_role <> v_requested_role THEN
    RAISE EXCEPTION 'TASK03D_SELF_SIGNUP_ROLE_FINAL'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.profile_self_signup_audit (user_id, selected_role)
  VALUES (v_user_id, v_requested_role)
  ON CONFLICT (user_id) DO NOTHING;

  -- The identity guard permits a role change only while this transaction-local
  -- context names the authenticated user. It is set by this SECURITY DEFINER
  -- function after all authorization checks and cleared before RETURN.
  PERFORM set_config('task03d.onboarding_update', v_user_id::text, true);

  UPDATE public.profiles
     SET role = v_requested_role,
         full_name = v_name,
         country = v_country
   WHERE id = v_user_id
     AND role = 'student';

  PERFORM set_config('task03d.onboarding_update', '', true);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK03D_PROFILE_BASELINE_CHANGED'
      USING ERRCODE = '40001';
  END IF;

  RETURN v_requested_role;
END;
$fn$;

REVOKE ALL ON FUNCTION public.task03d_complete_self_signup(text,text,text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.task03d_complete_self_signup(text,text,text)
  TO authenticated;

-- ---------------------------------------------------------------------
-- 4b. Operator-only repair for a PRE-EXISTING incomplete baseline profile.
--     It never grants a role itself; it only issues the same audited one-time
--     token that the auth trigger issues to genuinely new accounts. Eligibility
--     is restricted to an incomplete, non-privileged profile with no prior
--     self-signup selection. The operator must be independently enrolled and
--     must hold a stored admin role. No user metadata is consulted.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.task03d_issue_legacy_onboarding_token(
  p_target_user_id uuid,
  p_operator_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_role text;
  v_name text;
  v_country text;
  v_reason text := btrim(coalesce(p_reason, ''));
BEGIN
  IF coalesce(
       current_setting('request.jwt.claim.role', true),
       current_setting('request.jwt.claims', true)::jsonb ->> 'role',
       ''
     ) <> 'service_role' THEN
    RAISE EXCEPTION 'TASK03D_LEGACY_REPAIR_NOT_SERVER_ONLY' USING ERRCODE = '42501';
  END IF;
  IF p_target_user_id IS NULL OR p_operator_id IS NULL
     OR p_target_user_id = p_operator_id OR length(v_reason) < 12 THEN
    RAISE EXCEPTION 'TASK03D_INVALID_LEGACY_REPAIR_REQUEST' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM private.role_approval_authorities a
      JOIN public.profiles p ON p.id = a.reviewer_id
     WHERE a.reviewer_id = p_operator_id
       AND lower(btrim(p.role)) = 'admin'
  ) THEN
    RAISE EXCEPTION 'TASK03D_REPAIR_OPERATOR_NOT_INDEPENDENTLY_AUTHORIZED'
      USING ERRCODE = '42501';
  END IF;

  SELECT role, full_name, country
    INTO v_role, v_name, v_country
    FROM public.profiles
   WHERE id = p_target_user_id
   FOR UPDATE;

  IF NOT FOUND OR lower(btrim(coalesce(v_role, ''))) <> 'student' THEN
    RAISE EXCEPTION 'TASK03D_LEGACY_PROFILE_NOT_ELIGIBLE' USING ERRCODE = '22023';
  END IF;
  IF coalesce(btrim(v_name), '') <> '' OR coalesce(btrim(v_country), '') <> '' THEN
    RAISE EXCEPTION 'TASK03D_LEGACY_PROFILE_NOT_INCOMPLETE' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.profile_self_signup_audit WHERE user_id = p_target_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.profile_onboarding_pending WHERE user_id = p_target_user_id
  ) THEN
    RAISE EXCEPTION 'TASK03D_LEGACY_REPAIR_ALREADY_SETTLED' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.profile_onboarding_pending (user_id)
  VALUES (p_target_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.profile_onboarding_repair_audit
    (target_user_id, operator_id, reason)
  VALUES
    (p_target_user_id, p_operator_id, v_reason);
END;
$fn$;

REVOKE ALL ON FUNCTION public.task03d_issue_legacy_onboarding_token(uuid,uuid,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.task03d_issue_legacy_onboarding_token(uuid,uuid,text)
  TO service_role;

-- ---------------------------------------------------------------------
-- 5. Atomic, audited privileged approval. Callable only by server-held
--    service_role credentials. Reviewer authority is independently stored,
--    cannot be self-granted, and is never inferred from metadata or role id.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.task03d_approve_profile_role_request(
  p_target_user_id uuid,
  p_reviewer_id uuid,
  p_decision text,
  p_reason text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_request public.profile_role_requests%ROWTYPE;
  v_updated integer;
  v_decision text := lower(btrim(coalesce(p_decision, '')));
  v_reason text := btrim(coalesce(p_reason, ''));
BEGIN
  IF coalesce(
       current_setting('request.jwt.claim.role', true),
       current_setting('request.jwt.claims', true)::jsonb ->> 'role',
       ''
     ) <> 'service_role' THEN
    RAISE EXCEPTION 'TASK03D_APPROVAL_NOT_SERVER_ONLY' USING ERRCODE = '42501';
  END IF;
  IF p_target_user_id IS NULL OR p_reviewer_id IS NULL
     OR p_target_user_id = p_reviewer_id
     OR v_decision NOT IN ('approved','rejected')
     OR length(v_reason) < 12 THEN
    RAISE EXCEPTION 'TASK03D_INVALID_REVIEW_REQUEST' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM private.role_approval_authorities a
      JOIN public.profiles p ON p.id = a.reviewer_id
     WHERE a.reviewer_id = p_reviewer_id
       AND lower(btrim(p.role)) = 'admin'
  ) THEN
    RAISE EXCEPTION 'TASK03D_REVIEWER_NOT_INDEPENDENTLY_AUTHORIZED'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_request
    FROM public.profile_role_requests
   WHERE user_id = p_target_user_id
   FOR UPDATE;

  IF NOT FOUND OR v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'TASK03D_NO_PENDING_REQUEST' USING ERRCODE = '22023';
  END IF;

  IF v_decision = 'approved' THEN
    UPDATE public.profiles
       SET role = v_request.requested_role
     WHERE id = p_target_user_id
       AND lower(btrim(role)) IN ('student','child','parent');
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated <> 1 THEN
      RAISE EXCEPTION 'TASK03D_PROFILE_NOT_APPROVABLE' USING ERRCODE = '40001';
    END IF;
  END IF;

  UPDATE public.profile_role_requests
     SET status = v_decision,
         reviewed_by = p_reviewer_id,
         reviewed_at = clock_timestamp()
   WHERE user_id = p_target_user_id;

  INSERT INTO public.profile_role_review_audit
    (target_user_id, requested_role, decision, reviewer_id, reason)
  VALUES
    (p_target_user_id, v_request.requested_role, v_decision, p_reviewer_id, v_reason);

  RETURN v_decision;
END;
$fn$;

REVOKE ALL ON FUNCTION public.task03d_approve_profile_role_request(uuid,uuid,text,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.task03d_approve_profile_role_request(uuid,uuid,text,text)
  TO service_role;

COMMIT;

-- ---------------------------------------------------------------------
-- Required coordinated application work (activation boundary):
--   * TASK03D_ONBOARDING_RPC_MODE must remain 'off' (default) until this SQL is
--     applied and verified in the target isolated environment. When 'on',
--     complete-profile and OAuth callback call task03d_complete_self_signup()
--     through the USER-scoped Supabase client so auth.uid() is genuine.
--   * Missing RPC or any RPC error must fail closed; never fall back to a
--     direct profile write or to storing a role from metadata/request body.
--   * The onboarding page may show the role form for a baseline student only
--     when activation is on; the RPC token, not the UI, authorizes the change.
--   * Pre-existing incomplete baseline profiles are repaired only by the
--     service-role task03d_issue_legacy_onboarding_token() after independent
--     operator verification; the account owner cannot self-repair. There is no
--     client-callable fallback and no backfill of completed profiles.
--   * Teacher/school/admin issuance must go through the service-role approval
--     RPC and a verified UI, not signup metadata, request body, or role id.
--   * Do not merge or deploy until real local GoTrue + PostgREST tests pass.
-- ---------------------------------------------------------------------
