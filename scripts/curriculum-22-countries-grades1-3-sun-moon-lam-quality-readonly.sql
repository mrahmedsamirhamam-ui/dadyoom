-- Original Arabic definite-article (sun/moon lam) lessons in 22 countries x Grades 1-3.
-- Source is Dadyoom-original enrichment, NOT a government textbook match.
-- Read-only; returns no correct-answer values or student records.
WITH lessons AS (
 SELECT co.code,co.name_ar country_name,g.grade_number,l.id,l.status,
  jsonb_array_length(l.learning_objectives) objectives,
  jsonb_array_length(l.vocabulary) vocabulary,
  left(l.content,90) provenance
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula c ON c.id=g.curriculum_id
 JOIN public.countries co ON co.id=c.country_id
 WHERE l.title='اللام الشمسية والقمرية' AND g.grade_number IN (1,2,3)
), question_quality AS (
 SELECT l.id lesson_id,count(*) question_count,
  count(*) FILTER (WHERE EXISTS(
   SELECT 1 FROM jsonb_array_elements(q.options) option
   WHERE option->>'id'=q.correct_answer
  )) valid_key_reference_count,
  count(*) FILTER (WHERE q.question LIKE 'ما المهارة الرئيسة%'
   OR q.question LIKE 'أي تطبيق يساعدك على إتقان درس%'
   OR q.question LIKE 'ما الخطوة الأفضل بعد فهم مثال درس%'
   OR q.question LIKE 'كيف تتحقق من إتقان المهارة الأساسية%') generic_count
 FROM lessons l JOIN public.questions q ON q.lesson_id=l.id GROUP BY l.id
), activity_quality AS (
 SELECT l.id lesson_id,count(*) activity_count,
  count(*) FILTER(WHERE a.is_published) published_activity_count,
  count(*) FILTER(WHERE a.content->>'origin'='DADYOOM_SUN_MOON_LAM_22_G123_20261028') revised_count,
  count(*) FILTER(WHERE a.activity_type='multiple_choice'
   AND a.content->'options' ? (a.answer->>'correct')) valid_mcq_count,
  count(*) FILTER(WHERE a.activity_type='reading'
   AND a.answer->>'grading_mode'='completion_only_reference') open_task_count,
  count(*) FILTER(WHERE a.is_published AND public.dadyoom_published_activity_content_safe(a.content)) safe_content_count
 FROM lessons l JOIN public.lesson_activities a ON a.lesson_id=l.id GROUP BY l.id
)
SELECT l.code,l.country_name,l.grade_number,l.status,l.objectives,l.vocabulary,l.provenance,
 q.question_count,q.valid_key_reference_count,q.generic_count,
 a.activity_count,a.published_activity_count,a.revised_count,a.valid_mcq_count,a.open_task_count,a.safe_content_count
FROM lessons l JOIN question_quality q ON q.lesson_id=l.id
 JOIN activity_quality a ON a.lesson_id=l.id
ORDER BY l.code,l.grade_number;
