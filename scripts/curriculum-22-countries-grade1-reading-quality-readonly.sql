-- Dadyoom Grade-1 / 22 Arab countries — original short-reading quality
-- metadata audit. Does not expose correct_answer values, activity.answer,
-- learner IDs, attempts, or published student assessment results.
-- It verifies 22 distinct published lesson records, 110 questions, 66 activities.
-- This does NOT establish the official ministry textbook TOC match.
WITH lessons AS (
 SELECT co.code,co.name_ar country_name,l.id,l.title,l.status,
        l.content,l.learning_objectives,l.vocabulary
 FROM public.lessons l
 JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula c ON c.id=g.curriculum_id
 JOIN public.countries co ON co.id=c.country_id
 WHERE g.grade_number=1 AND l.title='قراءة نص قصير'
), question_quality AS (
 SELECT l.code,
  COUNT(*) question_count,
  COUNT(*) FILTER(WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements(q.options) o
    WHERE o->>'id'=q.correct_answer
  )) valid_private_answer_reference_count,
  COUNT(*) FILTER(WHERE q.question LIKE 'ما المهارة الرئيسة%'
      OR q.question LIKE 'أي تطبيق يساعدك على إتقان درس%'
      OR q.question LIKE 'ما الخطوة الأفضل بعد فهم مثال درس%'
      OR q.question LIKE 'كيف تتحقق من إتقان المهارة الأساسية%'
      OR q.question LIKE 'ما معنى%في سياق هذا الدرس%') generic_question_count
 FROM lessons l JOIN public.questions q ON q.lesson_id=l.id
 GROUP BY l.code
), activity_quality AS (
 SELECT l.code,COUNT(*) activity_count,
  COUNT(*) FILTER(WHERE a.is_published) published_activity_count,
  COUNT(*) FILTER(WHERE a.content->>'origin'='DADYOOM_ORIGINAL_G1_READING_20261028') revised_activity_count,
  COUNT(*) FILTER(WHERE a.activity_type='multiple_choice'
    AND a.content->'options' ? (a.answer->>'correct')) consistent_mcq_count,
  COUNT(*) FILTER(WHERE a.activity_type='reading'
    AND a.answer->>'grading_mode'='completion_only_reference') reading_task_count,
  COUNT(*) FILTER(WHERE a.is_published
    AND public.dadyoom_published_activity_content_safe(a.content)) safe_content_count
 FROM lessons l JOIN public.lesson_activities a ON a.lesson_id=l.id
 GROUP BY l.code
)
SELECT l.code,l.country_name,l.status,
 jsonb_array_length(l.learning_objectives) objective_count,
 jsonb_array_length(l.vocabulary) vocabulary_count,
 LEFT(l.content,80) content_provenance,
 q.question_count,q.valid_private_answer_reference_count,
 q.generic_question_count,
 a.activity_count,a.published_activity_count,a.revised_activity_count,
 a.consistent_mcq_count,a.reading_task_count,a.safe_content_count
FROM lessons l
JOIN question_quality q USING(code)
JOIN activity_quality a USING(code)
ORDER BY l.code;
