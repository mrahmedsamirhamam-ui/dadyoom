-- PROPOSAL ONLY. NOT A SUPABASE MIGRATION. NOT APPLIED TO PRODUCTION.
--
-- Prerequisites BEFORE a separate reviewed rollout:
-- 1) Revoke direct browser DML on assessment_sessions and
--    assessment_session_answers, and verify authentic student/teacher Preview.
-- 2) Create the service-only table after permissions are audited.
-- 3) Enable DADYOOM_TRUSTED_ASSESSMENT_RECEIPTS=enabled on Preview only.
--    Do not turn this on against the current production schema.
--
-- Prevent accidental execution: this candidate is executable ONLY in the
-- disposable shadow_receipts database when the rehearsal flag is enabled.
DO $guard$
BEGIN
  IF current_database() <> 'shadow_receipts'
    OR current_setting('dadyoom.receipt_rehearsal',true)
      IS DISTINCT FROM 'enabled'
  THEN
    RAISE EXCEPTION 'PRODUCTION_RECEIPT_DDL_BLOCKED_DISPOSABLE_TEST_ONLY';
  END IF;
END $guard$;

CREATE TABLE public.assessment_completion_receipts (
  session_id uuid PRIMARY KEY,
  student_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  total_questions integer NOT NULL CHECK (total_questions > 0),
  correct_answers integer NOT NULL CHECK (correct_answers >= 0),
  wrong_answers integer NOT NULL CHECK (wrong_answers >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT receipt_consistent_score
    CHECK (correct_answers + wrong_answers = total_questions)
);
ALTER TABLE public.assessment_completion_receipts ENABLE ROW LEVEL SECURITY;
-- No browser SELECT or write privileges, regardless of default schema ACL.
REVOKE ALL PRIVILEGES ON public.assessment_completion_receipts
  FROM PUBLIC, anon, authenticated;
-- Service may insert/read but never update/delete a minted receipt.
GRANT SELECT, INSERT ON public.assessment_completion_receipts TO service_role;
COMMENT ON TABLE public.assessment_completion_receipts IS
 'Append-only trusted assessment completion receipts; no browser API access.';
