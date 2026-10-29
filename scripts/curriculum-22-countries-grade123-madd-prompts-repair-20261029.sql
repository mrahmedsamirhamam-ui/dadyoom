-- One-time production repair of misleading Huroof al-Madd (long vowels) activity prompts.
-- Existing meaningful questions, their answer keys, lesson content, and students remain unchanged.
BEGIN ISOLATION LEVEL SERIALIZABLE;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='45s';
DO $fix$ DECLARE n int; BEGIN
 IF (SELECT count(*) FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
      WHERE l.title='حروف المد' AND g.grade_number BETWEEN 1 AND 3 AND l.status='published')<>66
 THEN RAISE EXCEPTION 'Unexpected 66-lesson coverage'; END IF;
 IF (SELECT count(*) FROM public.lesson_activities a JOIN public.lessons l ON l.id=a.lesson_id JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
     WHERE l.title='حروف المد' AND g.grade_number BETWEEN 1 AND 3 AND
     (a.prompt LIKE 'ما المهارة الرئيسة%' OR a.prompt LIKE 'أي اختيار يطبّق ما تعلمته%' OR a.prompt LIKE 'طبّق «%'))<>198
 THEN RAISE EXCEPTION 'Old generic activity fingerprints changed'; END IF;
 IF EXISTS (SELECT 1 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
   WHERE l.title='حروف المد' AND g.grade_number BETWEEN 1 AND 3 AND (
   (SELECT count(*) FROM public.questions q WHERE q.lesson_id=l.id)<>5 OR
   (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=l.id)<>3 OR
   EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id) OR
   EXISTS(SELECT 1 FROM public.lesson_mastery m WHERE m.lesson_id=l.id) OR
   EXISTS(SELECT 1 FROM public.questions q JOIN public.question_attempts qa ON qa.question_id=q.id WHERE q.lesson_id=l.id) OR
   EXISTS(SELECT 1 FROM public.questions q JOIN public.student_answers sa ON sa.question_id=q.id WHERE q.lesson_id=l.id) OR
   EXISTS(SELECT 1 FROM public.lesson_activities a JOIN public.lesson_activity_attempts aa ON aa.activity_id=a.id WHERE a.lesson_id=l.id)
   )) THEN RAISE EXCEPTION 'Learner work or lesson structure changed'; END IF;
 UPDATE public.lesson_activities a SET prompt=a.instructions,updated_at=now()
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
 WHERE a.lesson_id=l.id AND l.title='حروف المد' AND g.grade_number BETWEEN 1 AND 3 AND
 (a.prompt LIKE 'ما المهارة الرئيسة%' OR a.prompt LIKE 'أي اختيار يطبّق ما تعلمته%' OR a.prompt LIKE 'طبّق «%')
 AND a.content->>'origin'='DADYOOM_MADD_LETTERS_G123_22_20261028' AND length(btrim(a.instructions))>18;
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>198 THEN RAISE EXCEPTION 'Expected 198 activity corrections, got %',n; END IF;
END $fix$;
COMMIT;