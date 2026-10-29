-- Read only. Grade 1 must never be overwritten while learner activity attempts exist.
SELECT g.grade_number,l.id,l.status,length(l.content) chars,jsonb_array_length(l.learning_objectives) objectives,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=l.id) questions,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=l.id AND EXISTS(SELECT 1 FROM jsonb_array_elements(q.options) o WHERE o->>'id'=q.correct_answer)) valid_choice_keys,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=l.id AND
  (q.question LIKE 'ما المهارة الرئيسة%' OR q.question LIKE 'أي تطبيق يساعدك%' OR
   q.question LIKE 'ما الخطوة الأفضل%' OR q.question LIKE 'كيف تتحقق%')) generic_questions,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=l.id) activities,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=l.id AND a.content->>'origin'='DADYOOM_BH_SOUNDS_LETTERS_G123_20261029') upgraded_activities,
 (SELECT count(*) FROM public.lesson_activities a JOIN public.lesson_activity_attempts aa ON aa.activity_id=a.id WHERE a.lesson_id=l.id) student_activity_attempts
FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula cu ON cu.id=g.curriculum_id JOIN public.countries co ON co.id=cu.country_id
WHERE l.title='الأصوات والحروف' AND co.code='BH' AND g.grade_number BETWEEN 1 AND 3 ORDER BY g.grade_number;