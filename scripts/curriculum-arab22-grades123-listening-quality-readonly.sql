-- READ ONLY: no scoring keys or learner identifiers are returned.
-- After 2026-10-29, verify original teacher-read listening lessons, Grades 1-3.
WITH t AS(
 SELECT l.id,l.status,l.content,l.learning_objectives,co.code country_code,g.grade_number
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula c ON c.id=g.curriculum_id JOIN public.countries co ON co.id=c.country_id
 WHERE l.title='الاستماع واتباع التعليمات' AND g.grade_number IN(1,2,3)
)
SELECT t.country_code,t.grade_number,t.id,t.status,length(t.content) content_length,
 jsonb_array_length(t.learning_objectives) goals,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id) questions,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(q.options) opt WHERE opt->>'id'=q.correct_answer)) valid_question_key_references,
 (SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id AND
 (q.question LIKE 'ما المهارة الرئيسة%' OR q.question LIKE 'أي تطبيق يساعدك%'
 OR q.question LIKE 'ما الخطوة الأفضل%' OR q.question LIKE 'كيف تتحقق%')) old_generic_questions,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id) activities,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id
 AND a.content->>'origin' IN ('DADYOOM_BH_LISTENING_G123_ORIGINAL_20261029','DADYOOM_ARAB21_LISTENING_G123_ORIGINAL_20261029')) repaired_activities,
 (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id
 AND a.activity_type='listening' AND a.content->>'requiresTeacherRead'='true'
 AND a.content->>'audioAssetPresent'='false') teacher_read_tasks,
 (SELECT count(*) FROM public.lesson_activities a JOIN public.lesson_activity_attempts aa
 ON aa.activity_id=a.id WHERE a.lesson_id=t.id) student_activity_attempts
FROM t ORDER BY t.country_code,t.grade_number;
