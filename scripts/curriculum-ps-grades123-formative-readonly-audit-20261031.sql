-- Dadyoom / read-only post-write review / Palestinian grades 1-3 / 2026-10-31
-- Inspect actual live production. This does not certify teacher approval, official books or browser E2E.
SELECT c.code AS country_code, g.grade_number AS grade,
       count(*) AS activities,
       count(DISTINCT a.lesson_id) AS distinct_lessons,
       count(*) FILTER (WHERE a.is_published) AS published,
       count(*) FILTER (WHERE a.is_required OR a.points<>0 OR a.answer<>'{}'::jsonb) AS graded_or_secret_bearing,
       count(*) FILTER (WHERE a.activity_type='listening'
         AND a.content->>'requiresTeacherRead'='true'
         AND length(btrim(a.content->>'text', E' \t\n\r'))>30) AS teacher_read_listening,
       count(*) FILTER (WHERE a.activity_type='reading'
         AND length(btrim(a.content->>'originalText', E' \t\n\r'))>30) AS original_reading,
       count(*) FILTER (WHERE a.activity_type='writing') AS writing,
       count(*) FILTER (WHERE a.activity_type='speaking') AS speaking
FROM public.lesson_activities a
JOIN public.lessons l ON l.id=a.lesson_id
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula cu ON cu.id=g.curriculum_id
JOIN public.countries c ON c.id=cu.country_id
WHERE a.content->>'origin'='DADYOOM_PS_G123_57_ORIGINAL_FORMATIVE_20261031'
GROUP BY c.code,g.grade_number ORDER BY g.grade_number;

-- No Palestinian grade 1-3 published lesson should remain with zero published activities:
WITH activity_count AS (
 SELECT lesson_id,count(*) FILTER(WHERE is_published) AS n
 FROM public.lesson_activities GROUP BY lesson_id
)
SELECT g.grade_number,
       count(*) AS published_lessons,
       count(*) FILTER(WHERE coalesce(activity_count.n,0)=0) AS without_published_activities,
       count(*) FILTER(WHERE coalesce(activity_count.n,0)<6) AS below_six,
       count(*) FILTER(WHERE coalesce(activity_count.n,0) BETWEEN 6 AND 10) AS six_to_ten
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula cu ON cu.id=g.curriculum_id
JOIN public.countries c ON c.id=cu.country_id
LEFT JOIN activity_count ON activity_count.lesson_id=l.id
WHERE c.code='PS' AND g.grade_number BETWEEN 1 AND 3 AND l.status='published'
GROUP BY g.grade_number ORDER BY g.grade_number;

-- Important: lesson_history is deliberately NOT read or changed.
