-- Applied to production and verified on 2026-10-25.
-- Prevents unauthenticated browsing of correct_answer while preserving
-- the existing security_invoker safe question view and privileged grading.
-- Main/teacher authenticated read grants are intentionally unchanged.
-- Break-glass rollback only after review:
-- GRANT SELECT ON public.questions TO anon;
DO $preflight$
BEGIN
 IF NOT EXISTS(
   SELECT 1 FROM pg_class WHERE oid='public.questions'::regclass AND relrowsecurity
 ) THEN RAISE EXCEPTION 'PUBLIC_QUESTION_RLS_MISSING'; END IF;
 IF NOT EXISTS(
   SELECT 1 FROM pg_class WHERE oid='public.dadyoom_student_questions'::regclass
     AND 'security_invoker=true'=ANY(reloptions)
 ) THEN RAISE EXCEPTION 'PUBLIC_STUDENT_VIEW_MUST_BE_RLS_INVOKER'; END IF;
 IF EXISTS (
   SELECT 1
   FROM public.questions q
   CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(q.options)='array' THEN q.options ELSE '[]'::jsonb END
   ) o
   WHERE jsonb_typeof(o)='object'
     AND EXISTS(SELECT 1 FROM jsonb_object_keys(o) k WHERE k NOT IN ('id','text'))
 ) THEN RAISE EXCEPTION 'QUESTION_OPTIONS_NESTED_KEY_REVIEW_REQUIRED'; END IF;
END $preflight$;
REVOKE SELECT ON TABLE public.questions FROM anon;
GRANT SELECT (id, lesson_id, question_order, question, question_type, options, points)
  ON TABLE public.questions TO anon;
DO $verify$
BEGIN
 IF has_column_privilege('anon','public.questions','correct_answer','SELECT')
   OR NOT has_column_privilege('anon','public.questions','id','SELECT')
   OR NOT has_column_privilege('anon','public.questions','options','SELECT')
   OR NOT has_column_privilege('authenticated','public.questions','correct_answer','SELECT')
   OR NOT has_column_privilege('service_role','public.questions','correct_answer','SELECT')
 THEN RAISE EXCEPTION 'ANON_QUESTION_ANSWER_KEY_CUTOVER_FAILED'; END IF;
END $verify$;