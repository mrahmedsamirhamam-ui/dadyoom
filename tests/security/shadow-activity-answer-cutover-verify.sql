\set ON_ERROR_STOP on
DO $grants$
BEGIN
 IF has_column_privilege('anon','public.lesson_activities','answer','SELECT')
 OR has_column_privilege('authenticated','public.lesson_activities','answer','SELECT')
 OR has_table_privilege('anon','public.lesson_activities','INSERT')
 OR has_table_privilege('authenticated','public.lesson_activities','UPDATE')
 OR NOT has_column_privilege('anon','public.lesson_activities','content','SELECT')
 THEN RAISE EXCEPTION 'ACTIVITY_COLUMN_PRIVACY_ACL_NOT_ENFORCED'; END IF;
END $grants$;

SET ROLE anon;
DO $anon$
DECLARE n integer; allowed jsonb; denied boolean:=false;
BEGIN
 SELECT count(*) INTO n FROM public.lesson_activities;
 IF n<>1 THEN RAISE EXCEPTION 'ANON_PUBLISHED_ACTIVITY_RLS_REGRESSED'; END IF;
 SELECT content INTO allowed FROM public.lesson_activities LIMIT 1;
 IF allowed IS DISTINCT FROM
   '{"items":[{"id":"a","text":"الماء"},{"id":"b","text":"الهواء"}]}'::jsonb
 THEN RAISE EXCEPTION 'ANON_PUBLIC_ACTIVITY_CONTENT_BROKEN'; END IF;
 BEGIN
  PERFORM answer FROM public.lesson_activities LIMIT 1;
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'ANON_PRIVATE_ACTIVITY_ANSWER_READABLE'; END IF;
END $anon$;
RESET ROLE;
\echo SHADOW_ANON_ACTIVITY_ANSWER_DENIED_CONTENT_PRESERVED=PASS

SET ROLE authenticated;
DO $auth$
DECLARE denied boolean:=false;
BEGIN
 IF (SELECT count(*) FROM public.lesson_activities)<>1
 THEN RAISE EXCEPTION 'AUTH_PUBLISHED_ACTIVITY_RLS_REGRESSED'; END IF;
 BEGIN
  PERFORM answer FROM public.lesson_activities LIMIT 1;
 EXCEPTION WHEN insufficient_privilege THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'AUTH_PRIVATE_ACTIVITY_ANSWER_READABLE'; END IF;
END $auth$;
RESET ROLE;
\echo SHADOW_AUTH_ACTIVITY_ANSWER_DENIED_CONTENT_PRESERVED=PASS

DO $future$
DECLARE denied boolean:=false;
BEGIN
 IF NOT public.dadyoom_rehearsal_public_activity_content(
  '{"items":[{"id":"a","text":"شيء"}]}'::jsonb
 ) THEN RAISE EXCEPTION 'LEGAL_ACTIVITY_CONTENT_REJECTED'; END IF;
 IF public.dadyoom_rehearsal_public_activity_content(
  '{"items":[{"id":"a","text":"شيء","grading":{"isCorrect":true}}]}'::jsonb
 ) THEN RAISE EXCEPTION 'NESTED_ANSWER_KEY_WAS_ALLOWED'; END IF;
 BEGIN
  UPDATE public.lesson_activities
  SET content='{"exercise":{"correctAnswer":"a"}}'::jsonb
  WHERE id='11111111-1111-4111-8111-111111111111';
 EXCEPTION WHEN check_violation THEN denied:=true;
 END;
 IF NOT denied THEN RAISE EXCEPTION 'FUTURE_ACTIVITY_ANSWER_KEY_CAN_BE_PUBLISHED'; END IF;
END $future$;
\echo SHADOW_FUTURE_NESTED_ACTIVITY_KEYS_BLOCKED=PASS

-- Simulate teacher-authorized server writer under database owner.
UPDATE public.lesson_activities
SET answer='{"correctAnswer":"b"}'::jsonb
WHERE id='11111111-1111-4111-8111-111111111111';
DO $server$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.lesson_activities
  WHERE id='11111111-1111-4111-8111-111111111111'
    AND answer='{"correctAnswer":"b"}'::jsonb) THEN
 RAISE EXCEPTION 'SERVER_ACTIVITY_AUTHORING_BROKEN'; END IF;
END $server$;
\echo SHADOW_TRUSTED_ACTIVITY_AUTHORING_PRESERVED=PASS

-- Dispose proposal in shadow; restore its exact original grants.
ALTER TABLE public.lesson_activities
 DROP CONSTRAINT dadyoom_public_activity_content_has_no_grading_keys;
DROP FUNCTION public.dadyoom_rehearsal_public_activity_content(jsonb);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.lesson_activities
 TO anon,authenticated;
REVOKE SELECT(
 id,lesson_id,title,activity_type,instructions,content,activity_order,
 points,is_published,created_at,updated_at,section,prompt,is_required
) ON public.lesson_activities FROM anon,authenticated;
SET ROLE anon;
DO $rollback$
BEGIN
 IF NOT has_column_privilege('anon','public.lesson_activities','answer','SELECT')
 OR (SELECT count(*) FROM public.lesson_activities)<>1 THEN
  RAISE EXCEPTION 'SHADOW_ACTIVITY_COLUMN_ROLLBACK_FAILED'; END IF;
END $rollback$;
RESET ROLE;
\echo SHADOW_ACTIVITY_ANSWER_COLUMN_CUTOVER_ROLLBACK=PASS
