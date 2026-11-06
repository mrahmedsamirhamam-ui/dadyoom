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

-- 2026-11-06: FIRST GRADE WORKSHEET INSTRUCTION-CROSSREFERENCE TRIAGE.
-- Evidence is limited to the first structured activity prompt and first
-- structured assessment question. No student data, no writes, no claim
-- that unflagged rows are curriculum-correct.
WITH worksheet_prompts AS (
  SELECT l.title AS worksheet_title,
    l.instructions->0->'items'->0->>'instructions' AS first_activity_prompt,
    l.instructions->1->'items'->0->>'question' AS first_assessment_question
  FROM public.lessons l
  JOIN public.units u ON u.id = l.unit_id
  JOIN public.grades g ON g.id = u.grade_id
  JOIN public.curricula c ON c.id = g.curriculum_id
  JOIN public.countries co ON co.id = c.country_id
  WHERE co.code = 'BH' AND g.grade_number = 1
    AND l.semester = 1 AND l.status = 'published'
    AND l.title LIKE 'ورقة عمل (%'
)
SELECT worksheet_title,
  left(first_activity_prompt, 180) AS flagged_prompt,
  left(first_assessment_question, 180) AS flagged_assessment,
  first_activity_prompt LIKE '%«)%' AS malformed_reference
FROM worksheet_prompts
WHERE first_activity_prompt LIKE '%الدّرس%'
ORDER BY worksheet_title;
