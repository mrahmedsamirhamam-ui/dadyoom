-- After exact guarded candidate is applied in shadow_ai_keys.
\set ON_ERROR_STOP on
DO $acl$
DECLARE r text;
BEGIN
 FOR r IN SELECT unnest(ARRAY['anon','authenticated']) LOOP
  IF has_table_privilege(r,'public.ai_assessments','SELECT')
   OR has_table_privilege(r,'public.ai_assessments','INSERT')
   OR has_table_privilege(r,'public.ai_assessments','UPDATE')
   OR has_table_privilege(r,'public.ai_assessments','DELETE')
   OR has_table_privilege(r,'public.ai_assessments','TRUNCATE')
   OR has_column_privilege(r,'public.ai_assessments','correct_answer','SELECT')
   OR has_column_privilege(r,'public.ai_assessments','explanation','SELECT')
  THEN RAISE EXCEPTION 'AI_KEYS_BROWSER_FULL_OR_SECRET_PRIVILEGE_REMAINS: %',r; END IF;
  IF NOT has_column_privilege(r,'public.ai_assessments','id','SELECT')
   OR NOT has_column_privilege(r,'public.ai_assessments','choices','SELECT')
   OR NOT has_column_privilege(r,'public.ai_assessments','completed','SELECT')
  THEN RAISE EXCEPTION 'AI_KEYS_STUDENT_PUBLIC_PROJECTION_BROKEN: %',r; END IF;
 END LOOP;
 IF NOT has_table_privilege('service_role','public.ai_assessments','SELECT')
  OR NOT has_table_privilege('service_role','public.ai_assessments','INSERT')
  OR NOT has_table_privilege('service_role','public.ai_assessments','UPDATE')
 THEN RAISE EXCEPTION 'AI_KEYS_SERVICE_WRITER_BROKEN'; END IF;
END $acl$;
\echo SHADOW_AI_KEYS_PUBLIC_COLUMNS_AND_PRIVATE_KEYS_ACL=PASS

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.email','first@example.invalid',false);
DO $check$
DECLARE rejected boolean;
BEGIN
 IF (SELECT count(*) FROM public.ai_assessments) <> 1 THEN
  RAISE EXCEPTION 'AI_KEYS_OWNER_RLS_BROKEN'; END IF;
 IF (SELECT choices FROM public.ai_assessments)
     <> '["ألف","باء"]'::jsonb THEN
  RAISE EXCEPTION 'AI_KEYS_PUBLIC_OPTIONS_BROKEN'; END IF;
 rejected:=false;
 BEGIN
   PERFORM correct_answer FROM public.ai_assessments LIMIT 1;
 EXCEPTION WHEN insufficient_privilege THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'AI_KEYS_RAW_SECRET_READ_POSSIBLE'; END IF;
 rejected:=false;
 BEGIN
   PERFORM explanation FROM public.ai_assessments LIMIT 1;
 EXCEPTION WHEN insufficient_privilege THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'AI_KEYS_RAW_EXPLANATION_READ_POSSIBLE'; END IF;
 rejected:=false;
 BEGIN
   UPDATE public.ai_assessments SET correct_answer=0;
 EXCEPTION WHEN insufficient_privilege THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'AI_KEYS_OWN_CORRECT_ANSWER_FORGERY_POSSIBLE'; END IF;
 rejected:=false;
 BEGIN
   INSERT INTO public.ai_assessments(
    id,student_email,title,passage,question,choices,correct_answer)
   VALUES('44444444-4444-4444-8444-444444444444','first@example.invalid',
   'تزوير','نص','سؤال','["أ","ب"]'::jsonb,0);
 EXCEPTION WHEN insufficient_privilege THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'AI_KEYS_OWN_ASSESSMENT_CREATION_POSSIBLE'; END IF;
END $check$;
RESET ROLE;
\echo SHADOW_AI_KEYS_STUDENT_OWNER_READ_ONLY_SECRET_DENIED=PASS

SET ROLE anon;
DO $anon$
DECLARE rejected boolean:=false;
BEGIN
 IF EXISTS(SELECT 1 FROM public.ai_assessments) THEN
   RAISE EXCEPTION 'AI_KEYS_ANONYMOUS_RLS_BROKEN'; END IF;
 BEGIN
  PERFORM correct_answer FROM public.ai_assessments LIMIT 1;
 EXCEPTION WHEN insufficient_privilege THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'AI_KEYS_ANONYMOUS_KEY_ACCESS'; END IF;
END $anon$;
RESET ROLE;
\echo SHADOW_AI_KEYS_ANON_RLS_AND_SECRETS_DENIED=PASS

SET ROLE service_role;
DO $trusted$
BEGIN
 IF (SELECT correct_answer FROM public.ai_assessments WHERE
   student_email='first@example.invalid')<>1 THEN
  RAISE EXCEPTION 'AI_KEYS_TRUSTED_SECRET_READ_BROKEN'; END IF;
 UPDATE public.ai_assessments SET completed=true
  WHERE student_email='first@example.invalid';
 IF NOT (SELECT completed FROM public.ai_assessments WHERE
   student_email='first@example.invalid') THEN
  RAISE EXCEPTION 'AI_KEYS_TRUSTED_WRITER_BROKEN'; END IF;
END $trusted$;
RESET ROLE;
\echo SHADOW_AI_KEYS_SERVER_READ_AND_WRITE_PRESERVED=PASS

-- Explicitly simulate a malformed raw choices JSON trying to smuggle a
-- future answer key into the publicly readable column. The constraint must
-- reject nested objects even when a privileged writer supplies them.
DO $json$
DECLARE rejected boolean:=false;
BEGIN
 BEGIN
  UPDATE public.ai_assessments
   SET choices='["ألف", {"isCorrect":true}]'::jsonb
   WHERE student_email='first@example.invalid';
 EXCEPTION WHEN check_violation THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'AI_KEYS_NESTED_CHOICE_HINT_ALLOWED'; END IF;
END $json$;
\echo SHADOW_AI_KEYS_NESTED_CHOICE_ANSWER_HINT_BLOCKED=PASS

-- Restore the fixture grants and schema exactly, not production ACLs.
ALTER TABLE public.ai_assessments
  DROP CONSTRAINT ai_assessments_public_choices_strings_only;
GRANT SELECT,INSERT,UPDATE,DELETE,TRUNCATE ON public.ai_assessments
 TO anon,authenticated;
REVOKE SELECT (
  id,student_email,title,passage,question,choices,skill,
  difficulty,created_at,completed,lesson_id
) ON public.ai_assessments FROM anon,authenticated;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.email','first@example.invalid',false);
DO $rollback$
BEGIN
 IF NOT has_table_privilege('authenticated','public.ai_assessments','SELECT')
  OR NOT has_table_privilege('authenticated','public.ai_assessments','UPDATE')
  OR NOT has_column_privilege('authenticated','public.ai_assessments','correct_answer','SELECT')
  OR (SELECT count(*) FROM public.ai_assessments)<>1
 THEN RAISE EXCEPTION 'AI_KEYS_FIXTURE_GRANT_ROLLBACK_FAILED'; END IF;
 UPDATE public.ai_assessments SET completed=false
 WHERE student_email='first@example.invalid';
END $rollback$;
RESET ROLE;
\echo SHADOW_AI_KEYS_FIXTURE_GRANTS_ROLLBACK=PASS
