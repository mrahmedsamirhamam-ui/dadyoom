-- DADYOOM CORE ONLY — read-only audit of answer-key and score permissions.
-- Run as authorized operator using Supabase SQL editor. No DDL/DML, no role switch,
-- no secrets/answer values/learner rows, no production permission changes.
-- `security_invoker=true` view requires underlying caller grants: a naïve table
-- SELECT REVOKE will break its student queries. Never expose raw JSON `options`
-- as an alternative, as option items can embed hidden correct-answer metadata.
-- Inspect output against Issue #57, verify Preview and rollback before migration.

-- 1. Direct answer-key access by database roles (metadata ONLY).
SELECT c.table_name, c.column_name,
  has_column_privilege('anon', 'public.' || c.table_name, c.column_name, 'SELECT') AS anon_can_read,
  has_column_privilege('authenticated', 'public.' || c.table_name, c.column_name, 'SELECT') AS authenticated_can_read
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND ((c.table_name = 'questions'
        AND c.column_name IN ('correct_answer','explanation','options','id','lesson_id'))
       OR (c.table_name = 'lesson_activities'
           AND c.column_name IN ('answer','content','id','lesson_id'))
       OR (c.table_name = 'ai_assessments'
           AND c.column_name IN ('correct_answer','explanation','choices','completed','student_email')))
ORDER BY c.table_name, c.column_name;

-- 2. Server-graded storage: direct role privileges which permit forged outcomes.
SELECT role_name.role, item.table_name,
       has_table_privilege(role_name.role, 'public.' || item.table_name, 'INSERT') AS may_insert,
       has_table_privilege(role_name.role, 'public.' || item.table_name, 'UPDATE') AS may_update,
       has_table_privilege(role_name.role, 'public.' || item.table_name, 'DELETE') AS may_delete,
       has_table_privilege(role_name.role, 'public.' || item.table_name, 'SELECT') AS may_read
FROM (VALUES ('anon'), ('authenticated')) AS role_name(role)
CROSS JOIN (VALUES ('question_attempts'),
                  ('lesson_activity_attempts'),
                  ('student_lesson_progress'),
                  ('lesson_mastery'),
                  ('assessment_sessions'),
                  ('assessment_session_answers')) AS item(table_name)
ORDER BY role_name.role, item.table_name;

-- 3. RLS is a row barrier, not column-key secrecy or graded-result authority.
SELECT p.tablename, p.policyname, p.cmd, p.roles, p.qual, p.with_check
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename IN ('questions','lesson_activities','question_attempts',
                      'lesson_activity_attempts','student_lesson_progress','lesson_mastery',
                      'ai_assessments','assessment_sessions','assessment_session_answers')
ORDER BY p.tablename, p.cmd, p.policyname;

-- 4. Student projection: invoker, barrier, and its own SQL privileges.
SELECT cls.relname, cls.reloptions,
       has_table_privilege('anon', 'public.' || cls.relname, 'SELECT') AS anon_can_read,
       has_table_privilege('authenticated', 'public.' || cls.relname, 'SELECT') AS authenticated_can_read
FROM pg_class cls
JOIN pg_namespace ns ON ns.oid = cls.relnamespace
WHERE ns.nspname = 'public'
  AND cls.relname = 'dadyoom_student_questions';

-- 5. Legacy public RPC permissions: metadata only.
SELECT p.proname, p.prosecdef,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
WHERE ns.nspname = 'public'
  AND p.proname IN ('get_lesson_page_bundle','move_lesson_question_safe',
                   'delete_lesson_question_safe')
ORDER BY p.proname;

-- 6. Inventory every role-callable privileged routine, not only the three
-- legacy lesson RPCs. This enumerates signatures/grants, NEVER function bodies,
-- underlying sensitive rows, stored answer values, or service credentials.
-- A callable routine is a REVIEW CANDIDATE, not proof of an exploit.
SELECT ns.nspname AS schema_name, p.proname AS routine_name,
       pg_get_function_identity_arguments(p.oid) AS input_signature,
       p.prosecdef AS elevated_execution,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
FROM pg_proc p
JOIN pg_namespace ns ON ns.oid = p.pronamespace
WHERE ns.nspname = 'public'
  AND p.prosecdef
  AND (has_function_privilege('anon', p.oid, 'EXECUTE')
       OR has_function_privilege('authenticated', p.oid, 'EXECUTE'))
ORDER BY ns.nspname, p.proname, input_signature;

-- 7. Effective per-column DML grants, including privileges inherited from
-- PUBLIC / membership. PostgreSQL table-level REVOKE does NOT erase a
-- separately granted INSERT/UPDATE(column). A release check must inspect
-- both table-level AND any-column access for anon/authenticated. Metadata
-- only: this query does not read grading rows or modify grants.
SELECT roles.role_name, tables.table_name,
       has_table_privilege(roles.role_name, 'public.' || tables.table_name, 'INSERT') AS may_insert_table,
       has_any_column_privilege(roles.role_name, 'public.' || tables.table_name, 'INSERT') AS may_insert_some_column,
       has_table_privilege(roles.role_name, 'public.' || tables.table_name, 'UPDATE') AS may_update_table,
       has_any_column_privilege(roles.role_name, 'public.' || tables.table_name, 'UPDATE') AS may_update_some_column
FROM (VALUES ('anon'), ('authenticated')) AS roles(role_name)
CROSS JOIN (VALUES ('question_attempts'), ('lesson_activity_attempts'),
                   ('student_lesson_progress'), ('lesson_mastery'),
                   ('assessment_sessions'), ('assessment_session_answers')) AS tables(table_name)
ORDER BY roles.role_name, tables.table_name;

-- 8. Legacy and current learner progress authority / grade-bearing columns.
-- These tables can have overlapping status/score representations; a browser
-- permission is a review candidate, not evidence that RLS permits forgery.
-- Never read grades/user IDs here, and never infer permissions from
-- information_schema.role_table_grants alone.
SELECT c.relname AS table_name, r.role_name,
       c.relrowsecurity AS rls_enabled,
       has_table_privilege(r.role_name,c.oid,'SELECT') AS table_select,
       has_table_privilege(r.role_name,c.oid,'INSERT') AS table_insert,
       has_table_privilege(r.role_name,c.oid,'UPDATE') AS table_update,
       has_any_column_privilege(r.role_name,c.oid,'INSERT') AS any_column_insert,
       has_any_column_privilege(r.role_name,c.oid,'UPDATE') AS any_column_update,
       a.attname AS potential_grade_column,
       CASE WHEN a.attname IS NULL THEN NULL
            ELSE has_column_privilege(r.role_name,c.oid,a.attname,'UPDATE')
       END AS grade_column_update
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
CROSS JOIN (VALUES ('anon'),('authenticated')) r(role_name)
LEFT JOIN pg_attribute a ON a.attrelid=c.oid
  AND a.attnum>0 AND NOT a.attisdropped
  AND a.attname IN ('best_score','last_score','progress_percent','xp','completed','status','points')
WHERE n.nspname='public' AND c.relkind='r'
 AND c.relname IN ('student_progress','lesson_progress','student_lesson_progress','lesson_mastery')
ORDER BY c.relname,r.role_name,a.attname;
