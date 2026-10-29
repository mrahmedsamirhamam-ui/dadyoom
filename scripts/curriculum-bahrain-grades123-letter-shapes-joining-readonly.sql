-- Read-only QA for Bahrain letter-shape forms and joining without leaking answers
SELECT g.grade_number,l.id,l.status,length(l.content) content_chars,jsonb_array_length(l.learning_objectives) objectives,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=l.id) questions,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=l.id AND
 EXISTS(SELECT 1 FROM jsonb_array_elements(q.options) o WHERE o->>'id'=q.correct_answer)) valid_question_choice_references,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=l.id AND
 (q.question LIKE 'ما المهارة الرئيسة%' OR q.question LIKE 'أي تطبيق يساعدك%' OR q.question LIKE 'ما الخطوة الأفضل%' OR q.question LIKE 'كيف تتحقق%')) generic_question_count,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=l.id) activities,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=l.id
 AND a.content->>'origin'='DADYOOM_BH_LETTER_SHAPES_G123_ORIGINAL_20261029') repaired_activities,
 (SELECT count(*) FROM public.lesson_activities a JOIN public.lesson_activity_attempts aa ON a.id=aa.activity_id WHERE a.lesson_id=l.id) attempts
FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula c ON c.id=g.curriculum_id JOIN public.countries co ON co.id=c.country_id
WHERE l.title='أشكال الحرف في الكلمة' AND co.code='BH' AND g.grade_number IN(1,2,3)
ORDER BY grade_number;