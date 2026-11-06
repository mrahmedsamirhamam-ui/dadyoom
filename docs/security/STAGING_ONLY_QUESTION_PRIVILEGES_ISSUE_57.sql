-- ISSUE #57 — STAGING-ONLY, NOT AUTHORIZED FOR PRODUCTION.
-- Snapshot of read-only inspection 2026-11-07:
-- public.questions has table-wide SELECT to authenticated, including
-- correct_answer; public.question_attempts has INSERT/UPDATE/DELETE to
-- authenticated. Existing RLS does not protect individual columns.
--
-- Prerequisite: move EVERY student/teacher/quiz editor reader of questions
-- to the safe dadyoom_student_questions view or properly authorized server
-- routes. Ensure authenticated teachers/editors use trusted server APIs to
-- access answer keys, and that no client depends on direct attempt writes.
-- Server-side /api/questions/answer already grades by DB answer key using
-- service-role ONLY after getUser() and published lesson RLS check.
--
-- TAKE STAGING BACKUP AND CHECK ALL CALLERS BEFORE UNCOMMENTING THIS SQL.
-- Intended privilege hardening candidate for ISOLATED STAGING ONLY:
BEGIN;
  REVOKE SELECT ON TABLE public.questions FROM authenticated;
  -- Only fields needed for a student question view; no correct_answer or
  -- explanation. RLS still restricts rows; column grants do not replace RLS.
  GRANT SELECT (id, lesson_id, question_order, question, question_type, options, points)
    ON TABLE public.questions TO authenticated;

  REVOKE INSERT, UPDATE, DELETE ON TABLE public.question_attempts
    FROM authenticated;
COMMIT;

-- Confirm privileged scores are written ONLY via the authenticated
-- /api/questions/answer route and service-only code. Direct PostgREST
-- /question_attempts INSERT/UPDATE/DELETE with a student JWT MUST return 403.
-- Direct student JWT select of questions.correct_answer MUST return 403,
-- including attempts with ?select=correct_answer or ?select=*.
-- SELECT of the safe dadyoom_student_questions view MUST still work.
--
-- REQUIRED negative tests in staging:
-- 1. authenticated student reads correct_answer, tries spoofing score;
-- 2. student writes other user's attempt, alters is_correct, progress;
-- 3. authenticated teacher edits through trusted server editor only;
-- 4. anonymous users see no keys or grade writes;
-- 5. secure MCQ flow correct/wrong, retries and completion persistence;
-- 6. ALL existing question readers avoid SELECT * on public.questions.
--
-- ROLLBACK PLAN (only after reproducing original grants from pg_catalog):
-- BEGIN;
--   REVOKE SELECT(id, lesson_id, question_order, question, question_type, options, points)
--      ON TABLE public.questions FROM authenticated;
--   GRANT SELECT ON TABLE public.questions TO authenticated;
--   GRANT INSERT, UPDATE, DELETE ON TABLE public.question_attempts TO authenticated;
-- COMMIT;
--
-- DO NOT apply in production until: staging JWT tests, reader migration,
-- Cloudflare preview, rollback proof, and security review pass.
