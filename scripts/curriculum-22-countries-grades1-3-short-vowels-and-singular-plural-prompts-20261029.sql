-- Dadyoom 22-country Grades 1-3 repaired short-vowel and singular/plural prompts.
-- Original lesson explanations, questions, keys, answer JSON and student data are never rewritten.
-- One-time guarded correction of misleading activity prompt fields only. Not official syllabus certification.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';
DO $guard$
DECLARE n integer;
BEGIN
 IF (SELECT count(*) FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
     JOIN public.grades g ON g.id=u.grade_id
     WHERE l.title IN ('الحركات القصيرة','المفرد والجمع') AND g.grade_number BETWEEN 1 AND 3 AND l.status='published') <> 132
 THEN RAISE EXCEPTION 'Wrong number of published lessons'; END IF;
 IF (SELECT count(*) FROM public.lesson_activities a JOIN public.lessons l ON l.id=a.lesson_id
     JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
     WHERE l.title IN ('الحركات القصيرة','المفرد والجمع') AND g.grade_number BETWEEN 1 AND 3
     AND (a.prompt LIKE 'ما المهارة الرئيسة%' OR a.prompt LIKE 'أي اختيار يطبّق ما تعلمته%' OR a.prompt LIKE 'طبّق «%')) <>396
 THEN RAISE EXCEPTION 'Generic activity fingerprint changed'; END IF;
 IF EXISTS(
  SELECT 1 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
  WHERE l.title IN ('الحركات القصيرة','المفرد والجمع') AND g.grade_number BETWEEN 1 AND 3
  AND ((SELECT count(*) FROM public.questions q WHERE q.lesson_id=l.id)<>5
    OR (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=l.id)<>3
    OR (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=l.id AND length(btrim(a.instructions))<18)>0)
 ) THEN RAISE EXCEPTION 'Target content or instructions unexpected'; END IF;
 IF EXISTS(
  SELECT 1 FROM public.lessons l
  WHERE l.title IN ('الحركات القصيرة','المفرد والجمع') AND
    (EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
    OR EXISTS(SELECT 1 FROM public.lesson_mastery m WHERE m.lesson_id=l.id)
    OR EXISTS(SELECT 1 FROM public.questions q JOIN public.question_attempts qa ON qa.question_id=q.id WHERE q.lesson_id=l.id)
    OR EXISTS(SELECT 1 FROM public.questions q JOIN public.student_answers sa ON sa.question_id=q.id WHERE q.lesson_id=l.id)
    OR EXISTS(SELECT 1 FROM public.lesson_activities a JOIN public.lesson_activity_attempts aa ON aa.activity_id=a.id WHERE a.lesson_id=l.id))
 ) THEN RAISE EXCEPTION 'Student work linked to a target lesson'; END IF;
 UPDATE public.lesson_activities a
 SET prompt=a.instructions, updated_at=now()
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
 WHERE a.lesson_id=l.id AND l.title IN ('الحركات القصيرة','المفرد والجمع')
  AND g.grade_number BETWEEN 1 AND 3
  AND (a.prompt LIKE 'ما المهارة الرئيسة%' OR a.prompt LIKE 'أي اختيار يطبّق ما تعلمته%' OR a.prompt LIKE 'طبّق «%');
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>396 THEN RAISE EXCEPTION 'Unexpected update count %',n; END IF;
END $guard$;
COMMIT;
