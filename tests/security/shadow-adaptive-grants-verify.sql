-- Run only after the guarded adaptive candidate on a synthetic fixture.
\set ON_ERROR_STOP on
DO $check$
DECLARE t text;
BEGIN
 FOR t IN SELECT unnest(ARRAY[
 'adaptive_learning_steps','student_skills','student_mistakes'
 ]) LOOP
  IF NOT has_table_privilege('authenticated',format('public.%I',t),'SELECT')
   OR has_table_privilege('authenticated',format('public.%I',t),'INSERT')
   OR has_table_privilege('authenticated',format('public.%I',t),'UPDATE')
   OR has_table_privilege('authenticated',format('public.%I',t),'DELETE')
   OR has_table_privilege('authenticated',format('public.%I',t),'TRUNCATE')
   OR has_table_privilege('anon',format('public.%I',t),'TRUNCATE')
  THEN RAISE EXCEPTION 'ADAPTIVE_CANDIDATE_ACL_FAILED: %',t; END IF;
 END LOOP;
END $check$;
\echo SHADOW_ADAPTIVE_THREE_TABLE_WRITES_BLOCKED_READ_PRESERVED=PASS

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SELECT set_config('request.jwt.claim.email','first@example.invalid',false);
DO $attempt$
DECLARE t text; rejected boolean;
BEGIN
 FOR t IN SELECT unnest(ARRAY[
  'adaptive_learning_steps','student_skills','student_mistakes'
 ]) LOOP
  rejected:=false;
  BEGIN
   EXECUTE format('TRUNCATE public.%I',t);
  EXCEPTION WHEN insufficient_privilege THEN rejected:=true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'TRUNCATE_STILL_ALLOWED: %',t; END IF;
 END LOOP;
 rejected:=false;
 BEGIN
  UPDATE public.adaptive_learning_steps SET status='completed';
 EXCEPTION WHEN insufficient_privilege THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'ADAPTIVE_UPDATE_ALLOWED'; END IF;
 rejected:=false;
 BEGIN
  UPDATE public.student_skills SET score=100;
 EXCEPTION WHEN insufficient_privilege THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'SKILL_UPDATE_ALLOWED'; END IF;
 rejected:=false;
 BEGIN
  UPDATE public.student_mistakes SET mistake_count=0;
 EXCEPTION WHEN insufficient_privilege THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'MISTAKES_UPDATE_ALLOWED'; END IF;
 rejected:=false;
 BEGIN
  INSERT INTO public.student_skills(student_email,skill,score)
   VALUES('first@example.invalid','fake',100);
 EXCEPTION WHEN insufficient_privilege THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'SKILL_INSERT_ALLOWED'; END IF;
 IF (SELECT count(*) FROM public.adaptive_learning_steps) <> 1
   OR (SELECT count(*) FROM public.student_skills) <> 1
   OR (SELECT count(*) FROM public.student_mistakes) <> 1
 THEN RAISE EXCEPTION 'ADAPTIVE_STUDENT_OWN_READ_BROKEN'; END IF;
END $attempt$;
RESET ROLE;
\echo SHADOW_ADAPTIVE_AUTHENTICATED_FORGERY_DENIED=PASS

-- Trusted server/DB owner retains ability to persist real transitions.
UPDATE public.adaptive_learning_steps SET status='in_progress'
 WHERE student_id='11111111-1111-4111-8111-111111111111';
UPDATE public.student_skills SET score=55
 WHERE student_email='first@example.invalid';
DO $check$
BEGIN
 IF (SELECT status FROM public.adaptive_learning_steps
     WHERE student_id='11111111-1111-4111-8111-111111111111')<>'in_progress'
  OR (SELECT score FROM public.student_skills
     WHERE student_email='first@example.invalid')<>55
 THEN RAISE EXCEPTION 'ADAPTIVE_TRUSTED_WRITE_FAILED'; END IF;
END $check$;
\echo SHADOW_ADAPTIVE_TRUSTED_WRITES_PRESERVED=PASS

-- Restore only the explicit fixture grants; production had no modifications.
GRANT INSERT,UPDATE,DELETE,TRUNCATE ON
 public.adaptive_learning_steps,public.student_skills,public.student_mistakes
TO anon,authenticated;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
SELECT set_config('request.jwt.claim.email','first@example.invalid',false);
UPDATE public.adaptive_learning_steps SET status='completed';
UPDATE public.student_skills SET score=90;
DO $verify$
BEGIN
 IF (SELECT status FROM public.adaptive_learning_steps)<>'completed'
  OR (SELECT score FROM public.student_skills)<>90
 THEN RAISE EXCEPTION 'ADAPTIVE_GRANTS_ROLLBACK_FAILED'; END IF;
END $verify$;
RESET ROLE;
\echo SHADOW_ADAPTIVE_GRANTS_ROLLBACK=PASS
