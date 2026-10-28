-- Verify the real candidate RPC, after overlaying it in a disposable DB.
\set ON_ERROR_STOP on
SET ROLE anon;
DO $test$
DECLARE result jsonb; content jsonb; draft jsonb;
BEGIN
  SELECT public.get_lesson_page_bundle('00000000-0000-4000-8000-000000000001'::uuid)
  INTO result;
  IF result IS NULL OR jsonb_array_length(result->'activities') <> 1
  THEN RAISE EXCEPTION 'SAFE_ANON_PUBLISHED_ACTIVITY_MISSING'; END IF;
  content := result->'activities'->0->'content';
  IF content->>'section' <> 'reading' OR content->>'text' <> 'Choose the letter'
    OR content->>'image_url' <> 'https://example.invalid/a.png'
    OR content->'forms' <> '["alif","ba"]'::jsonb
  THEN RAISE EXCEPTION 'SAFE_RPC_PUBLIC_EDUCATIONAL_CONTENT_LOST'; END IF;
  IF content->'options' <> '[{"id":"a","text":"alif"},{"id":"b","text":"ba"}]'::jsonb
  THEN RAISE EXCEPTION 'SAFE_RPC_NESTED_OPTION_HINTS_NOT_REMOVED'; END IF;
  IF content->'nested' <> '{"examples":[{"label":"Example"}],"prompt":"Learn"}'::jsonb
  THEN RAISE EXCEPTION 'SAFE_RPC_DEEP_HINTS_NOT_REMOVED'; END IF;
  IF (result->'activities'->0->>'points')::integer <> 5
  THEN RAISE EXCEPTION 'SAFE_RPC_PUBLIC_POINTS_LOST'; END IF;
  IF result->'questions'->0->'options'->0 ? 'isCorrect'
  THEN RAISE EXCEPTION 'SAFE_RPC_QUESTION_ANSWER_LEAK'; END IF;
  IF result->'student' IS DISTINCT FROM 'null'::jsonb
    OR result->'learningProgress' IS DISTINCT FROM 'null'::jsonb
    OR result->'tutorMessages' <> '[]'::jsonb
  THEN RAISE EXCEPTION 'SAFE_RPC_ANON_OWNERSHIP_LEAK'; END IF;
  SELECT public.get_lesson_page_bundle('00000000-0000-4000-8000-000000000002'::uuid)
  INTO draft;
  IF draft IS NOT NULL THEN RAISE EXCEPTION 'SAFE_RPC_DRAFT_EXPOSED'; END IF;
END $test$;
RESET ROLE;
\echo SHADOW_RPC_ANON_REDACTED_PUBLISHED_ONLY=PASS

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','50000000-0000-4000-8000-000000000001',false);
DO $test$
DECLARE result jsonb;
BEGIN
  SELECT public.get_lesson_page_bundle('00000000-0000-4000-8000-000000000001'::uuid)
  INTO result;
  IF result->'student'->>'id' <> '50000000-0000-4000-8000-000000000001'
   OR (result->'learningProgress'->>'best_score')::integer <> 45
   OR (result->'questionAttempts'->0->>'is_correct')::boolean IS DISTINCT FROM true
   OR result->'tutorMessages'->0->>'content' <> 'private-first'
  THEN RAISE EXCEPTION 'SAFE_RPC_AUTH_OWN_DATA_REGRESSION'; END IF;
  IF result->'activities'->0->'content'->'options'->0 ? 'score'
  THEN RAISE EXCEPTION 'SAFE_RPC_AUTH_NESTED_GRADE_LEAK'; END IF;
  IF jsonb_array_length(result->'tutorMessages') <> 1
  THEN RAISE EXCEPTION 'SAFE_RPC_CROSS_USER_TUTOR_EXPOSURE'; END IF;
  IF public.get_lesson_page_bundle('00000000-0000-4000-8000-000000000002'::uuid) IS NOT NULL
  THEN RAISE EXCEPTION 'SAFE_RPC_AUTH_DRAFT_EXPOSED'; END IF;
END $test$;
RESET ROLE;
\echo SHADOW_RPC_AUTH_OWN_DATA_REDACTED=PASS

DO $test$
DECLARE is_definer boolean; sql_text text;
BEGIN
  SELECT p.prosecdef INTO is_definer FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='get_lesson_page_bundle';
  IF is_definer IS DISTINCT FROM false
  THEN RAISE EXCEPTION 'RPC_HAS_PRIVILEGED_DEFINER'; END IF;
  SELECT pg_get_functiondef('public.get_lesson_page_bundle(uuid)'::regprocedure) INTO sql_text;
  IF position('public.dadyoom_public_activity_content(a.content)' in sql_text) = 0
  THEN RAISE EXCEPTION 'RPC_DID_NOT_USE_SQL_REDACTOR'; END IF;
END $test$;
\echo SHADOW_RPC_INVOKER_NO_ROLE_ESCALATION=PASS
