\set ON_ERROR_STOP on
-- The two-row write MUST commit or roll back as a single statement.
DO $test$
DECLARE rec record; attempt_count integer; progress_count integer;
BEGIN
 SELECT * INTO rec FROM public.dadyoom_commit_activity_attempt(
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '["صحيح"]'::jsonb,true,true,5,5,75,50
 );
 IF rec.saved_attempt_number<>1 OR rec.saved_best_score<>75 OR rec.saved_progress_percent<>50
 THEN RAISE EXCEPTION 'ATOMIC_FIRST_COMMIT_FAILED'; END IF;
 SELECT * INTO rec FROM public.dadyoom_commit_activity_attempt(
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '["صحيح"]'::jsonb,true,true,5,5,90,85
 );
 IF rec.saved_attempt_number<>2 OR rec.saved_best_score<>90 OR rec.saved_progress_percent<>85
 THEN RAISE EXCEPTION 'ATOMIC_SECOND_COMMIT_FAILED'; END IF;
 UPDATE public.student_lesson_progress SET status='mastered',progress_percent=100,xp=40;
 SELECT * INTO rec FROM public.dadyoom_commit_activity_attempt(
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '["خطأ"]'::jsonb,false,true,0,5,20,30
 );
 IF rec.saved_attempt_number<>3 OR rec.saved_best_score<>90 OR rec.saved_progress_percent<>100
 THEN RAISE EXCEPTION 'ATOMIC_MASTERED_RETRY_FAILED'; END IF;
 SELECT COUNT(*) INTO attempt_count FROM public.lesson_activity_attempts;
 SELECT COUNT(*) INTO progress_count FROM public.student_lesson_progress;
 IF attempt_count<>3 OR progress_count<>1 OR
  EXISTS(SELECT 1 FROM public.student_lesson_progress
    WHERE attempts<>3 OR best_score<>90 OR progress_percent<>100
      OR status<>'mastered' OR xp<>40)
 THEN RAISE EXCEPTION 'ATOMIC_COUNT_XP_MASTERED_INCONSISTENCY'; END IF;
END $test$;
\echo SHADOW_ATOMIC_COMMIT_AND_MASTERED_XP=PASS

-- Simulate a DB failure AFTER the attempt has been inserted.
-- The whole function transaction must roll back the attempt as well.
CREATE FUNCTION public.raise_progress_error() RETURNS trigger
LANGUAGE plpgsql AS $raise$
BEGIN
 IF NEW.last_score=13 THEN
  RAISE EXCEPTION 'SYNTHETIC_PROGRESS_FAILURE';
 END IF;
 RETURN NEW;
END $raise$;
CREATE TRIGGER reject_progress_update
  BEFORE INSERT OR UPDATE ON public.student_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.raise_progress_error();

DO $rollback$
DECLARE before_attempts integer; after_attempts integer; denied boolean:=false;
BEGIN
 SELECT COUNT(*) INTO before_attempts FROM public.lesson_activity_attempts;
 BEGIN
  PERFORM public.dadyoom_commit_activity_attempt(
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    '["مراجعة"]'::jsonb,false,true,0,5,13,40
  );
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%SYNTHETIC_PROGRESS_FAILURE%' THEN denied:=true; ELSE RAISE; END IF;
 END;
 SELECT COUNT(*) INTO after_attempts FROM public.lesson_activity_attempts;
 IF NOT denied OR after_attempts<>before_attempts OR
    EXISTS(SELECT 1 FROM public.student_lesson_progress WHERE attempts<>3 OR xp<>40)
 THEN RAISE EXCEPTION 'ATOMIC_ATTEMPT_LEFT_BEHIND_AFTER_FAILED_PROGRESS'; END IF;
END $rollback$;
\echo SHADOW_ATOMIC_FAILED_PROGRESS_ROLLED_BACK_ATTEMPT=PASS

-- Attempted direct invocation by a browser role MUST be denied.
SET ROLE authenticated;
DO $denied$
DECLARE blocked boolean:=false;
BEGIN
 BEGIN
  PERFORM public.dadyoom_commit_activity_attempt(
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    '["صحيح"]'::jsonb,true,true,5,5,100,100
  );
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'ATOMIC_COMMIT_BROWSER_ROLE_CAN_EXECUTE'; END IF;
END $denied$;
RESET ROLE;
\echo SHADOW_ATOMIC_BROWSER_EXECUTE_DENIED=PASS
