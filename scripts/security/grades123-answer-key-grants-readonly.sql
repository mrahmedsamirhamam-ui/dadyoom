-- LIVE READ ONLY; do not run destructive grants here.
-- Never return answer values, user data, or raw question text.
SELECT
  has_column_privilege('anon','public.lesson_activities','answer','SELECT') AS anon_can_read_activity_answer,
  has_column_privilege('authenticated','public.lesson_activities','answer','SELECT') AS authenticated_can_read_activity_answer,
  has_column_privilege('anon','public.questions','correct_answer','SELECT') AS anon_can_read_question_answer,
  has_column_privilege('authenticated','public.questions','correct_answer','SELECT') AS authenticated_can_read_question_answer,
  (SELECT relrowsecurity FROM pg_class WHERE oid='public.lesson_activities'::regclass) AS activity_rls_on,
  (SELECT relrowsecurity FROM pg_class WHERE oid='public.questions'::regclass) AS question_rls_on;
-- RLS controls rows; it does not by itself make sensitive columns inaccessible.
-- Keep fail-closed launch gate until tested secure views/RPC/server grading and cutover.
