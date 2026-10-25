\set ON_ERROR_STOP on
DO $permissions$
BEGIN
  IF has_function_privilege('anon',
      'public.dadyoom_consume_ai_skill_quota(uuid,text)','EXECUTE')
     OR has_function_privilege('authenticated',
      'public.dadyoom_consume_ai_skill_quota(uuid,text)','EXECUTE')
     OR NOT has_function_privilege('service_role',
      'public.dadyoom_consume_ai_skill_quota(uuid,text)','EXECUTE') THEN
    RAISE EXCEPTION 'SHADOW_AI_QUOTA_BROWSER_ROLE_NOT_BLOCKED';
  END IF;
END
$permissions$;
\echo SHADOW_AI_QUOTA_BROWSER_EXECUTE_DENIED=PASS

SET ROLE service_role;
DO $exercise$
DECLARE
  result record;
  idx int;
  uid uuid := '11111111-1111-4111-8111-111111111111';
BEGIN
  FOR idx IN 1..6 LOOP
    SELECT * INTO result FROM public.dadyoom_consume_ai_skill_quota(uid,'ai_writing_evaluate');
    IF result.allowed IS DISTINCT FROM (idx<=5)
       OR result.used_count <> LEAST(idx,5)
       OR result.daily_limit <> 5 THEN
      RAISE EXCEPTION 'SHADOW_AI_QUOTA_WRITING_LIMIT_FAILED %/%/%/%',
        idx,result.allowed,result.used_count,result.daily_limit;
    END IF;
  END LOOP;

  FOR idx IN 1..4 LOOP
    SELECT * INTO result FROM public.dadyoom_consume_ai_skill_quota(uid,'ai_speaking_evaluate');
    IF result.allowed IS DISTINCT FROM (idx<=3)
       OR result.used_count <> LEAST(idx,3)
       OR result.daily_limit <> 3 THEN
      RAISE EXCEPTION 'SHADOW_AI_QUOTA_SPEAKING_LIMIT_FAILED %/%/%/%',
        idx,result.allowed,result.used_count,result.daily_limit;
    END IF;
  END LOOP;

  BEGIN
    PERFORM public.dadyoom_consume_ai_skill_quota(uid,'invented_free_feature');
    RAISE EXCEPTION 'SHADOW_AI_QUOTA_UNKNOWN_FEATURE_WAS_ALLOWED';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'AI_SKILL_QUOTA_UNKNOWN_FEATURE' THEN
      RAISE;
    END IF;
  END;

  IF (SELECT count(*) FROM public.edu_feature_usage WHERE user_id=uid) <> 2 THEN
    RAISE EXCEPTION 'SHADOW_AI_QUOTA_UNKNOWN_FEATURE_CREATED_ROW';
  END IF;
END
$exercise$;
RESET ROLE;
\echo SHADOW_AI_QUOTA_FIXED_DAILY_LIMITS=PASS

-- The CI runner independently races several service connections against the
-- same student/feature. This SQL verified fixed limits and role isolation.
