-- REVIEW ONLY. Issue #117. Requires the pending-role schema proposal in PR #118.
-- Apply only to isolated PostgreSQL/preview, never directly to production.
-- An approval changes status, profile role and audit log ATOMICALLY.
BEGIN;

CREATE TABLE IF NOT EXISTS public.profile_role_review_audit (
  id bigserial PRIMARY KEY,
  target_user_id uuid NOT NULL REFERENCES auth.users(id),
  requested_role text NOT NULL CHECK (requested_role IN ('teacher','school')),
  decision text NOT NULL CHECK (decision IN ('approved','rejected')),
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  decided_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

ALTER TABLE public.profile_role_review_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profile_role_review_audit FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.profile_role_review_audit_id_seq FROM PUBLIC, anon, authenticated;

-- The only exposed function is executable by the server-held service role.
-- The caller is separately authenticated by Next.js authorizeSession();
-- the database independently checks the REVIEWER'S STORED admin role.
CREATE OR REPLACE FUNCTION public.approve_profile_role_request(
  p_target_user_id uuid,
  p_reviewer_id uuid,
  p_decision text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  request_row public.profile_role_requests%ROWTYPE;
  reviewer_role text;
  updated_count integer;
BEGIN
  IF p_target_user_id IS NULL OR p_reviewer_id IS NULL
     OR p_target_user_id = p_reviewer_id
     OR p_decision NOT IN ('approved','rejected') THEN
    RAISE EXCEPTION 'Invalid role review request' USING ERRCODE = '22023';
  END IF;

  SELECT role INTO reviewer_role
  FROM public.profiles WHERE id = p_reviewer_id;
  IF reviewer_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Reviewer is not an administrator' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO request_row FROM public.profile_role_requests
  WHERE user_id = p_target_user_id FOR UPDATE;

  IF NOT FOUND OR request_row.status <> 'pending'
     OR request_row.requested_role NOT IN ('teacher','school') THEN
    RAISE EXCEPTION 'No eligible pending application' USING ERRCODE = '22023';
  END IF;

  IF p_decision = 'approved' THEN
    UPDATE public.profiles
      SET role = request_row.requested_role
    WHERE id = p_target_user_id AND role = 'student';
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count <> 1 THEN
      RAISE EXCEPTION 'Profile state changed; retry review' USING ERRCODE = '40001';
    END IF;
  ELSE
    -- Rejection never grants teacher or school access.
    IF NOT EXISTS (SELECT 1 FROM public.profiles
                   WHERE id = p_target_user_id AND role = 'student') THEN
      RAISE EXCEPTION 'Applicant profile state invalid' USING ERRCODE = '40001';
    END IF;
  END IF;

  UPDATE public.profile_role_requests
    SET status = p_decision,
        reviewed_by = p_reviewer_id,
        reviewed_at = clock_timestamp()
    WHERE user_id = p_target_user_id AND status = 'pending';

  INSERT INTO public.profile_role_review_audit
    (target_user_id, requested_role, decision, reviewer_id)
  VALUES (p_target_user_id, request_row.requested_role,
          p_decision, p_reviewer_id);

  RETURN p_decision;
END;
$fn$;

REVOKE ALL ON FUNCTION public.approve_profile_role_request(uuid,uuid,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_profile_role_request(uuid,uuid,text)
  TO service_role;
COMMIT;

-- Launch gate: validate actual test JWT/RLS, pre-existing privileged users,
-- create a rollback migration, and review all teacher/school route permissions.
