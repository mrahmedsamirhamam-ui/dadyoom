-- Dadyoom original sukun remediation 2026-10-29: read-only integrity checks.
-- No answer keys or personal student data are returned in this report.
WITH target AS (
 SELECT l.id,l.title,l.status,l.content,l.learning_objectives,co.code country_code,g.grade_number
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id JOIN public.curricula c ON c.id=g.curriculum_id
 JOIN public.countries co ON co.id=c.country_id
 WHERE l.title='السكون والمقطع' AND g.grade_number BETWEEN 1 AND 3
), outcome AS (
 SELECT t.*,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id) questions,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id AND
  EXISTS(SELECT 1 FROM jsonb_array_elements(q.options) opt WHERE opt->>'id'=q.correct_answer)) valid_key_references,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id AND
  (q.question LIKE 'ما المهارة الرئيسة%' OR q.question LIKE 'أي تطبيق يساعدك%' OR
   q.question LIKE 'ما الخطوة الأفضل%' OR q.question LIKE 'كيف تتحقق%')) generic_questions,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id) activities,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id AND
  a.content->>'origin' IN ('DADYOOM_BH_SU_KUN_G123_ORIGINAL_20261029',
  'DADYOOM_SUKUN_21_COUNTRIES_G123_ORIGINAL_20261029')) original_activities,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id AND
  (a.prompt LIKE 'ما المهارة الرئيسة%' OR a.prompt LIKE 'أي اختيار يطبّق ما تعلمته%')) generic_prompts,
 (SELECT count(*) FROM public.student_lesson_progress p WHERE p.lesson_id=t.id) progress_records
 FROM target t
)
SELECT country_code,grade_number,id,status,length(content) content_length,
 jsonb_array_length(learning_objectives) objectives,questions,valid_key_references,
 generic_questions,activities,original_activities,generic_prompts,progress_records
FROM outcome ORDER BY country_code,grade_number;
