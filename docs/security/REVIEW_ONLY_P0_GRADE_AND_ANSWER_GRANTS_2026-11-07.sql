-- REVIEW ONLY — Issue #57 — NEVER run directly against production.
-- Requires a verified read/write consumer inventory, preview JWT tests,
-- rollback plan, verified question.options content contract and Cloudflare #46.
-- Core issues: public.questions.correct_answer SELECT and client-writable
-- question_attempts / lesson_mastery / progress tables.
--
-- IMPORTANT: public.dadyoom_student_questions is SECURITY INVOKER. Therefore
-- a public safe VIEW still needs underlying question-column privileges for
-- the invoker. Do NOT blindly REVOKE ALL SELECT without replacing its readers.
-- PostgREST may expose any GRANTED base columns, so no secrets may be stored
-- in options or other public question fields. This is a staged proposal.
BEGIN;

-- Block leaked answer keys and explanations through direct Data API.
-- Preserve only nonsecret columns required by SECURITY INVOKER student view.
REVOKE SELECT ON TABLE public.questions FROM anon, authenticated;
GRANT SELECT (
  id, lesson_id, question_order, question, question_type, options, points
) ON TABLE public.questions TO authenticated;

-- IMPORTANT: teacher/admin authoring APIs currently may depend on direct
-- table DML; first replace and test them through authorized server endpoints.
-- Do not remove question-editor permissions without their replacement.

-- Prevent browsers spoofing stored practice-grade correctness, while letting
-- the existing createAdminClient() server route continue writing.
REVOKE INSERT, UPDATE, DELETE ON public.question_attempts
  FROM anon, authenticated;

-- These other student-owned write surfaces must be migrated to authoritative
-- server endpoints before activating corresponding REVOKEs. Uncomment only
-- after inventory and JWT-backed adversarial preview tests:
-- REVOKE INSERT, UPDATE, DELETE ON public.lesson_mastery FROM anon, authenticated;
-- REVOKE INSERT, UPDATE, DELETE ON public.student_lesson_progress FROM anon, authenticated;
-- REVOKE INSERT, UPDATE, DELETE ON public.student_progress FROM anon, authenticated;
-- REVOKE INSERT, UPDATE, DELETE ON public.lesson_activity_attempts FROM anon, authenticated;
-- REVOKE INSERT, UPDATE, DELETE ON public.assessment_session_answers FROM anon, authenticated;
-- REVOKE INSERT, UPDATE, DELETE ON public.assessment_sessions FROM anon, authenticated;

COMMIT;

-- Review checklist:
-- 1. Confirm every student writer uses server-only grading, RLS read scope,
--    authenticated user.id, canonical question/lesson ids and fixed rubrics.
-- 2. For a TEST student JWT: SELECT correct_answer & explanation denied,
--    UPDATE question_attempts.is_correct denied, DELETE attempts denied,
--    owner SELECT authorized, other-student records denied.
-- 3. Verify safe view remains usable, published lessons only; ensure options
--    contain ONLY non-secret id/text and no hidden correction metadata.
-- 4. Teacher editing must use server-authenticated role and tenant checks.
-- 5. Test failed/wrong/correct answers, replay, refresh and offline retry.
-- 6. Existing stored mastery/progress records are NOT deleted or rewritten.
-- 7. Keep rollback SQL restoring exact captured previous privileges/policies,
--    not a broad GRANT ALL (least privilege, no blanket escalation).
