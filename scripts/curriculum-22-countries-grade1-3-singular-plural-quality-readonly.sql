-- Read-only audit of original singular/plural Grade 1-3 skill lessons
-- in all 22 Arab countries. No learner data or grading answers returned.
-- Does not establish national textbook coverage.
WITH lessons AS (
SELECT co.code,g.grade_number,l.id,l.status,
 jsonb_array_length(l.learning_objectives) objectives,
 jsonb_array_length(l.vocabulary) vocabulary,
 left(l.content,90) content_provenance
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula c ON c.id=g.curriculum_id
JOIN public.countries co ON co.id=c.country_id
WHERE g.grade_number IN (1,2,3) AND l.title='المفرد والجمع'
), q AS (
SELECT l.id lesson_id,count(*) questions,
 count(*) FILTER(WHERE EXISTS(
 SELECT 1 FROM jsonb_array_elements(x.options) op WHERE op->>'id'=x.correct_answer
 )) valid_private_answer_reference_count,
 count(*) FILTER(WHERE x.question LIKE 'ما المهارة الرئيسة%'
 OR x.question LIKE 'أي تطبيق يساعدك على إتقان درس%'
 OR x.question LIKE 'ما الخطوة الأفضل بعد فهم مثال درس%'
 OR x.question LIKE 'كيف تتحقق من إتقان المهارة الأساسية%') generic_question_count
FROM lessons l JOIN public.questions x ON x.lesson_id=l.id GROUP BY l.id
), a AS (
SELECT l.id lesson_id,count(*) activities,
 count(*) FILTER(WHERE x.is_published) published_activities,
 count(*) FILTER(WHERE x.content->>'origin'='DADYOOM_G123_SINGULAR_PLURAL_20261028') revised_activities,
 count(*) FILTER(WHERE x.activity_type='multiple_choice'
 AND x.content->'options' ? (x.answer->>'correct')) consistent_choice_count,
 count(*) FILTER(WHERE x.activity_type='writing'
 AND x.answer->>'grading_mode'='completion_only_reference') open_writing_count,
 count(*) FILTER(WHERE x.is_published
 AND public.dadyoom_published_activity_content_safe(x.content)) safe_published_content
FROM lessons l JOIN public.lesson_activities x ON x.lesson_id=l.id GROUP BY l.id
)
SELECT l.code,l.grade_number,l.status,l.objectives,l.vocabulary,l.content_provenance,
 q.questions,q.valid_private_answer_reference_count,q.generic_question_count,
 a.activities,a.published_activities,a.revised_activities,
 a.consistent_choice_count,a.open_writing_count,a.safe_published_content
FROM lessons l JOIN q ON q.lesson_id=l.id JOIN a ON a.lesson_id=l.id
ORDER BY l.code,l.grade_number;
