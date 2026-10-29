-- Read-only verification; never return learner records, correct answers or private grading keys.
WITH target AS (
 SELECT co.code,g.grade_number,l.id
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula cu ON cu.id=g.curriculum_id
 JOIN public.countries co ON co.id=cu.country_id
 WHERE g.grade_number BETWEEN 1 AND 3 AND l.title='اللام الشمسية والقمرية'
), checks AS (
 SELECT t.code,t.grade_number,
 COUNT(*) tasks,COUNT(*) FILTER(WHERE a.is_published) published,
 COUNT(*) FILTER(WHERE a.content->>'origin'='DADYOOM_LAM_22_G123_6ACT_20261029') added,
 COUNT(*) FILTER(WHERE a.activity_type='fill_blank'
  AND (a.answer->'answers'->>0) = ANY (SELECT jsonb_array_elements_text(a.content->'items'->0->'options'))) valid_fill,
 COUNT(*) FILTER(WHERE a.activity_type='matching' AND jsonb_array_length(a.answer->'pairs')=2) valid_matching,
 COUNT(*) FILTER(WHERE a.activity_type='writing' AND a.answer->>'grading_mode'='completion_only_reference') manual_writing,
 COUNT(*) FILTER(WHERE a.is_published AND public.dadyoom_published_activity_content_safe(a.content)) public_safe
 FROM target t JOIN public.lesson_activities a ON a.lesson_id=t.id
 GROUP BY t.code,t.grade_number
)
SELECT code,grade_number,tasks,published,added,valid_fill,valid_matching,manual_writing,public_safe,
 tasks=6 AND published=6 AND added=3 AND valid_fill=1 AND valid_matching=1
 AND manual_writing=1 AND public_safe=6 AS six_activity_structural_pass
FROM checks ORDER BY code,grade_number;
