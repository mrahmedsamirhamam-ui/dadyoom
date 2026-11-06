-- SECURITY REVIEW ONLY / NOT DEPLOYED — Issue #117 — 2026-11-06
-- PostgreSQL/Supabase proposal to validate in an ISOLATED nonproduction DB.
-- This deliberately changes the registration contract: teacher/school requests
-- remain pending until a verified, audited admin approval. Do not apply to
-- production without updating signup/OAuth/teacher/school pages and rollback.
--
-- Critical existing flaw verified on production (read-only):
-- 1. handle_new_user() SECURITY DEFINER derives profiles.role from
--    auth.users.raw_user_meta_data -> 'role' (USER-EDITABLE).
-- 2. "Users insert own profile" permits direct teacher/school INSERT.
-- 3. "Users update own profile" and the existing trigger permit own role changes.
--
-- Prerequisites: back up definitions/policies/grants, test migrations and
-- signup/OAuth in a disposable database, review current school/teacher flows.
BEGIN;

CREATE TABLE IF NOT EXISTS public.profile_role_requests (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role text NOT NULL CHECK (requested_role IN ('teacher','school')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  CONSTRAINT profile_role_request_review_consistency CHECK (
    (status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL)
    OR (status IN ('approved','rejected') AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)
  )
);

ALTER TABLE public.profile_role_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profile_role_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.profile_role_requests TO authenticated;

DROP POLICY IF EXISTS "Read own role request" ON public.profile_role_requests;
CREATE POLICY "Read own role request"
  ON public.profile_role_requests FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Existing users may keep their existing stored roles. Only a VERIFIED
-- privileged server workflow should approve an initial teacher/school role.
-- SECURITY DEFINER is required here solely to create the baseline profile on
-- auth.users INSERT. The function is trigger-only, not a user-callable RPC.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  intent text := lower(trim(coalesce(NEW.raw_user_meta_data->>'role', 'student')));
  initial_role text;
BEGIN
  initial_role := CASE
    WHEN intent IN ('child','parent','student') THEN intent
    ELSE 'student'
  END;

  INSERT INTO public.profiles (id, full_name, role, country, email)
  VALUES (
    NEW.id,
    coalesce(
      nullif(NEW.raw_user_meta_data->>'full_name',''),
      nullif(NEW.raw_user_meta_data->>'name',''),
      split_part(coalesce(NEW.email,''), '@', 1),
      'مستخدم ضاديوم'
    ),
    initial_role,
    nullif(NEW.raw_user_meta_data->>'country',''),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = coalesce(nullif(public.profiles.full_name,''), EXCLUDED.full_name),
    -- Never elevate an existing profile, even if auth metadata has changed.
    role = public.profiles.role,
    country = coalesce(public.profiles.country, EXCLUDED.country);

  IF intent IN ('teacher','school') THEN
    INSERT INTO public.profile_role_requests (user_id, requested_role)
    VALUES (NEW.id, intent)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Explicitly prevent direct client-side profile creation. Registration is
-- handled by the auth.users trigger and narrowly scoped server-side logic.
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
REVOKE INSERT ON TABLE public.profiles FROM authenticated, anon;

-- Restrict user updates to non-authorisation fields. Do not depend on
-- previous BEFORE UPDATE OF role trigger; a full BEFORE UPDATE protects ID
-- and email too. A verified server service-role operation can still approve
-- or change roles, and is expected to maintain an audit trail externally.
CREATE OR REPLACE FUNCTION public.protect_profile_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  IF (SELECT auth.uid()) IS NOT NULL THEN
    IF NEW.id IS DISTINCT FROM OLD.id OR
       NEW.role IS DISTINCT FROM OLD.role OR
       NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Profile identity and roles require verified administration'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_profile_role_escalation ON public.profiles;
CREATE TRIGGER trg_protect_profile_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role_escalation();

COMMIT;

-- NO PRIVILEGED APPROVAL RPC IS INSTALLED BY THIS PROPOSAL.
-- A future administrative approval route must validate an actual admin via
-- authenticated getUser(), verify all tenant and role evidence, write an
-- audit record, and perform role assignment only with server-held credentials.
-- It must not accept a role from user_metadata as proof of authority.
--
-- Migration/rollback must also update the email signup and OAuth callback:
-- a requested teacher or school account is a STUDENT profile with a pending
-- role request, not an instantly privileged account; UI must show "pending"
-- rather than automatically entering a teacher/school dashboard.
