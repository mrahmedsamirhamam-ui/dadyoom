-- Read-only checks for the 2026-10-28 four existing Bahrain Grade-2/3
-- ORIGINAL enrichment lessons. This is not an official textbook TOC audit.
-- No student data, private activity answers, or raw grading keys returned.
WITH target AS (
 SELECT l.id,g.grade_number,l.title,l.status,l.learning_objectives,l.vocabulary,l.content
 FROM public.lessons l
 JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id
 WHERE l.id IN (
  '79c573e1-c2ba-48fd-8805-d27d62c9bf88',
  'f67504c8-99f4-45bc-bf98-a8dd1eb4a8dd',
  '781f5e8a-0712-4139-a530-63954f762953',
  '8942c7e9-7cc9-4256-a058-b72bde24b898'
 )
), question_counts AS (
 SELECT q.lesson_id,count(*) all_questions,
 count(*) FILTER(WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(q.options) o
                  WHERE o->>'id'=q.correct_answer)) valid_question_keys,
 count(*) FILTER(WHERE q.question LIKE 'ما المهارة الرئيسة%'
   OR q.question LIKE 'أي تطبيق يساعدك على إتقان درس%'
   OR q.question LIKE 'ما الخطوة الأفضل بعد فهم مثال درس%'
   OR q.question LIKE 'كيف تتحقق من إتقان المهارة الأساسية%') generic_questions
 FROM public.questions q WHERE q.lesson_id IN (SELECT id FROM target)
 GROUP BY q.lesson_id
), activity_counts AS (
 SELECT a.lesson_id,count(*) all_activities,
 count(*) FILTER(WHERE a.is_published) published_activities,
 count(*) FILTER(WHERE a.content->>'origin'='DADYOOM_GRADE_SPECIFIC_20261028') updated_activities,
 count(*) FILTER(WHERE a.activity_type='multiple_choice'
   AND a.content->'options' ? (a.answer->>'correct')) consistent_choice_keys,
 count(*) FILTER(WHERE NOT public.dadyoom_published_activity_content_safe(a.content)) unsafe_activity_content
 FROM public.lesson_activities a WHERE a.lesson_id IN (SELECT id FROM target)
 GROUP BY a.lesson_id
)
SELECT t.grade_number,t.title,t.status,
 jsonb_array_length(t.learning_objectives) objective_count,
 jsonb_array_length(t.vocabulary) vocabulary_count,
 left(t.content,60) content_identifier,
 q.all_questions,q.valid_question_keys,q.generic_questions,
 a.all_activities,a.published_activities,a.updated_activities,
 a.consistent_choice_keys,a.unsafe_activity_content
FROM target t JOIN question_counts q ON q.lesson_id=t.id
 JOIN activity_counts a ON a.lesson_id=t.id
ORDER BY t.grade_number,t.title;
