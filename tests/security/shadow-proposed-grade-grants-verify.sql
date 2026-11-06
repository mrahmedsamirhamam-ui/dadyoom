-- DISPOSABLE CI ONLY. Execute immediately after proposed-grade-write-restrictions.sql.
\set ON_ERROR_STOP on
DO $check$
DECLARE name text;
BEGIN
  FOR name IN SELECT unnest(ARRAY[
    'question_attempts','lesson_activity_attempts','student_lesson_progress',
    'lesson_mastery','assessment_sessions','assessment_session_answers'
  ])
  LOOP
    IF NOT has_table_privilege('authenticated',format('public.%I',name),'SELECT')
      OR has_table_privilege('authenticated',format('public.%I',name),'INSERT')
      OR has_table_privilege('authenticated',format('public.%I',name),'UPDATE')
      OR has_any_column_privilege('authenticated',format('public.%I',name),'INSERT')
      OR has_any_column_privilege('authenticated',format('public.%I',name),'UPDATE')
      OR has_table_privilege('authenticated',format('public.%I',name),'DELETE')
      OR has_table_privilege('authenticated',format('public.%I',name),'TRUNCATE')
      OR has_table_privilege('anon',format('public.%I',name),'INSERT')
      OR has_table_privilege('anon',format('public.%I',name),'UPDATE')
      OR has_any_column_privilege('anon',format('public.%I',name),'INSERT')
      OR has_any_column_privilege('anon',format('public.%I',name),'UPDATE')
      OR has_table_privilege('anon',format('public.%I',name),'DELETE')
      OR has_table_privilege('anon',format('public.%I',name),'TRUNCATE')
    THEN
      RAISE EXCEPTION 'PROPOSED_GRADE_ROLE_GRANTS_FAILED: %',name;
    END IF;
  END LOOP;
END $check$;
-- Independent column-level grants seeded in the disposable fixture must
-- not survive the candidate, even though RLS owner reads stay available.
DO $specific_columns$
BEGIN
  IF has_column_privilege('authenticated','public.question_attempts','grade','UPDATE')
     OR has_column_privilege('authenticated','public.lesson_mastery','grade','INSERT')
  THEN RAISE EXCEPTION 'SHADOW_COLUMN_WRITE_GRANTS_SURVIVED'; END IF;
END $specific_columns$;
\echo SHADOW_CANDIDATE_ALL_SIX_DML_AND_TRUNCATE_DENIED_READ_PRESERVED=PASS

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111', false);
DO $test$
DECLARE t text; owner_col text; visible_rows integer;
  insert_denied boolean; update_denied boolean;
BEGIN
 FOR t,owner_col IN
   SELECT * FROM (VALUES
     ('question_attempts','user_id'),
     ('lesson_activity_attempts','user_id'),
     ('student_lesson_progress','student_id'),
     ('lesson_mastery','student_id'),
     ('assessment_sessions','student_id'),
     ('assessment_session_answers','student_id')
   ) AS r(table_name, owner_column)
 LOOP
   EXECUTE format('SELECT count(*) FROM public.%I',t) INTO visible_rows;
   IF visible_rows <> 1 THEN
     RAISE EXCEPTION 'OWN_PROGRESS_VISIBILITY_REGRESSED: %',t;
   END IF;
   insert_denied:=false;
   update_denied:=false;
   BEGIN
     EXECUTE format('INSERT INTO public.%I (%I,grade) VALUES ($1,100)',t,owner_col)
       USING '11111111-1111-4111-8111-111111111111'::uuid;
   EXCEPTION WHEN insufficient_privilege THEN insert_denied:=true;
   END;
   BEGIN
     EXECUTE format('UPDATE public.%I SET grade=100 WHERE %I=$1',t,owner_col)
       USING '11111111-1111-4111-8111-111111111111'::uuid;
   EXCEPTION WHEN insufficient_privilege THEN update_denied:=true;
   END;
   IF NOT insert_denied OR NOT update_denied THEN
     RAISE EXCEPTION 'OWN_GRADE_FORGERY_NOT_BLOCKED: %',t;
   END IF;
 END LOOP;
END $test$;
RESET ROLE;
\echo SHADOW_CANDIDATE_AUTHENTICATED_WRITE_FORGERY_BLOCKED=PASS

-- The trusted fixture database owner is still authorized to write canonical scores.
UPDATE public.question_attempts SET grade=63
 WHERE user_id='11111111-1111-4111-8111-111111111111'::uuid;
DO $test$
BEGIN
 IF (SELECT grade FROM public.question_attempts
   WHERE user_id='11111111-1111-4111-8111-111111111111'::uuid) <>63
 THEN RAISE EXCEPTION 'TRUSTED_GRADE_WRITE_BLOCKED'; END IF;
END $test$;
\echo SHADOW_CANDIDATE_TRUSTED_WRITES_RETAINED=PASS

-- Restore exactly the authenticated DML grants that were present in the
-- disposable grading fixture. Do NOT create a blanket production GRANT.
GRANT INSERT,UPDATE,DELETE ON
  public.question_attempts,
  public.lesson_activity_attempts,
  public.student_lesson_progress,
  public.lesson_mastery,
  public.assessment_sessions,
  public.assessment_session_answers
TO authenticated;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111', false);
UPDATE public.question_attempts SET grade=42
 WHERE user_id='11111111-1111-4111-8111-111111111111'::uuid;
DO $test$
BEGIN
 IF (SELECT grade FROM public.question_attempts
    WHERE user_id='11111111-1111-4111-8111-111111111111'::uuid) <> 42
 THEN RAISE EXCEPTION 'DISPOSABLE_GRADE_ROLLBACK_FAILED'; END IF;
END $test$;
RESET ROLE;
-- Restore the seeded column grants explicitly in this disposable fixture.
GRANT UPDATE (grade) ON TABLE public.question_attempts TO authenticated;
GRANT INSERT (grade) ON TABLE public.lesson_mastery TO authenticated;
\echo SHADOW_CANDIDATE_GRADE_GRANTS_ROLLBACK=PASS
