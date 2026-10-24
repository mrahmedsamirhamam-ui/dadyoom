\set ON_ERROR_STOP on
DO $meta$
BEGIN
 IF NOT ('security_invoker=true'=ANY(
    (SELECT reloptions FROM pg_class WHERE oid='public.dadyoom_student_questions'::regclass)
   )) THEN RAISE EXCEPTION 'SAFE_VIEW_LOST_INVOKER_RLS'; END IF;
 IF has_column_privilege('anon','public.questions','correct_answer','SELECT')
 OR has_column_privilege('authenticated','public.questions','explanation','SELECT')
 OR has_table_privilege('anon','public.questions','INSERT')
 OR has_table_privilege('authenticated','public.questions','UPDATE')
 OR NOT has_column_privilege('anon','public.questions','options','SELECT')
 THEN RAISE EXCEPTION 'QUESTION_KEY_COLUMN_ACL_NOT_EFFECTIVE'; END IF;
END $meta$;

SET ROLE anon;
DO $check$
DECLARE stopped boolean:=false; n integer; options_value jsonb;
BEGIN
 SELECT count(*) INTO n FROM public.dadyoom_student_questions;
 IF n<>1 THEN RAISE EXCEPTION 'ANON_PUBLISHED_QUIZ_BROKEN_OR_DRAFT_VISIBLE'; END IF;
 SELECT options INTO options_value FROM public.dadyoom_student_questions LIMIT 1;
 IF options_value <>'[{"id":"a","text":"خيار أول"},{"id":"b","text":"خيار ثان"}]'::jsonb
 THEN RAISE EXCEPTION 'ANON_OPTIONS_MISMATCH'; END IF;
 BEGIN
   PERFORM correct_answer FROM public.questions LIMIT 1;
 EXCEPTION WHEN insufficient_privilege THEN stopped:=true;
 END;
 IF NOT stopped THEN RAISE EXCEPTION 'ANON_READS_PRIVATE_ANSWER_KEY'; END IF;
 stopped:=false;
 BEGIN
  PERFORM explanation FROM public.questions LIMIT 1;
 EXCEPTION WHEN insufficient_privilege THEN stopped:=true;
 END;
 IF NOT stopped THEN RAISE EXCEPTION 'ANON_READS_PRIVATE_EXPLANATION'; END IF;
END $check$;
RESET ROLE;
\echo SHADOW_ANON_PRIVATE_QUESTION_KEYS_DENIED_QUIZ_PRESERVED=PASS

SET ROLE authenticated;
DO $check$
DECLARE stopped boolean:=false; n integer;
BEGIN
 SELECT count(*) INTO n FROM public.dadyoom_student_questions;
 IF n<>1 THEN RAISE EXCEPTION 'AUTH_STUDENT_INVOKER_RLS_REGRESSED'; END IF;
 BEGIN
   PERFORM correct_answer FROM public.questions LIMIT 1;
 EXCEPTION WHEN insufficient_privilege THEN stopped:=true;
 END;
 IF NOT stopped THEN RAISE EXCEPTION 'AUTH_PRIVATE_ANSWER_STILL_READABLE'; END IF;
END $check$;
RESET ROLE;
\echo SHADOW_AUTH_PRIVATE_QUESTION_KEYS_DENIED_QUIZ_PRESERVED=PASS

DO $shape$
DECLARE blocked boolean:=false;
BEGIN
 IF public.dadyoom_rehearsal_public_question_options(
  '[{"id":"a","text":"one"},{"id":"b","text":"two","isCorrect":true}]'::jsonb
 ) THEN RAISE EXCEPTION 'PRIVATE_KEY_NESTED_IN_PUBLIC_OPTIONS_ALLOWED'; END IF;
 IF public.dadyoom_rehearsal_public_question_options(
  '[{"id":"a","text":"one"},{"id":"b","text":"two"}]'::jsonb
 ) IS DISTINCT FROM true THEN
 RAISE EXCEPTION 'VALID_PUBLIC_CHOICES_REJECTED'; END IF;
 BEGIN
   UPDATE public.questions SET options=
     '[{"id":"a","text":"one"},{"id":"b","text":"two","correctAnswer":"b"}]'::jsonb
   WHERE id='33333333-3333-4333-8333-333333333333';
 EXCEPTION WHEN check_violation THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'UNSAFE_OPTION_KEY_PERSISTED'; END IF;
END $shape$;
\echo SHADOW_OPTIONS_FUTURE_KEY_LEAK_REJECTED=PASS

-- A qualified server writer still has access to solution data and may
-- update an answer without relaxing browser rights.
UPDATE public.questions SET correct_answer='b'
WHERE id='33333333-3333-4333-8333-333333333333';
DO $trusted$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.questions
 WHERE id='33333333-3333-4333-8333-333333333333'
 AND correct_answer='b') THEN
  RAISE EXCEPTION 'TRUSTED_SERVER_GRADING_WRITER_BROKEN';
 END IF;
END $trusted$;
\echo SHADOW_PRIVILEGED_TEACHER_SERVER_WRITER_RETAINED=PASS

-- Disposable rollback exactly restores original fixture direct grants.
ALTER TABLE public.questions DROP CONSTRAINT dadyoom_public_options_only_id_text;
DROP FUNCTION public.dadyoom_rehearsal_public_question_options(jsonb);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.questions TO anon,authenticated;
REVOKE SELECT (id,lesson_id,question_order,question,question_type,options,points)
 ON public.questions FROM anon,authenticated;
SET ROLE anon;
DO $rollback$
BEGIN
 IF NOT has_column_privilege('anon','public.questions','correct_answer','SELECT')
 OR (SELECT count(*) FROM public.dadyoom_student_questions)<>1 THEN
  RAISE EXCEPTION 'SHADOW_QUESTION_KEY_ROLLBACK_FAILED';
 END IF;
END $rollback$;
RESET ROLE;
\echo SHADOW_QUESTION_KEY_COLUMN_CUTOVER_ROLLBACK=PASS
