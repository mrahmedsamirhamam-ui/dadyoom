-- Dadyoom | Read-only curriculum content quality audit | 2026-10-21
-- Run against the DADYOOM project, never the independent International Schools database.
-- Published database rows, questions, or country registration DO NOT certify
-- any ministry textbook/year/semester/track completeness or human teaching quality.
-- Deliberately contains only SELECT statements. No student identifiers are included.

-- 1. Global counts: independently distinguish published records from content quality signals.
WITH question_counts AS (
  SELECT lesson_id, COUNT(*)::integer AS n FROM public.questions GROUP BY lesson_id
)
SELECT
  COUNT(*) AS lesson_records,
  COUNT(*) FILTER (WHERE l.status='published') AS published_records,
  COUNT(*) FILTER (WHERE l.status='draft') AS draft_records,
  COUNT(*) FILTER (WHERE l.status='published' AND COALESCE(q.n,0)=0) AS published_without_stored_questions,
  COUNT(*) FILTER (WHERE l.status='published' AND COALESCE(q.n,0)>=3) AS published_with_three_plus_questions,
  COUNT(*) FILTER (WHERE l.status='published' AND LENGTH(COALESCE(l.content,'')) < 1200) AS published_under_1200_chars,
  COUNT(*) FILTER (WHERE l.status='published' AND l.content IS NOT NULL AND LENGTH(l.content) < 1200) AS short_nonnull_lesson_bodies,
  COUNT(*) FILTER (WHERE l.status='published' AND l.content IS NULL AND l.summary LIKE 'عقدة تغطية رسمية%') AS published_book_reference_nodes_without_body,
  COUNT(*) FILTER (WHERE l.status='published' AND (l.vocabulary IS NULL OR l.vocabulary='[]'::jsonb)) AS published_without_saved_vocabulary
FROM public.lessons l
LEFT JOIN question_counts q ON q.lesson_id=l.id;

-- 2. Lesson improvement queue by country / grade / semester.
-- NULL grade numbers may represent nonstandard / adult courses, NOT missing primary grades.
WITH question_counts AS (
  SELECT lesson_id, COUNT(*)::integer AS n FROM public.questions GROUP BY lesson_id
)
SELECT
  co.code AS country_code, g.grade_number, l.semester,
  COUNT(*) AS published_records,
  COUNT(*) FILTER (WHERE COALESCE(q.n,0)=0) AS no_stored_questions,
  COUNT(*) FILTER (WHERE LENGTH(COALESCE(l.content,'')) < 1200) AS under_1200_chars,
  COUNT(*) FILTER (WHERE l.vocabulary IS NULL OR l.vocabulary='[]'::jsonb) AS no_saved_vocabulary,
  COUNT(*) FILTER (WHERE l.official_content_scope='plan-scheduled') AS tagged_plan_scheduled
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula c ON c.id=g.curriculum_id
JOIN public.countries co ON co.id=c.country_id
LEFT JOIN question_counts q ON q.lesson_id=l.id
WHERE l.status='published'
GROUP BY co.code,g.grade_number,l.semester
ORDER BY co.code,g.grade_number NULLS LAST,l.semester NULLS LAST;

-- 3. Bahrain content source classifications, NOT external certification.
SELECT
  COALESCE(l.official_content_scope,'unclassified') AS source_scope_label,
  l.status,
  COUNT(*) AS stored_lesson_records
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula c ON c.id=g.curriculum_id
JOIN public.countries co ON co.id=c.country_id
WHERE co.code='BH'
GROUP BY COALESCE(l.official_content_scope,'unclassified'),l.status
ORDER BY source_scope_label,l.status;
