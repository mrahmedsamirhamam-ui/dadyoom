-- DISPOSABLE-ONLY CANDIDATE. DO NOT USE AGAINST LIVE SUPABASE.
-- Protects existing public activity content/RLS while denying direct answer
-- column reads and browser writes. Requires authenticated teacher/student
-- Preview, affected writer inventory, rollback and approved real migration.
DO $guard$
BEGIN
 IF current_database() <> 'shadow_activity_privacy'
    OR current_setting('dadyoom.activity_privacy_rehearsal',true)
       IS DISTINCT FROM 'enabled'
 THEN RAISE EXCEPTION 'PRODUCTION_ACTIVITY_ANSWER_CUTOVER_BLOCKED'; END IF;
END $guard$;

CREATE OR REPLACE FUNCTION public.dadyoom_rehearsal_public_activity_content(
 p_content jsonb
) RETURNS boolean LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER
SET search_path=pg_catalog,pg_temp
AS $safe$
DECLARE k text; v jsonb; normalized text;
BEGIN
 IF p_content IS NULL THEN RETURN true; END IF;
 IF pg_catalog.jsonb_typeof(p_content)='object' THEN
  FOR k,v IN SELECT key,value FROM pg_catalog.jsonb_each(p_content)
  LOOP
   normalized:=pg_catalog.lower(pg_catalog.regexp_replace(k,'[^a-zA-Z0-9]','','g'));
   IF normalized=ANY(ARRAY[
     'answer','answers','answerkey','correctanswer','correctanswers',
     'correctword',
     'iscorrect','iscorrectoption','correctoption','solution','solutions',
     'grading','gradingkey','expectedanswer','expectedanswers',
     'privateanswer','rightanswer','markingkey','score','earnedpoints',
     'gradingweight','markscheme','isanswer','correctchoice',
     'correctoptionid','correctoptionids','answerindex','correctindex',
     'pointsawarded'
   ]) OR NOT public.dadyoom_rehearsal_public_activity_content(v)
   THEN RETURN false; END IF;
  END LOOP;
 ELSIF pg_catalog.jsonb_typeof(p_content)='array' THEN
  FOR v IN SELECT value FROM pg_catalog.jsonb_array_elements(p_content)
  LOOP
   IF NOT public.dadyoom_rehearsal_public_activity_content(v) THEN
      RETURN false;
   END IF;
  END LOOP;
 END IF;
 RETURN true;
END $safe$;

-- A strict validation check rejects future nested solution leaks instead
-- of silently serving them through raw public content, without deleting
-- or rewriting existing authored activities.
ALTER TABLE public.lesson_activities
 ADD CONSTRAINT dadyoom_public_activity_content_has_no_grading_keys
 CHECK (public.dadyoom_rehearsal_public_activity_content(content));

REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE
 ON public.lesson_activities FROM anon,authenticated;
GRANT SELECT (
 id,lesson_id,title,activity_type,instructions,content,activity_order,
 points,is_published,created_at,updated_at,section,prompt,is_required
) ON public.lesson_activities TO anon,authenticated;
-- Server role remains able to read 'answer' and write checked activities.
-- Student RLS and published-only filters remain intact.
