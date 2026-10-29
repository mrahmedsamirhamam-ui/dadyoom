-- Read-only Supabase source of CONTENT_AUDIT.md (2026-10-29)
-- All metrics are aggregate, no learner details or private scoring values.
WITH b AS(
SELECT l.id,c.code,c.name_ar country,g.grade_number,u.id unit_id,l.status,l.content,l.learning_objectives,l.official_content_scope,
(SELECT count(*) FROM questions q WHERE q.lesson_id=l.id) qn,
(SELECT count(*) FROM questions q WHERE q.lesson_id=l.id AND jsonb_typeof(q.options)='array' AND EXISTS (SELECT 1 FROM jsonb_array_elements(q.options) o WHERE o->>'id'=q.correct_answer)) qv,
(SELECT count(*) FROM questions q WHERE q.lesson_id=l.id AND (q.question LIKE 'ما المهارة الرئيسة%' OR q.question LIKE 'أي تطبيق يساعدك%' OR q.question LIKE 'ما الخطوة الأفضل%' OR q.question LIKE 'كيف تتحقق%')) qg,
(SELECT count(*) FROM lesson_activities a WHERE a.lesson_id=l.id) an,
(SELECT count(*) FROM lesson_activities a WHERE a.lesson_id=l.id AND a.content->>'origin'='DADYOOM_CORE_22_ACTIVITY_V1') ag,
(SELECT count(*) FROM lesson_activities a WHERE a.lesson_id=l.id AND a.activity_type='listening') listen,
(SELECT count(*) FROM lesson_activities a WHERE a.lesson_id=l.id AND a.activity_type='speaking') speak,
(SELECT count(*) FROM lesson_skills ls WHERE ls.lesson_id=l.id) skills
FROM lessons l JOIN units u ON u.id=l.unit_id JOIN grades g ON g.id=u.grade_id JOIN curricula cu ON cu.id=g.curriculum_id JOIN countries c ON c.id=cu.country_id
WHERE g.grade_number BETWEEN 1 AND 12),
a AS(SELECT code,max(country) country,grade_number,count(*) lessons,count(distinct unit_id) units,
count(*) FILTER(WHERE status='published') published,
count(*) FILTER(WHERE length(trim(coalesce(content,'')))>=400) explanations,
count(*) FILTER(WHERE jsonb_typeof(learning_objectives)='array' AND jsonb_array_length(learning_objectives)>=1) objectives,
count(*) FILTER(WHERE qv>=2) assessment2,
count(*) FILTER(WHERE an BETWEEN 6 AND 10) exercises6to10,
count(*) FILTER(WHERE skills>0) linked_skills,
count(*) FILTER(WHERE listen>0) listening,
count(*) FILTER(WHERE speak>0) speaking,
count(*) FILTER(WHERE qg>0 OR ag>0) needs_generic_repair,
sum(qn) questions,sum(qv) valid_question_refs,sum(qg) generic_questions,sum(an) activities,sum(ag) legacy_activities,
count(*) FILTER(WHERE official_content_scope IS NULL) unverified_scope,
count(*) FILTER(WHERE status='published' AND length(trim(coalesce(content,'')))>=400 AND qv>=2 AND an BETWEEN 6 AND 10 AND skills>0) strict_without_audio
FROM b GROUP BY code,grade_number)
SELECT jsonb_agg(to_jsonb(a) ORDER BY code,grade_number) rows FROM a;
