-- Before applying the candidate in a DISPOSABLE database only, explicitly
-- reproduce the nested activity grading hint visible in the existing RPC.
\set ON_ERROR_STOP on
SET ROLE anon;
DO $test$
DECLARE result jsonb; draft jsonb;
BEGIN
  SELECT public.get_lesson_page_bundle('00000000-0000-4000-8000-000000000001'::uuid)
  INTO result;
  IF result->'activities'->0->'content'->'options'->0->'isCorrect' IS DISTINCT FROM 'true'::jsonb
  THEN RAISE EXCEPTION 'BASELINE_DID_NOT_REPRODUCE_UNFILTERED_ACTIVITY_CONTENT'; END IF;
  IF result->'questions'->0->'options'->0 ? 'isCorrect'
  THEN RAISE EXCEPTION 'BASELINE_QUESTION_VIEW_LEAK'; END IF;
  IF result->'activities'->0 ? 'answer'
  THEN RAISE EXCEPTION 'BASELINE_UNEXPECTED_TOP_LEVEL_KEY'; END IF;
  SELECT public.get_lesson_page_bundle('00000000-0000-4000-8000-000000000002'::uuid)
  INTO draft;
  IF draft IS NOT NULL THEN RAISE EXCEPTION 'BASELINE_DRAFT_LEAK'; END IF;
END $test$;
RESET ROLE;
\echo SHADOW_RPC_BASELINE_NESTED_ACTIVITY_HINT_REPRODUCED=PASS
