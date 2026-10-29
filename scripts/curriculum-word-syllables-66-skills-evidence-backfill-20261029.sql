-- 2026-10-29, 66 existing original word/syllable lessons, Grade1–3, 22 countries.
-- Connect ONLY substantiated reading/writing activities; preserve existing skill links and student grades.
-- Re-run requires a fresh read-only audit. Fail closed on concurrent changes.
BEGIN ISOLATION LEVEL SERIALIZABLE;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $block$
DECLARE observed integer; inserted integer;
BEGIN
 IF (SELECT count(*) FROM public.lesson_skills)<>3418 THEN
  RAISE EXCEPTION 'Global skill-link baseline changed'; END IF;
 IF (SELECT count(*) FROM public.lesson_skills ls JOIN public.lessons l ON ls.lesson_id=l.id
 JOIN public.units u ON l.unit_id=u.id JOIN public.grades g ON u.grade_id=g.id
 WHERE l.title='بناء الكلمة من المقاطع' AND g.grade_number BETWEEN 1 AND 3)<>3 THEN
  RAISE EXCEPTION 'Syllable skill-link baseline changed'; END IF;
 WITH candidates AS (
  SELECT DISTINCT l.id lesson_id,a.activity_type skill
  FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
  JOIN public.grades g ON u.grade_id=g.id JOIN public.lesson_activities a ON a.lesson_id=l.id
  WHERE l.title='بناء الكلمة من المقاطع' AND l.status='published'
   AND g.grade_number IN(1,2,3) AND a.is_published IS TRUE
   AND a.activity_type IN('reading','writing')
   AND length(trim(coalesce(a.prompt,'')))>=40
   AND a.content->>'origin' IS DISTINCT FROM 'DADYOOM_CORE_22_ACTIVITY_V1'
 )
 SELECT count(*) INTO observed FROM candidates;
 IF observed<>132 THEN RAISE EXCEPTION 'Unexpected syllabus evidence count %',observed;END IF;
 WITH candidates AS (
  SELECT DISTINCT l.id lesson_id,a.activity_type skill
  FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
  JOIN public.grades g ON u.grade_id=g.id JOIN public.lesson_activities a ON a.lesson_id=l.id
  WHERE l.title='بناء الكلمة من المقاطع' AND l.status='published'
   AND g.grade_number IN(1,2,3) AND a.is_published IS TRUE
   AND a.activity_type IN('reading','writing')
   AND length(trim(coalesce(a.prompt,'')))>=40
   AND a.content->>'origin' IS DISTINCT FROM 'DADYOOM_CORE_22_ACTIVITY_V1'
 )
 INSERT INTO public.lesson_skills(lesson_id,skill,display_order)
 SELECT lesson_id,skill,CASE skill WHEN 'reading' THEN 1 WHEN 'writing' THEN 2 ELSE 9 END
 FROM candidates ON CONFLICT (lesson_id,skill) DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT;
 IF inserted<>129 THEN RAISE EXCEPTION 'Expected 129 new skill links, got %',inserted;END IF;
 IF (SELECT count(*) FROM public.lesson_skills)<>3547 THEN
  RAISE EXCEPTION 'Global final count wrong';END IF;
END $block$;
COMMIT;