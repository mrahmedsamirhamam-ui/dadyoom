-- Grade 2 and Grade 3: one original supplementary reading lesson each
-- across 22 Arab countries. 44 existing published lessons, 220 question rows,
-- 132 published activities. NOT a claim of official Ministry TOC alignment.
-- This is read-only and does not return private answer values or student data.
WITH target AS (
 SELECT co.code,co.name_ar country_name,g.grade_number,l.id,l.status,
   jsonb_array_length(l.learning_objectives) objectives,
   jsonb_array_length(l.vocabulary) vocabulary,
   left(l.content,85) content_provenance
 FROM public.lessons l
 JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula c ON c.id=g.curriculum_id
 JOIN public.countries co ON co.id=c.country_id
 WHERE g.grade_number IN (2,3) AND l.title='قراءة نص قصير'
), quality_questions AS (
 SELECT t.id AS lesson_id,count(*) question_count,
  count(*) FILTER (WHERE EXISTS(
   SELECT 1 FROM jsonb_array_elements(q.options) o
   WHERE o->>'id'=q.correct_answer
  )) valid_private_answer_reference_count,
  count(*) FILTER(WHERE q.question LIKE 'ما المهارة الرئيسة%'
    OR q.question LIKE 'أي تطبيق يساعدك على إتقان درس%'
    OR q.question LIKE 'ما الخطوة الأفضل بعد فهم مثال درس%'
    OR q.question LIKE 'كيف تتحقق من إتقان المهارة الأساسية%'
    OR q.question LIKE 'ما معنى%في سياق هذا الدرس%') generic_question_count
 FROM target t JOIN public.questions q ON q.lesson_id=t.id GROUP BY t.id
), quality_activities AS (
 SELECT t.id AS lesson_id,count(*) activity_count,
  count(*) FILTER (WHERE a.is_published=true) published_activity_count,
  count(*) FILTER(WHERE a.content->>'origin' IN (
   'DADYOOM_G23_ORIGINAL_READING_20261028',
   'DADYOOM_GRADE_SPECIFIC_20261028'
  )) revised_activity_count,
  count(*) FILTER(WHERE a.activity_type='multiple_choice'
    AND a.content->'options' ? (a.answer->>'correct')) consistent_choice_count,
  count(*) FILTER(WHERE a.activity_type='reading'
    AND a.answer->>'grading_mode'='completion_only_reference') open_reading_task_count,
  count(*) FILTER(WHERE a.is_published
    AND public.dadyoom_published_activity_content_safe(a.content)) safe_content_count
 FROM target t JOIN public.lesson_activities a ON a.lesson_id=t.id GROUP BY t.id
)
SELECT t.code,t.country_name,t.grade_number,t.status,
 t.objectives,t.vocabulary,t.content_provenance,
 q.question_count,q.valid_private_answer_reference_count,
 q.generic_question_count,
 a.activity_count,a.published_activity_count,a.revised_activity_count,
 a.consistent_choice_count,a.open_reading_task_count,a.safe_content_count
FROM target t
JOIN quality_questions q ON q.lesson_id=t.id
JOIN quality_activities a ON a.lesson_id=t.id
ORDER BY t.code,t.grade_number;
