\set ON_ERROR_STOP on
DO $verify$
DECLARE v_table text; v_role text;
BEGIN
 FOREACH v_table IN ARRAY ARRAY['student_skill_progress','student_daily_challenges'] LOOP
   FOREACH v_role IN ARRAY ARRAY['anon','authenticated'] LOOP
     IF has_any_column_privilege(v_role,format('public.%I',v_table),'UPDATE')
       OR has_any_column_privilege(v_role,format('public.%I',v_table),'INSERT')
       OR has_table_privilege(v_role,format('public.%I',v_table),'DELETE')
       OR NOT has_table_privilege(v_role,format('public.%I',v_table),'SELECT')
     THEN RAISE EXCEPTION 'SHADOW_SKILL_REWARD_WRITE_GRANTS_NOT_REMOVED: % %',v_role,v_table; END IF;
   END LOOP;
 END LOOP;
END $verify$;
\echo SHADOW_SKILL_DAILY_BROWSER_WRITE_ACL_REMOVED=PASS

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
DO $reader$
DECLARE n_skill integer; n_daily integer; blocked boolean;
BEGIN
 SELECT count(*) INTO n_skill FROM public.student_skill_progress;
 SELECT count(*) INTO n_daily FROM public.student_daily_challenges;
 IF n_skill<>1 OR n_daily<>1 THEN
   RAISE EXCEPTION 'OWN_STUDENT_SCORE_OR_DAILY_HISTORY_READ_REGRESSED';
 END IF;
 blocked:=false;
 BEGIN UPDATE public.student_skill_progress SET xp=999999 WHERE user_id=auth.uid();
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'BROWSER_SKILL_XP_UPDATE_SURVIVED'; END IF;
 blocked:=false;
 BEGIN
   INSERT INTO public.student_skill_progress
     (id,user_id,skill,latest_score,best_score,attempts,xp,level)
   VALUES('31000000-0000-4000-8000-000000000003',auth.uid(),'writing',100,100,1,9999,'متقدم');
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'BROWSER_SKILL_XP_INSERT_SURVIVED'; END IF;
 blocked:=false;
 BEGIN
   UPDATE public.student_daily_challenges SET bonus_xp=9999,bonus_awarded=true
   WHERE user_id=auth.uid();
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'BROWSER_DAILY_BONUS_UPDATE_SURVIVED'; END IF;
 blocked:=false;
 BEGIN
   INSERT INTO public.student_daily_challenges
     (id,user_id,challenge_date,skill,challenge_id,title,target_score,bonus_xp,bonus_awarded)
   VALUES('32000000-0000-4000-8000-000000000003',auth.uid(),DATE '2026-10-25',
     'reading','forged','نسخة مزورة',1,9000,true);
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'BROWSER_DAILY_BONUS_INSERT_SURVIVED'; END IF;
 IF (SELECT count(*) FROM public.student_skill_progress)<>1
   OR (SELECT count(*) FROM public.student_daily_challenges)<>1
 THEN RAISE EXCEPTION 'STUDENT_HISTORY_ACCESS_REGRESSED'; END IF;
END $reader$;
RESET ROLE;
\echo SHADOW_SKILL_DAILY_OWNER_READ_PRESERVED_FORGED_WRITES_DENIED=PASS

-- Server writer retains full INSERT/UPDATE while browser tokens are read-only.
SET ROLE service_role;
UPDATE public.student_skill_progress SET xp=20
 WHERE user_id='11111111-1111-4111-8111-111111111111'::uuid;
UPDATE public.student_daily_challenges SET bonus_xp=15,bonus_awarded=true
 WHERE user_id='11111111-1111-4111-8111-111111111111'::uuid;
RESET ROLE;
DO $verify$
BEGIN
 IF (SELECT xp FROM public.student_skill_progress WHERE user_id=
    '11111111-1111-4111-8111-111111111111'::uuid)<>20
   OR (SELECT bonus_xp FROM public.student_daily_challenges WHERE user_id=
    '11111111-1111-4111-8111-111111111111'::uuid)<>15
 THEN RAISE EXCEPTION 'TRUSTED_SKILL_DAILY_REWARD_WRITE_REGRESSED'; END IF;
END $verify$;
\echo SHADOW_SKILL_DAILY_SERVICE_ROLE_WRITE_PRESERVED=PASS

-- Rehearse restoration of the synthetic original permissions. Never ship
-- this blanket-GRANT rollback to production; real ACL backups are required.
GRANT INSERT,UPDATE,DELETE,TRUNCATE ON
 public.student_skill_progress,public.student_daily_challenges TO anon,authenticated;
GRANT UPDATE(xp),INSERT(xp) ON public.student_skill_progress TO authenticated;
GRANT UPDATE(bonus_xp),UPDATE(bonus_awarded),INSERT(bonus_xp)
 ON public.student_daily_challenges TO authenticated;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
UPDATE public.student_skill_progress SET xp=55 WHERE user_id=auth.uid();
UPDATE public.student_daily_challenges SET bonus_xp=55 WHERE user_id=auth.uid();
DO $verify$
BEGIN
 IF (SELECT xp FROM public.student_skill_progress)<>55
   OR (SELECT bonus_xp FROM public.student_daily_challenges)<>55
 THEN RAISE EXCEPTION 'SHADOW_SKILL_DAILY_ROLLBACK_FAILED'; END IF;
END $verify$;
RESET ROLE;
\echo SHADOW_SKILL_DAILY_WRITER_ACL_ROLLBACK=PASS
