-- Safe educational Arabic grammar/collocation corrections in 24 published Grade1-3 original supplementary stories.
-- Independently confirmed 40 original occurrences, zero learner histories; preserves all question/activity keys and IDs.
-- Does not assert official syllabus equivalence or fix unrelated textual/teacher-review defects.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
CREATE TEMP TABLE dadyoom_g123_prose_fixes(old_text text PRIMARY KEY,new_text text NOT NULL,expected_lessons integer NOT NULL) ON COMMIT DROP;
INSERT INTO pg_temp.dadyoom_g123_prose_fixes(old_text,new_text,expected_lessons)
VALUES
('واجه مها','واجهت مها',4),
('استنتج مها','استنتجت مها',4),
('لاحظ أمينة','لاحظت أمينة',4),
('استنتج أمينة','استنتجت أمينة',4),
('كان هدف هذا الإجراء لتقرأ','كان الهدف من ذلك أن تقرأ',4),
('كان هدف هذا الإجراء ليعرف','كان الهدف من ذلك أن يعرف',12),
('كان هدف هذا الإجراء لتقليل','كان الهدف من ذلك تقليل',4),
('كان هدف هذا الإجراء ليستطيع','كان الهدف من ذلك أن يستطيع',4);
DO $safe$
DECLARE n int; hist int; result_count int; fix_rec record;
BEGIN
 FOR fix_rec IN SELECT * FROM pg_temp.dadyoom_g123_prose_fixes LOOP
  SELECT COUNT(*) INTO n
   FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
   WHERE l.status='published' AND g.grade_number BETWEEN 1 AND 3 AND l.content LIKE '%'||fix_rec.old_text||'%';
  IF n<>fix_rec.expected_lessons THEN
    RAISE EXCEPTION 'Text pattern count drift for %: got % / expected %',fix_rec.old_text,n,fix_rec.expected_lessons;
  END IF;
 END LOOP;
 WITH targets AS (
  SELECT l.id FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
  WHERE l.status='published' AND g.grade_number BETWEEN 1 AND 3 AND (l.content LIKE '%'||'واجه مها'||'%' OR l.content LIKE '%'||'استنتج مها'||'%' OR l.content LIKE '%'||'لاحظ أمينة'||'%' OR l.content LIKE '%'||'استنتج أمينة'||'%' OR l.content LIKE '%'||'كان هدف هذا الإجراء لتقرأ'||'%' OR l.content LIKE '%'||'كان هدف هذا الإجراء ليعرف'||'%' OR l.content LIKE '%'||'كان هدف هذا الإجراء لتقليل'||'%' OR l.content LIKE '%'||'كان هدف هذا الإجراء ليستطيع'||'%')
 )
 SELECT COUNT(*) INTO n FROM targets;
 IF n<>24 THEN RAISE EXCEPTION 'Expected 24 immutable lesson records to correct, got %',n; END IF;
 SELECT COUNT(*) INTO hist
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
 WHERE l.status='published' AND g.grade_number BETWEEN 1 AND 3 AND (l.content LIKE '%'||'واجه مها'||'%' OR l.content LIKE '%'||'استنتج مها'||'%' OR l.content LIKE '%'||'لاحظ أمينة'||'%' OR l.content LIKE '%'||'استنتج أمينة'||'%' OR l.content LIKE '%'||'كان هدف هذا الإجراء لتقرأ'||'%' OR l.content LIKE '%'||'كان هدف هذا الإجراء ليعرف'||'%' OR l.content LIKE '%'||'كان هدف هذا الإجراء لتقليل'||'%' OR l.content LIKE '%'||'كان هدف هذا الإجراء ليستطيع'||'%')
  AND (EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
  OR EXISTS(SELECT 1 FROM public.lesson_activity_attempts a JOIN public.lesson_activities la ON la.id=a.activity_id WHERE la.lesson_id=l.id)
  OR EXISTS(SELECT 1 FROM public.question_attempts at JOIN public.questions q ON q.id=at.question_id WHERE q.lesson_id=l.id));
 IF hist<>0 THEN RAISE EXCEPTION 'Protected learner history appeared in % target lessons',hist; END IF;
 UPDATE public.lessons l
 SET content=replace(replace(replace(replace(replace(replace(replace(replace(l.content,'واجه مها','واجهت مها'),'استنتج مها','استنتجت مها'),'لاحظ أمينة','لاحظت أمينة'),'استنتج أمينة','استنتجت أمينة'),'كان هدف هذا الإجراء لتقرأ','كان الهدف من ذلك أن تقرأ'),'كان هدف هذا الإجراء ليعرف','كان الهدف من ذلك أن يعرف'),'كان هدف هذا الإجراء لتقليل','كان الهدف من ذلك تقليل'),'كان هدف هذا الإجراء ليستطيع','كان الهدف من ذلك أن يستطيع'),updated_at=now()
 FROM (
  SELECT l2.id FROM public.lessons l2 JOIN public.units u ON u.id=l2.unit_id JOIN public.grades g ON g.id=u.grade_id
  WHERE l2.status='published' AND g.grade_number BETWEEN 1 AND 3 AND
  (l2.content LIKE '%'||'واجه مها'||'%' OR l2.content LIKE '%'||'استنتج مها'||'%' OR l2.content LIKE '%'||'لاحظ أمينة'||'%' OR l2.content LIKE '%'||'استنتج أمينة'||'%' OR l2.content LIKE '%'||'كان هدف هذا الإجراء لتقرأ'||'%' OR l2.content LIKE '%'||'كان هدف هذا الإجراء ليعرف'||'%' OR l2.content LIKE '%'||'كان هدف هذا الإجراء لتقليل'||'%' OR l2.content LIKE '%'||'كان هدف هذا الإجراء ليستطيع'||'%')
 ) targets
 WHERE l.id=targets.id AND l.status='published'
 AND NOT EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
 AND NOT EXISTS(SELECT 1 FROM public.lesson_activity_attempts a JOIN public.lesson_activities la ON la.id=a.activity_id WHERE la.lesson_id=l.id)
 AND NOT EXISTS(SELECT 1 FROM public.question_attempts at JOIN public.questions q ON q.id=at.question_id WHERE q.lesson_id=l.id);
 GET DIAGNOSTICS result_count=ROW_COUNT;
 IF result_count<>24 THEN RAISE EXCEPTION 'Rollback incomplete prose correction, changed %',result_count; END IF;
 FOR fix_rec IN SELECT * FROM pg_temp.dadyoom_g123_prose_fixes LOOP
  IF EXISTS(SELECT 1 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
   WHERE l.status='published' AND g.grade_number BETWEEN 1 AND 3 AND l.content LIKE '%'||fix_rec.old_text||'%')
   THEN RAISE EXCEPTION 'Rollback: faulty prose still present after correction for %',fix_rec.old_text; END IF;
 END LOOP;
 RAISE NOTICE 'DADYOOM_G123_24_LECTORIAL_PROSE_CORRECTIONS=%',result_count;
END $safe$;
COMMIT;
