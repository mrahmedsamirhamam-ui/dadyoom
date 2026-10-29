-- Read-only skill integrity audit after 2026-10-29 letter-shape remediation.
-- Does not display private answer values or learner identity.
WITH target AS (
 SELECT l.id,l.status,l.content,l.learning_objectives,c.code country_code,g.grade_number
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula cu ON cu.id=g.curriculum_id
 JOIN public.countries c ON c.id=cu.country_id
 WHERE l.title='أشكال الحرف في الكلمة' AND g.grade_number IN(1,2,3)
)
SELECT t.country_code,t.grade_number,t.id,t.status,
 length(t.content) content_chars,jsonb_array_length(t.learning_objectives) goals,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id) questions,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id AND
 EXISTS(SELECT 1 FROM jsonb_array_elements(q.options) opt WHERE opt->>'id'=q.correct_answer)) valid_question_choice_refs,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id AND
 (q.question LIKE 'ما المهارة الرئيسة%' OR q.question LIKE 'أي تطبيق يساعدك%' OR
 q.question LIKE 'ما الخطوة الأفضل%' OR q.question LIKE 'كيف تتحقق%')) old_generic_questions,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id) activity_count,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id AND
 a.content->>'origin' IN (
 'DADYOOM_BH_LETTER_SHAPES_G123_ORIGINAL_20261029',
 'DADYOOM_ARAB21_LETTER_SHAPES_G123_ORIGINAL_20261029')) revised_activities,
 (SELECT count(*) FROM public.lesson_activities a JOIN public.lesson_activity_attempts aa
 ON aa.activity_id=a.id WHERE a.lesson_id=t.id) student_attempts
FROM target t ORDER BY t.country_code,t.grade_number;
