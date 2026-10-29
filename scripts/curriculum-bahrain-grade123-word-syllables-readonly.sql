-- Read-only Bahrain Grade 1-3 word segmentation audit; private keys never returned.
SELECT g.grade_number,l.id,l.status,length(l.content) content_chars,jsonb_array_length(l.learning_objectives) goals,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=l.id) questions,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=l.id
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(q.options) o WHERE o->>'id'=q.correct_answer)) correct_choice_refs,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=l.id AND
 (q.question LIKE 'ما المهارة الرئيسة%' OR q.question LIKE 'أي تطبيق يساعدك%' OR
 q.question LIKE 'ما الخطوة الأفضل%' OR q.question LIKE 'كيف تتحقق%')) old_generic_questions,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=l.id) activities,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=l.id
 AND a.content->>'origin'='DADYOOM_BH_WORD_SYLLABLES_G123_20261029') upgraded_activities,
 (SELECT count(*) FROM public.lesson_activities a JOIN public.lesson_activity_attempts aa ON aa.activity_id=a.id WHERE a.lesson_id=l.id) student_attempts
FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula c ON c.id=g.curriculum_id JOIN public.countries co ON co.id=c.country_id
WHERE l.title='بناء الكلمة من المقاطع' AND co.code='BH' AND g.grade_number IN(1,2,3)
ORDER BY g.grade_number;