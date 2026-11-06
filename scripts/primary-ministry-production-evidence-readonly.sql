-- Dadyoom: Primary grades 1–3 textbook gap diagnostic (READ ONLY).
-- This reads country/grade/semester lesson ROWS, not ministry-certified
-- lesson counts. Do not call 100% coverage when a row is published.
-- No student IDs, no credentials, no INSERT/UPDATE/DELETE/DDL.

WITH q AS (
  SELECT lesson_id, COUNT(*)::integer AS question_count
  FROM public.questions
  GROUP BY lesson_id
)
SELECT
  co.code AS country_code,
  g.grade_number,
  l.semester,
  COUNT(*)::integer AS lesson_rows,
  COUNT(*) FILTER (WHERE l.status = 'published')::integer AS published_rows,
  COUNT(*) FILTER (
    WHERE l.status = 'published' AND COALESCE(q.question_count, 0) = 0
  )::integer AS published_without_saved_questions,
  COUNT(*) FILTER (
    WHERE l.status = 'published' AND COALESCE(q.question_count, 0) >= 3
  )::integer AS published_with_three_plus_questions,
  COUNT(*) FILTER (
    WHERE l.status = 'published' AND l.official_content_scope = 'plan-scheduled'
  )::integer AS published_plan_tagged_rows
FROM public.lessons l
JOIN public.units u ON u.id = l.unit_id
JOIN public.grades g ON g.id = u.grade_id
JOIN public.curricula c ON c.id = g.curriculum_id
JOIN public.countries co ON co.id = c.country_id
LEFT JOIN q ON q.lesson_id = l.id
WHERE g.grade_number BETWEEN 1 AND 3
GROUP BY co.code, g.grade_number, l.semester
ORDER BY co.code, g.grade_number, l.semester;

-- Show whether actual ministry-TOC evidence has been reviewed. A blank
-- evidence table is NOT equivalent to "there are no lessons in the DB."
SELECT review_state, COUNT(*)::integer AS evidence_records
FROM public.curriculum_toc_evidence
GROUP BY review_state
ORDER BY review_state;
