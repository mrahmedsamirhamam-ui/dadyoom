-- DISPOSABLE SHADOW REHEARSAL ONLY; never apply to Dadyoom production.
-- Enable a fixed, non-plan-based daily cap for model-expensive evaluations:
--   speaking: 3 / student / UTC database day
--   writing:  5 / student / UTC database day
-- Unlike edu_consume_feature, unknown features MUST FAIL (not unlimited).
\set ON_ERROR_STOP on
DO $guard$
BEGIN
  IF current_database() <> 'shadow_ai_skill_quota'
     OR current_setting('dadyoom.ai_skill_quota_rehearsal', true) IS DISTINCT FROM 'enabled' THEN
    RAISE EXCEPTION 'PRODUCTION_AI_SKILL_QUOTA_BLOCKED_SHADOW_ONLY';
  END IF;
END
$guard$;

BEGIN;
CREATE OR REPLACE FUNCTION public.dadyoom_consume_ai_skill_quota(
  p_student_id uuid,
  p_feature text
) RETURNS TABLE(allowed boolean, used_count integer, daily_limit integer)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  v_limit integer;
  v_used integer;
BEGIN
  IF p_student_id IS NULL THEN
    RAISE EXCEPTION 'AI_SKILL_QUOTA_USER_REQUIRED';
  END IF;
  v_limit := CASE p_feature
    WHEN 'ai_speaking_evaluate' THEN 3
    WHEN 'ai_writing_evaluate' THEN 5
    ELSE NULL
  END;
  IF v_limit IS NULL THEN
    RAISE EXCEPTION 'AI_SKILL_QUOTA_UNKNOWN_FEATURE';
  END IF;

  INSERT INTO public.edu_feature_usage(user_id, usage_date, feature, used_count, updated_at)
  VALUES (p_student_id, (now() AT TIME ZONE 'UTC')::date, p_feature, 0, now())
  ON CONFLICT (user_id,usage_date,feature) DO NOTHING;

  SELECT u.used_count INTO v_used
    FROM public.edu_feature_usage AS u
    WHERE u.user_id = p_student_id
      AND u.usage_date = (now() AT TIME ZONE 'UTC')::date
      AND u.feature = p_feature
    FOR UPDATE;

  IF NOT FOUND OR v_used IS NULL OR v_used < 0 THEN
    RAISE EXCEPTION 'AI_SKILL_QUOTA_CANNOT_LOCK';
  END IF;
  IF v_used >= v_limit THEN
    RETURN QUERY SELECT false, v_used, v_limit;
    RETURN;
  END IF;
  UPDATE public.edu_feature_usage u
    SET used_count = u.used_count + 1, updated_at = now()
    WHERE u.user_id = p_student_id
      AND u.usage_date = (now() AT TIME ZONE 'UTC')::date
      AND u.feature = p_feature
    RETURNING u.used_count INTO v_used;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'AI_SKILL_QUOTA_UPDATE_FAILED';
  END IF;
  RETURN QUERY SELECT true, v_used, v_limit;
END
$function$;

-- Never expose a server-credit-consuming function to browser roles.
REVOKE ALL ON FUNCTION public.dadyoom_consume_ai_skill_quota(uuid,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dadyoom_consume_ai_skill_quota(uuid,text)
  TO service_role;
COMMIT;
