-- Dadyoom 2026-10-29: preserve all lessons; derive ONLY skills supported by substantive published activity types.
-- Backup point: git commit containing this script, CONTENT_AUDIT.md and baseline JSON precedes execution.
-- Deliberately excludes DADYOOM_CORE_22_ACTIVITY_V1 templated activities and text-only skill guesses.
-- Marked activities have at least 40 characters of task prompt; this establishes a real activity, NOT flawless teaching quality.
-- Re-run safe on a database with new evidence by revising/removing exact-count baseline gates after independent audit.
BEGIN ISOLATION LEVEL SERIALIZABLE;
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='40s';
DO $body$
DECLARE expected integer;added integer;BEGIN
 IF (SELECT count(*) FROM public.lesson_skills)<>0 THEN
   RAISE EXCEPTION 'Expected zero preexisting skill links; audit changed production before retry.';
 END IF;
 SELECT count(*) INTO expected FROM (SELECT DISTINCT l.id lesson_id,a.activity_type skill
FROM public.lessons l JOIN public.lesson_activities a ON a.lesson_id=l.id
WHERE l.status='published' AND a.is_published IS TRUE
 AND a.activity_type IN('reading','writing','listening','speaking')
 AND a.content->>'origin' IS DISTINCT FROM 'DADYOOM_CORE_22_ACTIVITY_V1'
 AND length(trim(coalesce(a.prompt,'')))>=40) e;
 IF expected<>3418 THEN
   RAISE EXCEPTION 'Evidence cardinality changed: expected 3418, found %',expected;
 END IF;
 INSERT INTO public.lesson_skills(lesson_id,skill,display_order)
 SELECT e.lesson_id,e.skill,CASE e.skill
   WHEN 'reading' THEN 1 WHEN 'writing' THEN 2 WHEN 'listening' THEN 3 WHEN 'speaking' THEN 4 ELSE 9 END
 FROM (SELECT DISTINCT l.id lesson_id,a.activity_type skill
FROM public.lessons l JOIN public.lesson_activities a ON a.lesson_id=l.id
WHERE l.status='published' AND a.is_published IS TRUE
 AND a.activity_type IN('reading','writing','listening','speaking')
 AND a.content->>'origin' IS DISTINCT FROM 'DADYOOM_CORE_22_ACTIVITY_V1'
 AND length(trim(coalesce(a.prompt,'')))>=40) e
 ON CONFLICT (lesson_id,skill) DO NOTHING;
 GET DIAGNOSTICS added=ROW_COUNT;
 IF added<>expected THEN
   RAISE EXCEPTION 'Expected % new links, added %; rollback',expected,added;
 END IF;
 IF (SELECT count(*) FROM public.lesson_skills)<>expected THEN
   RAISE EXCEPTION 'Link count inconsistent';
 END IF;
END $body$;
COMMIT;
