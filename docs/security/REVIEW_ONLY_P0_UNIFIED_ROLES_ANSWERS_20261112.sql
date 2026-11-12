-- P0 DADYOOM ONLY. REVIEW/STAGING ONLY. DO NOT APPLY TO PRODUCTION.
-- Additive schema objects; existing profile/answer rows are neither deleted nor rewritten.
-- Approval authority starts EMPTY; an independently verified DBA must provision trusted reviewers.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS public.profile_role_requests (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 requested_role text NOT NULL CHECK (requested_role IN ('teacher','school','admin')),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 reviewed_at timestamptz,
 reviewed_by uuid REFERENCES auth.users(id),
 CONSTRAINT p0_review_fields CHECK ((status='pending' AND reviewed_at IS NULL AND reviewed_by IS NULL)
 OR (status IN ('approved','rejected') AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL))
);
ALTER TABLE public.profile_role_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profile_role_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.profile_role_requests TO authenticated;
CREATE POLICY p0_own_role_request ON public.profile_role_requests
  FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE TABLE IF NOT EXISTS private.role_approval_authorities (
 reviewer_id uuid PRIMARY KEY REFERENCES auth.users(id),
 authorization_reference text NOT NULL CHECK(length(trim(authorization_reference))>8),
 enrolled_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE private.role_approval_authorities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE private.role_approval_authorities FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT SELECT ON TABLE private.role_approval_authorities TO service_role;
CREATE TABLE IF NOT EXISTS public.profile_role_review_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 target_user_id uuid NOT NULL REFERENCES auth.users(id),
 requested_role text NOT NULL CHECK(requested_role IN ('teacher','school','admin')),
 decision text NOT NULL CHECK(decision IN ('approved','rejected')),
 reviewer_id uuid NOT NULL REFERENCES auth.users(id),
 reason text NOT NULL CHECK(length(trim(reason))>=12),
 decided_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE public.profile_role_review_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profile_role_review_audit FROM PUBLIC, anon, authenticated;
-- No user supplied metadata or cookie may grant any role, including parent/child.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $p0$
BEGIN
 INSERT INTO public.profiles (id, email, role, full_name, country)
 VALUES (
  NEW.id, NEW.email, 'student',
  coalesce(nullif(left(NEW.raw_user_meta_data->>'full_name',120),''),
           split_part(coalesce(NEW.email,''),'@',1), 'مستخدم ضاديوم'),
  nullif(left(NEW.raw_user_meta_data->>'country',3),'')
 )
 ON CONFLICT (id) DO NOTHING;
 RETURN NEW;
END;
$p0$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- DB column grants, BEFORE trigger and RLS are three independent barriers.
CREATE OR REPLACE FUNCTION public.p0_guard_profile_identity()
RETURNS trigger LANGUAGE plpgsql SET search_path=''
AS $p0$
BEGIN
 IF current_user IN ('authenticated','anon') AND
   (NEW.id IS DISTINCT FROM OLD.id OR NEW.role IS DISTINCT FROM OLD.role
    OR NEW.email IS DISTINCT FROM OLD.email)
 THEN RAISE EXCEPTION 'Profile authorization columns are immutable'
      USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END;
$p0$;
REVOKE ALL ON FUNCTION public.p0_guard_profile_identity() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER p0_guard_profile_identity_before_update
 BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.p0_guard_profile_identity();
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE(full_name,country) ON TABLE public.profiles TO authenticated;
CREATE POLICY p0_own_profile_read ON public.profiles FOR SELECT TO authenticated
 USING (id=(SELECT auth.uid()));
CREATE POLICY p0_profile_read_restrict AS RESTRICTIVE ON public.profiles FOR SELECT
 TO authenticated USING (id=(SELECT auth.uid()));
CREATE POLICY p0_profile_update_restrict AS RESTRICTIVE ON public.profiles FOR UPDATE
 TO authenticated USING (id=(SELECT auth.uid())) WITH CHECK(id=(SELECT auth.uid()));
-- Trusted reviewer: separately allowlisted, stored admin, not self, audited atomically.
CREATE OR REPLACE FUNCTION public.approve_profile_role_request(
 p_target_user_id uuid,p_reviewer_id uuid,p_decision text,p_reason text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $p0$
DECLARE r public.profile_role_requests%ROWTYPE; n integer;
BEGIN
 IF p_target_user_id IS NULL OR p_reviewer_id IS NULL OR p_target_user_id=p_reviewer_id
 OR p_decision NOT IN ('approved','rejected') OR length(trim(coalesce(p_reason,'')))<12
 THEN RAISE EXCEPTION 'Invalid review request' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS (SELECT 1 FROM private.role_approval_authorities a
    JOIN public.profiles p ON p.id=a.reviewer_id
    WHERE a.reviewer_id=p_reviewer_id AND p.role='admin')
 THEN RAISE EXCEPTION 'Reviewer not independently authorized' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.profile_role_requests WHERE user_id=p_target_user_id FOR UPDATE;
 IF NOT FOUND OR r.status<>'pending' THEN
  RAISE EXCEPTION 'No pending request' USING ERRCODE='22023'; END IF;
 IF p_decision='approved' THEN
  UPDATE public.profiles SET role=r.requested_role WHERE id=p_target_user_id AND role='student';
  GET DIAGNOSTICS n=ROW_COUNT;
  IF n<>1 THEN RAISE EXCEPTION 'Profile was not eligible' USING ERRCODE='40001'; END IF;
 END IF;
 UPDATE public.profile_role_requests SET status=p_decision,
   reviewed_by=p_reviewer_id, reviewed_at=clock_timestamp() WHERE user_id=p_target_user_id;
 INSERT INTO public.profile_role_review_audit(target_user_id,requested_role,decision,reviewer_id,reason)
 VALUES (p_target_user_id,r.requested_role,p_decision,p_reviewer_id,p_reason);
 RETURN p_decision;
END;
$p0$;
REVOKE ALL ON FUNCTION public.approve_profile_role_request(uuid,uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_profile_role_request(uuid,uuid,text,text) TO service_role;
-- Issue #57: remove answer-key read (RLS alone never protects a column).
REVOKE SELECT ON TABLE public.questions FROM PUBLIC, anon, authenticated;
GRANT SELECT (id,lesson_id,question_order,question,question_type,options,points)
 ON TABLE public.questions TO authenticated;
-- Only trusted server-side grading may record correctness.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.question_attempts FROM PUBLIC, anon, authenticated;
REVOKE SELECT ON TABLE public.question_attempts FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.question_attempts TO authenticated;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY p0_own_attempt_read ON public.question_attempts FOR SELECT TO authenticated
 USING(user_id=(SELECT auth.uid()));
CREATE POLICY p0_attempt_read_restrict AS RESTRICTIVE ON public.question_attempts
 FOR SELECT TO authenticated USING(user_id=(SELECT auth.uid()));
COMMIT;
-- Do not backfill privileged accounts or enable approval authorities automatically.
-- Teachers/parents receive no cross-student read until a VERIFIED relationship schema
-- and test matrix have been approved. Existing rows remain untouched.
