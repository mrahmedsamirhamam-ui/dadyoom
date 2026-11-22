-- REVIEW_REQUIRED / NOT APPLIED. Deliberately outside migrations/.
-- Production still reports the 2026-09-18 build. Deploy and test the trusted
-- /api/questions/answer writer on the actual production runtime FIRST.
-- Set the following transaction-local acknowledgement only after that check:
--   SET LOCAL dadyoom.question_grader_cutover_verified = 'true';
-- Apply in a transaction; preserve SELECT, DELETE, RLS and all student records.
DO $guard$
BEGIN
  IF current_setting('dadyoom.question_grader_cutover_verified', true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'CUTOVER_NOT_VERIFIED: deploy and test the trusted production grader before restricting writes';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = 'public.question_attempts'::regclass AND relrowsecurity) THEN
    RAISE EXCEPTION 'QUESTION_ATTEMPTS_RLS_REQUIRED';
  END IF;
  IF NOT has_table_privilege('service_role', 'public.question_attempts', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.question_attempts', 'UPDATE') THEN
    RAISE EXCEPTION 'TRUSTED_WRITER_PRIVILEGES_REQUIRED';
  END IF;
END;
$guard$;

REVOKE INSERT, UPDATE ON TABLE public.question_attempts FROM PUBLIC, anon, authenticated;
-- Column grants can survive a table-level REVOKE. Remove those write grants too.
DO $columns$
DECLARE column_list text;
BEGIN
  SELECT string_agg(quote_ident(attname), ', ' ORDER BY attnum)
    INTO column_list
    FROM pg_attribute
    WHERE attrelid = 'public.question_attempts'::regclass
      AND attnum > 0 AND NOT attisdropped;
  EXECUTE format('REVOKE INSERT (%s), UPDATE (%s) ON TABLE public.question_attempts FROM PUBLIC, anon, authenticated', column_list, column_list);
END;
$columns$;

DO $verify$
BEGIN
  IF has_table_privilege('authenticated', 'public.question_attempts', 'INSERT')
     OR has_table_privilege('authenticated', 'public.question_attempts', 'UPDATE')
     OR has_any_column_privilege('authenticated', 'public.question_attempts', 'INSERT')
     OR has_any_column_privilege('authenticated', 'public.question_attempts', 'UPDATE')
     OR has_any_column_privilege('anon', 'public.question_attempts', 'INSERT')
     OR has_any_column_privilege('anon', 'public.question_attempts', 'UPDATE') THEN
    RAISE EXCEPTION 'QUESTION_ATTEMPT_WRITE_GRANT_REMAINS';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.question_attempts', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.question_attempts', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.question_attempts', 'UPDATE') THEN
    RAISE EXCEPTION 'QUESTION_ATTEMPT_READER_OR_TRUSTED_WRITER_REGRESSION';
  END IF;
END;
$verify$;

-- Rollback to the exact preflight table-write ACL recorded 2026-11-22:
-- GRANT INSERT, UPDATE ON TABLE public.question_attempts TO authenticated;
-- anon/PUBLIC had no INSERT/UPDATE; no direct column ACLs were present.
-- Rollback restores the vulnerable behavior; use only to recover a failed cutover.
