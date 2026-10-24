-- Synthetic owner-RLS/grade-forgery privilege rehearsal. DISPOSABLE CI DATABASE ONLY.
-- Never run this file or its GRANT/REVOKE statements against real Supabase.
-- This intentionally models *six relevant grading tables* with minimal columns;
-- it does not reproduce real constraints, triggers, RPCs, policies, or Auth sessions.
\set ON_ERROR_STOP on
-- Roles are cluster-global; the preceding shadow-question test creates them
-- on this disposable CI PostgreSQL service, even though its database differs.
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
   RAISE EXCEPTION 'EXPECTED_DISPOSABLE_AUTHENTICATED_ROLE_FROM_PRECEDING_FIXTURE';
 END IF;
END $$;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;

DO $$
DECLARE fixture record;
BEGIN
 FOR fixture IN SELECT * FROM (VALUES
   ('question_attempts','user_id'),
   ('lesson_activity_attempts','user_id'),
   ('student_lesson_progress','student_id'),
   ('lesson_mastery','student_id'),
   ('assessment_sessions','student_id'),
   ('assessment_session_answers','student_id')
 ) AS f(table_name,owner_column)
 LOOP
  EXECUTE format(
    'CREATE TABLE public.%I (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), %I uuid NOT NULL, grade integer NOT NULL DEFAULT 0)',
    fixture.table_name,fixture.owner_column
  );
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',fixture.table_name);
  EXECUTE format(
    'CREATE POLICY fixture_owner_only ON public.%I FOR ALL TO authenticated USING (%I = (SELECT auth.uid())) WITH CHECK (%I = (SELECT auth.uid()))',
    fixture.table_name,fixture.owner_column,fixture.owner_column
  );
  EXECUTE format(
    'GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated',
    fixture.table_name
  );
  EXECUTE format('INSERT INTO public.%I (%I,grade) VALUES ($1,0),($2,0)',
    fixture.table_name,fixture.owner_column)
    USING '11111111-1111-4111-8111-111111111111'::uuid,
          '22222222-2222-4222-8222-222222222222'::uuid;
 END LOOP;
END $$;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);

-- Demonstrate the original defect in the synthetic model: RLS blocks another
-- learner's row, but allows forging one's own grade to 100.
DO $$
DECLARE f record; count_rows bigint; changed bigint; result_grade integer;
BEGIN
 FOR f IN SELECT * FROM (VALUES
   ('question_attempts','user_id'),('lesson_activity_attempts','user_id'),
   ('student_lesson_progress','student_id'),('lesson_mastery','student_id'),
   ('assessment_sessions','student_id'),('assessment_session_answers','student_id')
 ) AS x(table_name,owner_column)
 LOOP
   EXECUTE format('SELECT count(*) FROM public.%I',f.table_name)
     INTO count_rows;
   IF count_rows<>1 THEN RAISE EXCEPTION 'OWNER_RLS_VISIBILITY_FAILED: %',f.table_name; END IF;
   EXECUTE format('UPDATE public.%I SET grade=100 WHERE %I=$1',
     f.table_name,f.owner_column)
     USING '11111111-1111-4111-8111-111111111111'::uuid;
   GET DIAGNOSTICS changed=ROW_COUNT;
   IF changed<>1 THEN RAISE EXCEPTION 'FORGERY_PRECONDITION_NOT_OBSERVED: %',f.table_name; END IF;
   EXECUTE format('SELECT grade FROM public.%I WHERE %I=$1',
     f.table_name,f.owner_column)
     INTO result_grade USING '11111111-1111-4111-8111-111111111111'::uuid;
   IF result_grade<>100 THEN RAISE EXCEPTION 'SYNTHETIC_FORGERY_NOT_REPRODUCED: %',f.table_name; END IF;
   EXECUTE format('UPDATE public.%I SET grade=100 WHERE %I=$1',
     f.table_name,f.owner_column)
     USING '22222222-2222-4222-8222-222222222222'::uuid;
   GET DIAGNOSTICS changed=ROW_COUNT;
   IF changed<>0 THEN RAISE EXCEPTION 'OTHER_STUDENT_CHANGED: %',f.table_name; END IF;
 END LOOP;
END $$;
RESET ROLE;
\echo SHADOW_OWN_GRADE_FORGERY_REPRODUCED_CROSS_OWNER_RLS_BLOCKED=PASS

-- The candidate removes untrusted write grants but keeps owner-scoped SELECT.
-- Actual Supabase tables and consumers MUST be independently validated.
REVOKE INSERT,UPDATE,DELETE ON
 public.question_attempts,public.lesson_activity_attempts,
 public.student_lesson_progress,public.lesson_mastery,
 public.assessment_sessions,public.assessment_session_answers
FROM authenticated;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
DO $$
DECLARE f record; denied_update boolean; denied_insert boolean;
  visible_rows bigint; accessed_other bigint;
BEGIN
 FOR f IN SELECT * FROM (VALUES
   ('question_attempts','user_id'),('lesson_activity_attempts','user_id'),
   ('student_lesson_progress','student_id'),('lesson_mastery','student_id'),
   ('assessment_sessions','student_id'),('assessment_session_answers','student_id')
 ) AS x(table_name,owner_column)
 LOOP
   denied_update:=false; denied_insert:=false;
   EXECUTE format('SELECT count(*) FROM public.%I',f.table_name) INTO visible_rows;
   IF visible_rows<>1 THEN RAISE EXCEPTION 'READ_AFTER_REVOKE_FAILED: %',f.table_name; END IF;
   BEGIN
     EXECUTE format('UPDATE public.%I SET grade=100 WHERE %I=$1',
       f.table_name,f.owner_column)
       USING '11111111-1111-4111-8111-111111111111'::uuid;
   EXCEPTION WHEN insufficient_privilege THEN denied_update:=true;
   END;
   BEGIN
     EXECUTE format('INSERT INTO public.%I (%I,grade) VALUES ($1,100)',
       f.table_name,f.owner_column)
       USING '11111111-1111-4111-8111-111111111111'::uuid;
   EXCEPTION WHEN insufficient_privilege THEN denied_insert:=true;
   END;
   IF NOT denied_update OR NOT denied_insert THEN
     RAISE EXCEPTION 'UNTRUSTED_GRADE_WRITE_ALLOWED: %',f.table_name;
   END IF;
 END LOOP;
END $$;
RESET ROLE;
\echo SHADOW_ALL_SIX_GRADE_TABLE_WRITES_BLOCKED_WITH_READ_PRESERVED=PASS

-- A trusted backend (represented here by the local fixture owner) can still
-- write independently computed grades; never model a browser-held admin token.
DO $$
DECLARE f record; value_after integer;
BEGIN
 FOR f IN SELECT * FROM (VALUES
   ('question_attempts','user_id'),('lesson_activity_attempts','user_id'),
   ('student_lesson_progress','student_id'),('lesson_mastery','student_id'),
   ('assessment_sessions','student_id'),('assessment_session_answers','student_id')
 ) AS x(table_name,owner_column)
 LOOP
   EXECUTE format('UPDATE public.%I SET grade=45 WHERE %I=$1',
      f.table_name,f.owner_column)
      USING '11111111-1111-4111-8111-111111111111'::uuid;
   EXECUTE format('SELECT grade FROM public.%I WHERE %I=$1',
      f.table_name,f.owner_column)
      INTO value_after USING '11111111-1111-4111-8111-111111111111'::uuid;
   IF value_after<>45 THEN RAISE EXCEPTION 'TRUSTED_WRITE_FAILED: %',f.table_name; END IF;
 END LOOP;
END $$;
\echo SHADOW_TRUSTED_SERVER_WRITE_PRESERVED=PASS

-- Rollback drill: only in this disposable schema, restore original DML grants.
GRANT SELECT,INSERT,UPDATE,DELETE ON
 public.question_attempts,public.lesson_activity_attempts,
 public.student_lesson_progress,public.lesson_mastery,
 public.assessment_sessions,public.assessment_session_answers
TO authenticated;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
DO $$
DECLARE f record; updated bigint;
BEGIN
 FOR f IN SELECT * FROM (VALUES
   ('question_attempts','user_id'),('lesson_activity_attempts','user_id'),
   ('student_lesson_progress','student_id'),('lesson_mastery','student_id'),
   ('assessment_sessions','student_id'),('assessment_session_answers','student_id')
 ) AS x(table_name,owner_column)
 LOOP
   EXECUTE format('UPDATE public.%I SET grade=70 WHERE %I=$1',
      f.table_name,f.owner_column)
      USING '11111111-1111-4111-8111-111111111111'::uuid;
   GET DIAGNOSTICS updated=ROW_COUNT;
   IF updated<>1 THEN RAISE EXCEPTION 'GRADE_ROLLBACK_FAILED: %',f.table_name; END IF;
 END LOOP;
END $$;
RESET ROLE;
\echo SHADOW_GRADE_WRITE_GRANTS_ROLLBACK=PASS
