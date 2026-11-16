-- READ-ONLY preflight; run in local Supabase SQL editor BEFORE any staging hardening.
-- Abort rollout if any required table/column is missing or policy differs.
WITH expected(table_name,column_name) AS (
 VALUES
 ('questions','id'),('questions','lesson_id'),('questions','question_order'),
 ('questions','question'),('questions','question_type'),('questions','options'),
 ('questions','points'),('questions','correct_answer'),
 ('ai_assessments','id'),('ai_assessments','student_email'),
 ('ai_assessments','title'),('ai_assessments','passage'),('ai_assessments','question'),
 ('ai_assessments','choices'),('ai_assessments','skill'),
 ('ai_assessments','difficulty'),('ai_assessments','lesson_id'),
 ('ai_assessments','completed'),('ai_assessments','correct_answer'),
 ('assessment_session_answers','id'),('assessment_session_answers','session_id'),
 ('assessment_session_answers','assessment_id'),('assessment_session_answers','student_id'),
 ('assessment_session_answers','lesson_id'),('assessment_session_answers','skill'),
 ('assessment_session_answers','selected_answer'),('assessment_session_answers','is_correct'),
 ('assessment_session_answers','created_at'),('assessment_session_answers','correct_answer'),
 ('assessment_sessions','id'),('assessment_sessions','student_id'),
 ('assessment_sessions','lesson_id'),('assessment_sessions','current_question'),
 ('assessment_sessions','total_questions'),('assessment_sessions','correct_answers'),
 ('assessment_sessions','wrong_answers'),('assessment_sessions','difficulty'),
 ('assessment_sessions','finished'),('assessment_sessions','created_at'),
 ('assessment_sessions','updated_at')
)
SELECT e.table_name,e.column_name
FROM expected e LEFT JOIN information_schema.columns c
 ON c.table_schema='public' AND c.table_name=e.table_name AND c.column_name=e.column_name
WHERE c.column_name IS NULL ORDER BY 1,2;
-- Expected result: ZERO rows.
SELECT schemaname,tablename,policyname,cmd,roles,qual,with_check
FROM pg_policies WHERE schemaname='public'
AND tablename IN ('questions','ai_assessments','assessment_session_answers','assessment_sessions')
ORDER BY tablename,policyname;
-- Review the policies manually; table-level GRANT does NOT override RLS.
SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname IN
('questions','ai_assessments','assessment_session_answers','assessment_sessions');
