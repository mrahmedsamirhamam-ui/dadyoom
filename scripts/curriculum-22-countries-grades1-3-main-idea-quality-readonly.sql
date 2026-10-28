-- Verify 66 published original main-idea lessons, 22 countries and Grades 1-3.
-- Read-only; never emit student IDs, raw grading keys or teacher notes.
-- The exercises are original Dadyoom enrichment, not national textbook text.
WITH target AS (
 SELECT co.code,co.name_ar country_name,g.grade_number,l.id,l.status,l.content,
        jsonb_array_length(l.learning_objectives) objectives,
        jsonb_array_length(l.vocabulary) vocabulary
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula c ON c.id=g.curriculum_id
 JOIN public.countries co ON co.id=c.country_id
 WHERE g.grade_number IN(1,2,3) AND l.title='الفكرة الرئيسة'
), q_stats AS (
 SELECT t.id lesson_id,count(*) questions,
 count(*) FILTER(WHERE EXISTS (
   SELECT 1 FROM jsonb_array_elements(q.options) op WHERE op->>'id'=q.correct_answer
 )) valid_private_key_references,
 count(*) FILTER(WHERE q.question LIKE 'ما المهارة الرئيسة%'
  OR q.question LIKE 'أي تطبيق يساعدك على إتقان درس%'
  OR q.question LIKE 'ما الخطوة الأفضل بعد فهم مثال درس%'
  OR q.question LIKE 'كيف تتحقق من إتقان المهارة الأساسية%') generic_questions
 FROM target t JOIN public.questions q ON q.lesson_id=t.id GROUP BY t.id
), activity_stats AS (
 SELECT t.id lesson_id,count(*) activities,
 count(*) FILTER(WHERE a.is_published) published_activities,
 count(*) FILTER(WHERE a.content->>'origin'='DADYOOM_MAIN_IDEA_22_G123_20261028') revised_activities,
 count(*) FILTER(WHERE a.activity_type='multiple_choice'
   AND a.content->'options' ? (a.answer->>'correct')) consistent_choice_count,
 count(*) FILTER(WHERE a.activity_type='reading'
   AND a.answer->>'grading_mode'='completion_only_reference') reading_task_count,
 count(*) FILTER(WHERE a.is_published
   AND public.dadyoom_published_activity_content_safe(a.content)) safe_content_count
 FROM target t JOIN public.lesson_activities a ON a.lesson_id=t.id GROUP BY t.id
)
SELECT t.code,t.country_name,t.grade_number,t.status,
 t.objectives,t.vocabulary,left(t.content,88) content_provenance,
 q.questions,q.valid_private_key_references,q.generic_questions,
 a.activities,a.published_activities,a.revised_activities,
 a.consistent_choice_count,a.reading_task_count,a.safe_content_count
FROM target t JOIN q_stats q ON q.lesson_id=t.id
JOIN activity_stats a ON a.lesson_id=t.id
ORDER BY t.code,t.grade_number;
