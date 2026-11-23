-- SECURITY-PRESERVING ROLLBACK (DISPOSABLE TEST / operator review).
-- Reverts only ability to approve NEW roles; never reopens self-promotion
-- or restores answer-key/browser grading grants. No DELETE / DROP / TRUNCATE.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.approve_profile_role_request(uuid,uuid,text,text)
  FROM PUBLIC, anon, authenticated, service_role;
COMMIT;
-- Retain review requests, audit history, immutable role grants, own-only
-- answer reads. For full rollback restore a vetted secure predecessor, NOT
-- the old vulnerable handle_new_user, RLS policies or answer-key grants.
