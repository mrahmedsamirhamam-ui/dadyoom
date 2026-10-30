-- Expose ONLY the student-visible wording of each activity question in the canonical lesson bundle.
-- The private "answer" column remains excluded. Existing answer redaction and RLS remain unchanged.
-- Preserve original function owner, grants, volatility (STABLE), search_path and SECURITY INVOKER.
-- Abort if the existing carefully audited function shape has diverged.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
DO $safe$
DECLARE function_oid oid;
        definition text;
        marker text := '''instructions'', a.instructions,';
        replacement text := '''instructions'', a.instructions,' || E'\n        ' || '''prompt'', a.prompt,';
BEGIN
 SELECT p.oid INTO function_oid FROM pg_proc p
 JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname='get_lesson_page_bundle'
 AND pg_get_function_identity_arguments(p.oid)='p_lesson_id uuid';
 IF function_oid IS NULL THEN RAISE EXCEPTION 'Canonical lesson RPC signature changed'; END IF;
 IF (SELECT p.prosecdef FROM pg_proc p WHERE p.oid=function_oid) THEN
   RAISE EXCEPTION 'Unexpected SECURITY DEFINER posture';
 END IF;
 SELECT pg_get_functiondef(function_oid) INTO definition;
 IF definition NOT LIKE '%''lesson_id'', a.lesson_id%' OR
    definition NOT LIKE '%''content'', a.content%' OR
    definition NOT LIKE '%''created_at'', a.created_at%' OR
    definition NOT LIKE '%from public.lesson_activities a%' OR
    definition NOT LIKE '%a.is_published = true%' OR
    definition NOT LIKE '%where l.id = p_lesson_id%' OR
    position('''answer'', a.answer' IN definition)>0 OR
    position('''prompt'', a.prompt' IN definition)>0 THEN
   RAISE EXCEPTION 'Public bundle activity list changed; refuse unsafe rewrite';
 END IF;
 IF (length(definition)-length(replace(definition,marker,'')))<>length(marker) THEN
   RAISE EXCEPTION 'Expected exactly one activity instructions projection';
 END IF;
 EXECUTE replace(definition,marker,replacement);
 IF position('''prompt'', a.prompt' IN pg_get_functiondef(function_oid))=0 THEN
  RAISE EXCEPTION 'Bundle prompt not installed';
 END IF;
 IF (SELECT p.prosecdef FROM pg_proc p WHERE p.oid=function_oid) THEN
  RAISE EXCEPTION 'SECURITY DEFINER unexpected';
 END IF;
 RAISE NOTICE 'Student-facing lesson activity question prompt now available without answer column';
END $safe$;
COMMIT;