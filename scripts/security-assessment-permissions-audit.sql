-- Dadyoom assessment access audit (read-only, production-safe).
-- Run each SELECT under a privileged read-only SQL console.
-- The query reports posture; it never changes grants or policies.
--
-- Security gate that must eventually become FALSE after staged rollout:
-- anonymous_can_read_answer_key
-- signed_in_can_read_answer_key (except trusted teacher/editor access via a
-- separate secure surface)
-- signed_in_can_write_attempts
-- signed_in_can_write_mastery
--
-- Do not REVOKE grants without live E2E and server-only migration; several
-- current lesson, dashboard and question flows still use public.questions.
SELECT
  has_table_privilege('anon','public.questions','SELECT')
    AS anonymous_can_select_questions,
  has_column_privilege('anon','public.questions','correct_answer','SELECT')
    AS anonymous_can_read_answer_key,
  has_column_privilege('authenticated','public.questions','correct_answer','SELECT')
    AS signed_in_can_read_answer_key,
  has_table_privilege('authenticated','public.question_attempts','INSERT')
    AS signed_in_can_insert_attempts,
  has_table_privilege('authenticated','public.question_attempts','UPDATE')
    AS signed_in_can_update_attempts,
  has_table_privilege('authenticated','public.question_attempts','DELETE')
    AS signed_in_can_delete_attempts,
  has_table_privilege('authenticated','public.lesson_mastery','UPDATE')
    AS signed_in_can_update_mastery;

-- Inspect actual row policies; ownership checks do not certify score truth.
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN (
    'questions','question_attempts','lesson_mastery',
    'lesson_activity_attempts','student_lesson_progress',
    'student_progress','lesson_progress','student_skill_progress'
  )
ORDER BY tablename, cmd, policyname;

-- Post-hardening acceptance criteria (MANUAL, not a database assertion):
-- 1. Server-only grader fully deployed and test account tested.
-- 2. No public selection of correct_answer/explanation before assessment.
-- 3. No authenticated direct insert/update/delete of grading result rows.
-- 4. Authenticated test student can answer and see their own results.
-- 5. Another student cannot read or alter this student's attempts.
-- 6. Authenticated client cannot forge is_correct/mastery_score.
-- 7. Trial rollback validated before privilege migration.
