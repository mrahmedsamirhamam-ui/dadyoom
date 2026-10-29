-- READ ONLY: 22 Arab countries, Grades1–3, «بناء الكلمة من المقاطع»
-- Each published skill lesson must have 5 valid MCQs and SIX pedagogical activities.
-- No user ID, answers, or private scoring key values are exported.
WITH target AS (
 SELECT l.id,l.status,l.content,l.learning_objectives,c.code,g.grade_number
 FROM public.lessons l JOIN public.units u ON l.unit_id=u.id JOIN public.grades g ON u.grade_id=g.id
 JOIN public.curricula cu ON g.curriculum_id=cu.id JOIN public.countries c ON c.id=cu.country_id
 WHERE l.title='بناء الكلمة من المقاطع' AND g.grade_number IN(1,2,3)
)
SELECT grade_number,count(*) lessons,count(distinct code) countries,
 count(*) FILTER(WHERE status='published') published,
 count(distinct content) distinct_texts,
 count(*) FILTER(WHERE jsonb_array_length(learning_objectives)=3) three_goals,
 sum((SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id)) questions,
 sum((SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id AND EXISTS(SELECT 1 FROM jsonb_array_elements(q.options) o WHERE o->>'id'=q.correct_answer))) valid_scored_questions,
 sum((SELECT count(*) FROM public.questions q WHERE q.lesson_id=t.id AND (q.question LIKE 'ما المهارة الرئيسة%' OR q.question LIKE 'أي تطبيق يساعدك%' OR q.question LIKE 'ما الخطوة الأفضل%' OR q.question LIKE 'كيف تتحقق%'))) template_questions,
 sum((SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id)) activities,
 count(*) FILTER(WHERE (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id)=6) six_activity_lessons,
 sum((SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id AND a.content->>'origin'='DADYOOM_CORE_22_ACTIVITY_V1')) legacy_activities,
 sum((SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id AND a.activity_type='fill_blank')) fill_blank_tasks,
 sum((SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id AND a.activity_type='matching')) matching_tasks,
 sum((SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=t.id AND a.activity_type='reading')) reading_tasks
FROM target t GROUP BY grade_number ORDER BY grade_number;