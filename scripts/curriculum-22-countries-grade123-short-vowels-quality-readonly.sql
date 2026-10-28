-- Dadyoom original short vowels across 22 Arab countries and Grades 1-3.
-- Read only: answer-key validity is counted, never returned. No learner data exposed.
-- Supplementary original skills; does not establish official Ministry TOC match.
WITH target AS (
 SELECT co.code,co.name_ar country_name,g.grade_number,l.id,l.status,
  jsonb_array_length(l.learning_objectives) objectives,
  jsonb_array_length(l.vocabulary) vocabulary,left(l.content,90) source_intro
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id JOIN public.curricula c ON c.id=g.curriculum_id
 JOIN public.countries co ON co.id=c.country_id
 WHERE g.grade_number IN(1,2,3) AND l.title='الحركات القصيرة'
), quiz AS (
 SELECT t.id lesson_id,count(*) questions,
 count(*) FILTER(WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(q.options) op WHERE op->>'id'=q.correct_answer)) valid_answer_key_references,
 count(*) FILTER(WHERE q.question LIKE 'ما المهارة الرئيسة%'
 OR q.question LIKE 'أي تطبيق يساعدك على إتقان درس%'
 OR q.question LIKE 'ما معنى%في سياق هذا الدرس%'
 OR q.question LIKE 'ما الخطوة الأفضل بعد فهم مثال درس%'
 OR q.question LIKE 'كيف تتحقق من إتقان المهارة الأساسية%') generic_questions
 FROM target t JOIN public.questions q ON q.lesson_id=t.id GROUP BY t.id
), activity AS (
 SELECT t.id lesson_id,count(*) activities,
 count(*) FILTER(WHERE a.is_published) published_activities,
 count(*) FILTER(WHERE a.content->>'origin'='DADYOOM_SHORT_VOWELS_G123_22_20261028') revised_activities,
 count(*) FILTER(WHERE a.activity_type='multiple_choice'
  AND a.content->'options' ? (a.answer->>'correct')) valid_choices,
 count(*) FILTER(WHERE a.activity_type='reading'
  AND a.answer->>'grading_mode'='completion_only_reference') reading_tasks,
 count(*) FILTER(WHERE a.is_published AND public.dadyoom_published_activity_content_safe(a.content)) safe_published_content
 FROM target t JOIN public.lesson_activities a ON a.lesson_id=t.id GROUP BY t.id
)
SELECT t.code,t.country_name,t.grade_number,t.status,
 t.objectives,t.vocabulary,t.source_intro,
 q.questions,q.valid_answer_key_references,q.generic_questions,
 a.activities,a.published_activities,a.revised_activities,a.valid_choices,
 a.reading_tasks,a.safe_published_content
FROM target t JOIN quiz q ON q.lesson_id=t.id JOIN activity a ON a.lesson_id=t.id
ORDER BY t.code,t.grade_number;
