-- PROPOSAL ONLY — intentionally NON-DEPLOYABLE.
-- Must pass disposable tests, authenticated teacher/student Preview,
-- direct REST role checks, rollback and source-compatibility before any
-- separately authored production migration. Never run on live Supabase.
DO $guard$
BEGIN
 IF current_database() <> 'shadow_question_privacy'
   OR current_setting('dadyoom.question_privacy_rehearsal',true)
      IS DISTINCT FROM 'enabled'
 THEN
   RAISE EXCEPTION 'PRODUCTION_QUESTION_KEY_CUTOVER_BLOCKED';
 END IF;
END $guard$;

-- The public invoker view reads q.options. A bare column grant would hide
-- correct_answer but could leak hidden keys subsequently embedded in the
-- JSON options array. Freeze it to the exact currently audited public shape.
CREATE OR REPLACE FUNCTION public.dadyoom_rehearsal_public_question_options(
  p_options jsonb
) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER
SET search_path=pg_catalog,pg_temp
AS $safe$
DECLARE item jsonb; key_count int; n int;
BEGIN
 IF p_options IS NULL OR pg_catalog.jsonb_typeof(p_options)<>'array' THEN
   RETURN false;
 END IF;
 n:=pg_catalog.jsonb_array_length(p_options);
 IF n<2 OR n>50 THEN RETURN false; END IF;
 FOR item IN SELECT value FROM pg_catalog.jsonb_array_elements(p_options)
 LOOP
  IF pg_catalog.jsonb_typeof(item)<>'object'
    OR pg_catalog.jsonb_typeof(item->'id')<>'string'
    OR pg_catalog.jsonb_typeof(item->'text')<>'string'
    OR pg_catalog.length(pg_catalog.btrim(item->>'id'))=0
    OR pg_catalog.length(pg_catalog.btrim(item->>'text'))=0
  THEN RETURN false; END IF;
  SELECT count(*) INTO key_count FROM pg_catalog.jsonb_object_keys(item);
  IF key_count<>2 THEN RETURN false; END IF;
 END LOOP;
 RETURN true;
END $safe$;

-- Validation is deliberate. DO NOT drop or repair legacy rows automatically
-- just to make the migration pass. Teacher authoring richer option objects
-- needs a separately reviewed UI/schema design before this strict cutover.
ALTER TABLE public.questions
 ADD CONSTRAINT dadyoom_public_options_only_id_text
 CHECK (public.dadyoom_rehearsal_public_question_options(options));

-- The original invoker RLS/published-only view is retained; all authoring
-- and grading operations must be trusted server actions/RPCs BEFORE release.
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE
  ON public.questions FROM anon, authenticated;
GRANT SELECT (id,lesson_id,question_order,question,question_type,options,points)
  ON public.questions TO anon,authenticated;
-- No service_role grants, RLS policies, rows or draft status are modified.
