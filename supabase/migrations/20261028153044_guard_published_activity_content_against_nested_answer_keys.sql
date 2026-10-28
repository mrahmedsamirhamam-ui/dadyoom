-- Applied on 2026-10-28 to production Supabase hvqsvtomhlxavmfqoxfz.
-- Guards the existing published activity CONTENT JSON against newly embedded
-- grading metadata. Baseline: 23,779 published activities, 0 unsafe JSON;
-- 452 unpublished activities with 3 unsafe content JSON values remain intact.
-- This does NOT revoke authenticated SELECT on lesson_activities.answer.
CREATE OR REPLACE FUNCTION public.dadyoom_published_activity_content_safe(p_content jsonb)
RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $safe$
DECLARE k text; v jsonb; normalized text;
BEGIN
 IF p_content IS NULL THEN RETURN true; END IF;
 IF pg_catalog.jsonb_typeof(p_content)='object' THEN
  FOR k,v IN SELECT key,value FROM pg_catalog.jsonb_each(p_content)
  LOOP
   normalized := pg_catalog.lower(pg_catalog.regexp_replace(k,'[^a-zA-Z0-9]','','g'));
   IF normalized=ANY(ARRAY[
     'answer','answers','answerkey','correctanswer','correctanswers',
     'correctword','iscorrect','iscorrectoption','correctoption',
     'solution','solutions','grading','gradingkey','expectedanswer',
     'expectedanswers','privateanswer','rightanswer','markingkey',
     'score','earnedpoints','gradingweight','markscheme','isanswer',
     'correctchoice','correctoptionid','correctoptionids',
     'answerindex','correctindex','pointsawarded'
   ]) OR NOT public.dadyoom_published_activity_content_safe(v)
   THEN RETURN false; END IF;
  END LOOP;
 ELSIF pg_catalog.jsonb_typeof(p_content)='array' THEN
  FOR v IN SELECT value FROM pg_catalog.jsonb_array_elements(p_content)
  LOOP
   IF NOT public.dadyoom_published_activity_content_safe(v)
   THEN RETURN false; END IF;
  END LOOP;
 END IF;
 RETURN true;
END
$safe$;

ALTER TABLE public.lesson_activities
 ADD CONSTRAINT lesson_activities_published_content_has_no_grading_keys
 CHECK (
   is_published IS DISTINCT FROM true
   OR public.dadyoom_published_activity_content_safe(content)
 ) NOT VALID;

ALTER TABLE public.lesson_activities
 VALIDATE CONSTRAINT lesson_activities_published_content_has_no_grading_keys;

COMMENT ON CONSTRAINT lesson_activities_published_content_has_no_grading_keys
 ON public.lesson_activities IS
 'Rejects nested answer/grading keys in student-visible activity content; unpublished drafts are exempt. Answer column remains private pending role-column cutover.';
