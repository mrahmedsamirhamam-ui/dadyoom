-- READ ONLY. No correct-answer values or student identifiers returned.
-- 2026-10-29: 63 existing Grade 1-3 Arabic phonics lessons across 21 countries updated
-- while preserving all 125 historic attempts on Bahrain's Grade-1 lesson.
WITH target AS (
 SELECT l.id,l.status,l.content,l.learning_objectives,co.code country_code,g.grade_number
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id JOIN public.curricula cu ON cu.id=g.curriculum_id
 JOIN public.countries co ON co.id=cu.country_id
 WHERE l.title='الأصوات والحروف' AND g.grade_number IN(1,2,3)
)
SELECT t.country_code,t.grade_number,t.id,t.status,length(t.content) content_chars,
 jsonb_array_length(t.learning_objectives) objective_count,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id) question_count,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(q.options) o WHERE o->>'id'=q.correct_answer)) valid_question_choice_refs,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id AND
 (q.question LIKE 'ما المهارة الرئيسة%' OR q.question LIKE 'أي تطبيق يساعدك%' OR
 q.question LIKE 'ما الخطوة الأفضل%' OR q.question LIKE 'كيف تتحقق%')) generic_question_count,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id) activities,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id AND
 a.content->>'origin' IN ('DADYOOM_BH_SOUNDS_LETTERS_G123_20261029','DADYOOM_ARAB21_SOUNDS_LETTERS_G123_ORIGINAL_20261029')) new_activities,
 (SELECT count(*) FROM public.lesson_activities a JOIN public.lesson_activity_attempts aa
 ON aa.activity_id=a.id WHERE a.lesson_id=t.id) activity_attempts
FROM target t ORDER BY country_code,grade_number;
