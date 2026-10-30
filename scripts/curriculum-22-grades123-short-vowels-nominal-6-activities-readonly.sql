-- Read-only operational verification for 132 existing Grades1-3 Dadyoom lessons across 22 countries.
-- Returns structural statistics only; no students, scores, secret answer values.
WITH target AS (
 SELECT co.code,g.grade_number,l.title,l.id
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id JOIN public.curricula cu ON cu.id=g.curriculum_id
 JOIN public.countries co ON co.id=cu.country_id
 WHERE g.grade_number IN (1,2,3) AND l.title IN ('الحركات القصيرة','الجملة الاسمية البسيطة')
), verify AS (
 SELECT t.code,t.grade_number,t.title,
 COUNT(*) n,COUNT(*) FILTER(WHERE a.is_published) published,
 COUNT(*) FILTER(WHERE a.content->>'origin'='DADYOOM_G123_SHORT_VOWELS_NOMINAL_20261029') added,
 COUNT(*) FILTER(WHERE a.activity_type='fill_blank' AND a.content->>'origin'='DADYOOM_G123_SHORT_VOWELS_NOMINAL_20261029'
 AND (a.answer->'answers'->>0)=ANY(SELECT jsonb_array_elements_text(a.content->'items'->0->'options'))) fill_ok,
 COUNT(*) FILTER(WHERE a.activity_type='matching' AND a.content->>'origin'='DADYOOM_G123_SHORT_VOWELS_NOMINAL_20261029'
 AND jsonb_array_length(a.answer->'pairs')=2) match_ok,
 COUNT(*) FILTER(WHERE a.activity_type='writing' AND a.content->>'origin'='DADYOOM_G123_SHORT_VOWELS_NOMINAL_20261029'
 AND a.answer->>'grading_mode'='completion_only_reference') human_writing,
 COUNT(*) FILTER(WHERE a.is_published AND public.dadyoom_published_activity_content_safe(a.content)) public_safe,
 BOOL_OR(EXISTS(SELECT 1 FROM public.lesson_skills s WHERE s.lesson_id=t.id AND s.skill='writing')) writing_linked
 FROM target t JOIN public.lesson_activities a ON a.lesson_id=t.id
 GROUP BY t.code,t.grade_number,t.title,t.id
)
SELECT code,grade_number,title,n,published,added,fill_ok,match_ok,human_writing,public_safe,writing_linked,
(n=6 AND published=6 AND added=3 AND fill_ok=1 AND match_ok=1 AND human_writing=1 AND public_safe=6 AND writing_linked) six_task_pass
FROM verify ORDER BY code,grade_number,title;
