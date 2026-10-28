-- Read-only audit: original Grade 1-3 interrogatives skill across 22 Arab countries.
-- 65 eligible revised, 1 Egypt Grade 1 record intentionally preserved with recorded student work.
-- This audit does not expose answer keys, model answers, or student identities.
WITH t AS (
SELECT co.code,g.grade_number,l.id,l.status,l.content,
 jsonb_array_length(l.learning_objectives) objectives,
 jsonb_array_length(l.vocabulary) vocabulary
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula c ON c.id=g.curriculum_id
JOIN public.countries co ON co.id=c.country_id
WHERE g.grade_number IN(1,2,3) AND l.title='أدوات الاستفهام'
), q AS (
 SELECT q.lesson_id,count(*) questions,
 count(*) FILTER(WHERE EXISTS(
  SELECT 1 FROM jsonb_array_elements(q.options) op WHERE op->>'id'=q.correct_answer
 )) valid_private_keys,
 count(*) FILTER(WHERE q.question LIKE 'ما المهارة الرئيسة%'
  OR q.question LIKE 'أي تطبيق يساعدك على إتقان درس%'
  OR q.question LIKE 'ما الخطوة الأفضل بعد فهم مثال درس%'
  OR q.question LIKE 'كيف تتحقق من إتقان المهارة الأساسية%') generic_questions
 FROM t JOIN public.questions q ON q.lesson_id=t.id GROUP BY q.lesson_id
), a AS (
 SELECT x.lesson_id,count(*) activities,
 count(*) FILTER(WHERE x.is_published) published_activities,
 count(*) FILTER(WHERE x.content->>'origin'='DADYOOM_G123_INTERROGATIVES_20261028') revised_activities,
 count(*) FILTER(WHERE x.activity_type='multiple_choice' AND x.content->'options' ? (x.answer->>'correct')) consistent_choices,
 count(*) FILTER(WHERE x.activity_type='writing' AND x.answer->>'grading_mode'='completion_only_reference') open_writing_tasks,
 count(*) FILTER(WHERE x.is_published AND public.dadyoom_published_activity_content_safe(x.content)) safe_content
 FROM t JOIN public.lesson_activities x ON x.lesson_id=t.id GROUP BY x.lesson_id
)
SELECT t.code,t.grade_number,t.status,t.objectives,t.vocabulary,
 left(t.content,90) content_provenance,
 q.questions,q.valid_private_keys,q.generic_questions,
 a.activities,a.published_activities,a.revised_activities,
 a.consistent_choices,a.open_writing_tasks,a.safe_content
FROM t JOIN q ON q.lesson_id=t.id JOIN a ON a.lesson_id=t.id
ORDER BY t.code,t.grade_number;
