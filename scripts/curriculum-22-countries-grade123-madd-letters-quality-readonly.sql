-- Original Arabic madd-letter lessons for 22 countries x grades 1-3.
-- Read-only, returns key-validity counts, not private answer values.
-- This is original enrichment, NOT an official curriculum alignment certificate.
WITH t AS (
 SELECT co.code,co.name_ar country_name,g.grade_number,l.id,l.status,
 jsonb_array_length(l.learning_objectives) objectives,
 jsonb_array_length(l.vocabulary) vocabulary,
 left(l.content,90) source_intro
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id JOIN public.curricula c ON c.id=g.curriculum_id
 JOIN public.countries co ON co.id=c.country_id
 WHERE l.title='حروف المد' AND g.grade_number IN(1,2,3)
), q AS (
 SELECT t.id lesson_id,count(*) questions,
 count(*) FILTER(WHERE EXISTS(SELECT 1 FROM jsonb_array_elements(q0.options) x WHERE x->>'id'=q0.correct_answer)) valid_key_refs,
 count(*) FILTER(WHERE q0.question LIKE 'ما المهارة الرئيسة%'
  OR q0.question LIKE 'أي تطبيق يساعدك على إتقان درس%'
  OR q0.question LIKE 'ما معنى%في سياق هذا الدرس%'
  OR q0.question LIKE 'ما الخطوة الأفضل بعد فهم مثال درس%'
  OR q0.question LIKE 'كيف تتحقق من إتقان المهارة الأساسية%') generic_questions
 FROM t JOIN public.questions q0 ON q0.lesson_id=t.id GROUP BY t.id
), a AS (
 SELECT t.id lesson_id,count(*) activities,
 count(*) FILTER(WHERE a0.is_published) published_activities,
 count(*) FILTER(WHERE a0.content->>'origin'='DADYOOM_MADD_LETTERS_G123_22_20261028') revised,
 count(*) FILTER(WHERE a0.activity_type='multiple_choice'
  AND a0.content->'options' ? (a0.answer->>'correct')) valid_choice_content,
 count(*) FILTER(WHERE a0.activity_type='reading'
  AND a0.answer->>'grading_mode'='completion_only_reference') open_tasks,
 count(*) FILTER(WHERE a0.is_published AND public.dadyoom_published_activity_content_safe(a0.content)) safe_content
 FROM t JOIN public.lesson_activities a0 ON a0.lesson_id=t.id GROUP BY t.id
)
SELECT t.code,t.country_name,t.grade_number,t.status,t.objectives,t.vocabulary,t.source_intro,
q.questions,q.valid_key_refs,q.generic_questions,
a.activities,a.published_activities,a.revised,a.valid_choice_content,a.open_tasks,a.safe_content
FROM t JOIN q ON q.lesson_id=t.id JOIN a ON a.lesson_id=t.id
ORDER BY t.code,t.grade_number;
