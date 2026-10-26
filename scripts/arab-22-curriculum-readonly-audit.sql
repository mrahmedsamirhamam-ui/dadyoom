-- Global Arabic curriculum inventory for all 22 countries. SELECT ONLY.
-- Counts are database inventory, NOT verified textbook completion.
-- No learner rows or answer keys are returned.
WITH q AS (
  SELECT lesson_id, COUNT(*)::int AS question_count FROM public.questions GROUP BY lesson_id
), a AS (
  SELECT lesson_id, COUNT(*)::int AS activity_count FROM public.lesson_activities GROUP BY lesson_id
), lesson_inventory AS (
  SELECT c.code AS country_code, c.name_ar AS country_name, cur.id AS curriculum_id,
         g.id AS grade_id, u.id AS unit_id, l.id AS lesson_id, l.title AS lesson_title,
         l.status AS lesson_status, COALESCE(q.question_count, 0) AS question_count,
         COALESCE(a.activity_count, 0) AS activity_count
  FROM public.countries c
  LEFT JOIN public.curricula cur ON cur.country_id = c.id
  LEFT JOIN public.grades g ON g.curriculum_id = cur.id
  LEFT JOIN public.units u ON u.grade_id = g.id
  LEFT JOIN public.lessons l ON l.unit_id = u.id
  LEFT JOIN q ON q.lesson_id = l.id
  LEFT JOIN a ON a.lesson_id = l.id
)
SELECT country_code, country_name, COUNT(DISTINCT curriculum_id) AS curricula,
       COUNT(DISTINCT grade_id) AS grade_rows, COUNT(DISTINCT unit_id) AS unit_rows,
       COUNT(lesson_id) AS lesson_rows,
       COUNT(lesson_id) FILTER (WHERE lesson_status = 'published') AS published_rows,
       COUNT(lesson_id) FILTER (WHERE lesson_status IS DISTINCT FROM 'published') AS unpublished_rows,
       COALESCE(SUM(question_count), 0) AS question_rows,
       COALESCE(SUM(activity_count), 0) AS activity_rows,
       COUNT(lesson_id) FILTER (WHERE lesson_status = 'published' AND question_count < 3) AS published_less_than_three_questions
FROM lesson_inventory
GROUP BY country_code, country_name ORDER BY country_code;

-- Duplicate candidate groups; NO automatic merge, delete or update.
WITH entries AS (
  SELECT c.code AS country_code, g.id AS grade_id,
         lower(btrim(regexp_replace(coalesce(l.title,''), '[[:space:]]+', ' ', 'g'))) AS normalized_title,
         COUNT(*) AS candidate_rows
  FROM public.countries c
  JOIN public.curricula cur ON cur.country_id=c.id
  JOIN public.grades g ON g.curriculum_id=cur.id
  JOIN public.units u ON u.grade_id=g.id
  JOIN public.lessons l ON l.unit_id=u.id
  WHERE btrim(coalesce(l.title,'')) <> ''
  GROUP BY c.code, g.id, lower(btrim(regexp_replace(coalesce(l.title,''), '[[:space:]]+', ' ', 'g')))
)
SELECT country_code, grade_id, normalized_title, candidate_rows
FROM entries WHERE candidate_rows > 1 ORDER BY candidate_rows DESC, country_code LIMIT 200;

-- Orphaned content counts (do NOT touch referenced progress).
SELECT 'questions_without_lesson' AS check_name, COUNT(*)::bigint AS rows
FROM public.questions q LEFT JOIN public.lessons l ON l.id=q.lesson_id WHERE l.id IS NULL
UNION ALL
SELECT 'activities_without_lesson', COUNT(*)::bigint
FROM public.lesson_activities a LEFT JOIN public.lessons l ON l.id=a.lesson_id WHERE l.id IS NULL
UNION ALL
SELECT 'student_progress_without_lesson', COUNT(*)::bigint
FROM public.student_progress s LEFT JOIN public.lessons l ON l.id=s.lesson_id WHERE l.id IS NULL;
