-- Independent anonymous/authenticated privilege and rollback verification.
\set ON_ERROR_STOP on
DO $verify$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated']
  LOOP
    IF has_any_column_privilege(r,'public.edu_game_attempts','INSERT')
       OR has_any_column_privilege(r,'public.edu_game_attempts','UPDATE')
       OR has_table_privilege(r,'public.edu_game_attempts','DELETE')
       OR NOT has_table_privilege(r,'public.edu_game_attempts','SELECT')
    THEN RAISE EXCEPTION 'SHADOW_GAME_WRITE_GRANTS_NOT_REVOKED: %',r; END IF;
  END LOOP;
END $verify$;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
DO $verify$
DECLARE visible integer; update_denied boolean:=false; insert_denied boolean:=false;
BEGIN
  SELECT count(*) INTO visible FROM public.edu_game_attempts;
  IF visible <> 1 THEN RAISE EXCEPTION 'STUDENT_GAME_HISTORY_READ_BROKEN'; END IF;
  BEGIN
    UPDATE public.edu_game_attempts SET xp_earned=3000;
  EXCEPTION WHEN insufficient_privilege THEN update_denied:=true; END;
  BEGIN
    INSERT INTO public.edu_game_attempts
      (student_id,lesson_id,game_key,score,max_score,xp_earned)
    VALUES ((SELECT auth.uid()),'33333333-3333-4333-8333-333333333333','study-play-review',2,2,3000);
  EXCEPTION WHEN insufficient_privilege THEN insert_denied:=true; END;
  IF NOT update_denied OR NOT insert_denied THEN
    RAISE EXCEPTION 'UNTRUSTED_GAME_XP_WRITE_SURVIVED';
  END IF;
END $verify$;
RESET ROLE;
\echo SHADOW_GAME_BROWSER_XP_WRITES_DENIED_HISTORY_PRESERVED=PASS
-- A trusted database owner still persists server-graded scores.
UPDATE public.edu_game_attempts SET score=2,xp_earned=0
 WHERE student_id='11111111-1111-4111-8111-111111111111'::uuid;
DO $verify$
BEGIN
 IF (SELECT score FROM public.edu_game_attempts
     WHERE student_id='11111111-1111-4111-8111-111111111111'::uuid) <> 2
 THEN RAISE EXCEPTION 'SERVER_GAME_WRITE_REGRESSED'; END IF;
END $verify$;
\echo SHADOW_GAME_TRUSTED_WRITE_PRESERVED=PASS
-- Disposable rollback only. Never blanket-GRANT on production from this file.
GRANT INSERT,UPDATE,DELETE ON public.edu_game_attempts TO authenticated;
GRANT INSERT (xp_earned),UPDATE (xp_earned) ON public.edu_game_attempts TO anon,authenticated;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);
UPDATE public.edu_game_attempts SET xp_earned=5 WHERE student_id=(SELECT auth.uid());
RESET ROLE;
\echo SHADOW_GAME_WRITE_GRANTS_ROLLBACK=PASS
