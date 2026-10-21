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

-- 4. Multiple-choice structural integrity, separated from educational enrichment signals.
-- 3-option AND 4-option MCQs can be valid. Do not demand 4 options across
-- ages or curricula. Count answer keys independently from explanation quality.
SELECT co.code AS country_code, g.grade_number,
       COUNT(*) AS mcq_rows_checked,
       COUNT(*) FILTER (
         WHERE CASE WHEN jsonb_typeof(q.options)='array'
           THEN jsonb_array_length(q.options) BETWEEN 2 AND 6
             AND EXISTS (
               SELECT 1 FROM jsonb_array_elements(q.options) a
               WHERE a->>'id'=q.correct_answer
             )
           ELSE FALSE END
       ) AS valid_option_shape_and_key,
       COUNT(*) FILTER (
         WHERE NOT (CASE WHEN jsonb_typeof(q.options)='array'
           THEN jsonb_array_length(q.options) BETWEEN 2 AND 6
             AND EXISTS (
               SELECT 1 FROM jsonb_array_elements(q.options) a
               WHERE a->>'id'=q.correct_answer
             )
           ELSE FALSE END)
       ) AS invalid_shape_or_missing_key,
       COUNT(*) FILTER (
         WHERE jsonb_typeof(q.options)='array'
           AND jsonb_array_length(q.options)=3
       ) AS three_option_mcqs,
       COUNT(*) FILTER (
         WHERE jsonb_typeof(q.options)='array'
           AND jsonb_array_length(q.options)=4
       ) AS four_option_mcqs,
       COUNT(*) FILTER (
         WHERE LENGTH(COALESCE(q.explanation,''))<30
       ) AS needs_explanation_review
FROM public.questions q
JOIN public.lessons l ON l.id=q.lesson_id
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula c ON c.id=g.curriculum_id
JOIN public.countries co ON co.id=c.country_id
WHERE l.status='published' AND q.question_type='multiple_choice'
GROUP BY co.code,g.grade_number
ORDER BY co.code,g.grade_number NULLS LAST;

-- 5. Read-only Bahrain Grade 10 Semester 1 next-lesson queue.
-- A missing stored question in 'questions' does not rule out other activities.
WITH question_counts AS (
  SELECT lesson_id, COUNT(*) AS n FROM public.questions GROUP BY lesson_id
)
SELECT l.id AS lesson_id, l.title, l.lesson_type,
       LENGTH(COALESCE(l.content,'')) AS content_chars,
       l.official_content_scope,
       COALESCE(q.n,0) AS stored_questions
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula c ON c.id=g.curriculum_id
JOIN public.countries co ON co.id=c.country_id
LEFT JOIN question_counts q ON q.lesson_id=l.id
WHERE co.code='BH' AND g.grade_number=10 AND l.semester=1
  AND l.status='published' AND COALESCE(q.n,0)=0
ORDER BY l.lesson_type,l.title,l.id;


-- 6. Bahrain Grade 10, semester 1: measurable minimum stored-learning readiness.
-- This counts existing RECORDS, not verified ministry book lessons.
-- Having 3 questions, learning objectives and vocabulary does NOT certify
-- the appropriateness or factual correctness of any exercise.
WITH question_counts AS(
  SELECT lesson_id,COUNT(*) AS n FROM public.questions GROUP BY lesson_id
)
SELECT COUNT(*) AS published_lesson_records,
       COUNT(*) FILTER(WHERE COALESCE(q.n,0)=0) AS without_stored_questions,
       COUNT(*) FILTER(WHERE COALESCE(q.n,0)>=3) AS with_three_plus_questions,
       COUNT(*) FILTER(
         WHERE jsonb_typeof(l.learning_objectives)='array'
           AND jsonb_array_length(l.learning_objectives)>=3
       ) AS with_three_plus_learning_objectives,
       COUNT(*) FILTER(
         WHERE jsonb_typeof(l.vocabulary)='array'
           AND jsonb_array_length(l.vocabulary)>=3
       ) AS with_three_plus_saved_vocabulary,
       COUNT(*) FILTER(WHERE l.official_content_scope='plan-scheduled') AS marked_plan_scheduled_but_not_officially_verified
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula c ON c.id=g.curriculum_id
JOIN public.countries co ON co.id=c.country_id
LEFT JOIN question_counts q ON q.lesson_id=l.id
WHERE co.code='BH' AND g.grade_number=10 AND l.semester=1 AND l.status='published';

-- 7. Bahrain Grade 11, Semester 1 content-readiness signals by lesson type.
-- Counts existing database records, not verified/approved official textbook lessons.
-- Duplicate titles may intentionally belong to DIFFERENT academic tracks.
WITH question_counts AS (
  SELECT lesson_id, COUNT(*) AS n FROM public.questions GROUP BY lesson_id
)
SELECT l.lesson_type,
       COUNT(*) AS published_records,
       COUNT(*) FILTER(WHERE COALESCE(q.n,0)=0) AS without_stored_questions,
       COUNT(*) FILTER(WHERE COALESCE(q.n,0)>=3) AS with_three_plus_questions,
       COUNT(*) FILTER(WHERE jsonb_typeof(l.learning_objectives)='array'
         AND jsonb_array_length(l.learning_objectives)>=3) AS with_three_plus_objectives,
       COUNT(*) FILTER(WHERE jsonb_typeof(l.vocabulary)='array'
         AND jsonb_array_length(l.vocabulary)>=3) AS with_three_plus_vocabulary,
       COUNT(*) FILTER(WHERE l.official_content_scope='plan-scheduled') AS tagged_plan_scheduled_not_officially_certified
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula c ON c.id=g.curriculum_id
JOIN public.countries co ON co.id=c.country_id
LEFT JOIN question_counts q ON q.lesson_id=l.id
WHERE co.code='BH' AND g.grade_number=11 AND l.semester=1 AND l.status='published'
GROUP BY l.lesson_type
ORDER BY l.lesson_type;


-- 8. Bahrain G11 Semester 1 per-course-track quality: prevent merging
-- same-titled lessons from technical/professional/religious course tracks.
-- Only summaries beginning with a recognizable course code are grouped as such.
-- Other summaries are marked 'unclassified-course-summary' rather than invented
-- course identifiers. None of these labels certify ministry-year mapping.
WITH question_counts AS (
  SELECT lesson_id, COUNT(*)::integer AS n FROM public.questions GROUP BY lesson_id
)
SELECT
  CASE WHEN COALESCE(l.summary,'') ~ '^(عرب|أدب|قرأ|نحو) [0-9]+ — ' THEN split_part(l.summary,' — ',1) ELSE 'unclassified-course-summary' END AS course_label,
  l.lesson_type,
  COUNT(*) AS published_lesson_records,
  COUNT(*) FILTER (WHERE COALESCE(q.n,0)=0) AS without_stored_questions,
  COUNT(*) FILTER (WHERE COALESCE(q.n,0)>=3) AS with_three_plus_questions,
  COUNT(*) FILTER (WHERE l.vocabulary IS NULL OR l.vocabulary='[]'::jsonb) AS without_saved_vocabulary
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula c ON c.id=g.curriculum_id
JOIN public.countries co ON co.id=c.country_id
LEFT JOIN question_counts q ON q.lesson_id=l.id
WHERE co.code='BH' AND g.grade_number=11 AND l.semester=1
  AND l.status='published'
GROUP BY CASE WHEN COALESCE(l.summary,'') ~ '^(عرب|أدب|قرأ|نحو) [0-9]+ — ' THEN split_part(l.summary,' — ',1) ELSE 'unclassified-course-summary' END, l.lesson_type
ORDER BY course_label, l.lesson_type;


-- 9. Bahrain Grade 11 Semester 1: minimum stored learning-record completeness.
-- IMPORTANT: This measures database RECORDS only, not official curriculum
-- equivalence, copyright provenance, student mastery or live UI availability.
-- Course labels are taken from recognizable summary prefixes; never infer
-- an authoritative syllabus mapping from these strings.
WITH qc AS (
  SELECT lesson_id,COUNT(*)::integer n FROM public.questions GROUP BY lesson_id
), eligible AS (
  SELECT l.id,l.lesson_type,l.summary,l.learning_objectives,l.vocabulary,l.official_content_scope,
         COALESCE(qc.n,0) AS question_count
  FROM public.lessons l
  JOIN public.units u ON u.id=l.unit_id
  JOIN public.grades g ON g.id=u.grade_id
  JOIN public.curricula c ON c.id=g.curriculum_id
  JOIN public.countries co ON co.id=c.country_id
  LEFT JOIN qc ON qc.lesson_id=l.id
  WHERE co.code='BH' AND g.grade_number=11 AND l.semester=1 AND l.status='published'
)
SELECT COUNT(*) AS published_lesson_records,
       COUNT(*) FILTER(WHERE question_count=0) AS without_stored_questions,
       COUNT(*) FILTER(WHERE question_count>=3) AS with_three_plus_questions,
       COUNT(*) FILTER(WHERE jsonb_typeof(learning_objectives)='array'
         AND jsonb_array_length(learning_objectives)>=3) AS with_three_plus_objectives,
       COUNT(*) FILTER(WHERE jsonb_typeof(vocabulary)='array'
         AND jsonb_array_length(vocabulary)>=3) AS with_three_plus_vocabulary,
       COUNT(*) FILTER(WHERE question_count>=3
         AND jsonb_typeof(learning_objectives)='array'
         AND jsonb_array_length(learning_objectives)>=3
         AND jsonb_typeof(vocabulary)='array'
         AND jsonb_array_length(vocabulary)>=3) AS meets_minimum_stored_fields,
       COUNT(*) FILTER(WHERE official_content_scope='plan-scheduled') AS tagged_plan_scheduled_not_certified
FROM eligible;


-- 10. Bahrain Grade 12 first-semester stored learning readiness by lesson type.
-- All counts describe existing rows; "plan-scheduled" is NOT proof of official
-- 2026/27 ministry-book alignment or verification of the original source text.
-- Distinct IDs are essential: the same lesson title may belong to different
-- technical/professional and administrative/engineering tracks.
WITH qc AS (
  SELECT lesson_id,COUNT(*)::integer n FROM public.questions GROUP BY lesson_id
)
SELECT l.lesson_type,
       COUNT(*) AS published_records,
       COUNT(*) FILTER(WHERE COALESCE(qc.n,0)=0) AS without_stored_questions,
       COUNT(*) FILTER(WHERE COALESCE(qc.n,0)>=3) AS with_three_plus_questions,
       COUNT(*) FILTER(WHERE jsonb_typeof(l.learning_objectives)='array'
         AND jsonb_array_length(l.learning_objectives)>=3) AS with_three_plus_objectives,
       COUNT(*) FILTER(WHERE jsonb_typeof(l.vocabulary)='array'
         AND jsonb_array_length(l.vocabulary)>=3) AS with_three_plus_vocabulary,
       COUNT(*) FILTER(WHERE COALESCE(qc.n,0)>=3
         AND jsonb_typeof(l.learning_objectives)='array'
         AND jsonb_array_length(l.learning_objectives)>=3
         AND jsonb_typeof(l.vocabulary)='array'
         AND jsonb_array_length(l.vocabulary)>=3) AS meets_stored_record_minimum,
       COUNT(*) FILTER(WHERE l.official_content_scope='plan-scheduled') AS tagged_plan_scheduled_not_ministry_certified
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula c ON c.id=g.curriculum_id
JOIN public.countries co ON co.id=c.country_id
LEFT JOIN qc ON qc.lesson_id=l.id
WHERE co.code='BH' AND g.grade_number=12 AND l.semester=1 AND l.status='published'
GROUP BY l.lesson_type ORDER BY l.lesson_type;
