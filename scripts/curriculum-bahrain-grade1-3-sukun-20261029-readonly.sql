-- Read-only verification of Dadyoom's original Bahrain Grade 1–3 sukun lessons.
-- Intentionally returns no answer values or student identifiers.
WITH target AS (
 SELECT l.id, g.grade_number, l.status, l.content, l.learning_objectives
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id JOIN public.curricula cu ON cu.id=g.curriculum_id
 JOIN public.countries c ON c.id=cu.country_id
 WHERE l.title='السكون والمقطع' AND c.code='BH' AND g.grade_number BETWEEN 1 AND 3
)
SELECT t.grade_number,t.id,t.status,length(t.content) content_length,jsonb_array_length(t.learning_objectives) objective_count,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id) question_count,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id AND
  EXISTS(SELECT 1 FROM jsonb_array_elements(q.options) o WHERE o->>'id'=q.correct_answer)) valid_key_count,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id AND (
  q.question LIKE 'ما المهارة الرئيسة%' OR q.question LIKE 'أي تطبيق يساعدك%' OR
  q.question LIKE 'ما الخطوة الأفضل%' OR q.question LIKE 'كيف تتحقق%')) generic_question_count,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id) activity_count,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id AND
  a.content->>'origin'='DADYOOM_BH_SU_KUN_G123_ORIGINAL_20261029') revised_activity_count,
 (SELECT count(*) FROM public.student_lesson_progress p WHERE p.lesson_id=t.id) progress_rows,
 (SELECT count(*) FROM public.questions q JOIN public.question_attempts qa ON qa.question_id=q.id WHERE q.lesson_id=t.id) attempts
FROM target t ORDER BY t.grade_number;
