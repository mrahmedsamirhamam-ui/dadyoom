-- Reapply baseline RPC before this file, then verify and drop the optional
-- helper. No production rows, roles or migrations involved.
\set ON_ERROR_STOP on
DROP FUNCTION public.dadyoom_public_activity_content(jsonb);
SET ROLE anon;
DO $test$
DECLARE result jsonb;
BEGIN
  SELECT public.get_lesson_page_bundle('00000000-0000-4000-8000-000000000001'::uuid)
  INTO result;
  IF result->'activities'->0->'content'->'options'->0->'isCorrect' IS DISTINCT FROM 'true'::jsonb
  THEN RAISE EXCEPTION 'ROLLBACK_DID_NOT_RESTORE_PRIOR_RPC'; END IF;
  IF result->'questions'->0->'options'->0 ? 'isCorrect'
  THEN RAISE EXCEPTION 'ROLLBACK_QUESTION_VIEW_REGRESSED'; END IF;
END $test$;
RESET ROLE;
\echo SHADOW_RPC_ROLLBACK_RESTORED=PASS
