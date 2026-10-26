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


-- 11. Bahrain Grade 12 Semester 1: three-field record completeness by course.
-- Read-only. Imported summary course labels and plan-scheduled flags do NOT
-- certify the actual Ministry textbook, syllabus year or classroom mastery.
WITH counts AS (SELECT lesson_id,count(*)::integer n FROM public.questions GROUP BY lesson_id),
scoped AS (
 SELECT l.id,l.lesson_type,l.learning_objectives,l.vocabulary,
 CASE WHEN coalesce(l.summary,'') ~ '^(أدب|قرأ|عرب|نحو) [0-9]+ — '
      THEN split_part(l.summary,' — ',1)
      ELSE 'unclassified-course-summary' END AS course_label,
 coalesce(counts.n,0) AS question_count
 FROM public.lessons l
 JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula c ON c.id=g.curriculum_id JOIN public.countries co ON co.id=c.country_id
 LEFT JOIN counts ON counts.lesson_id=l.id
 WHERE co.code='BH' AND g.grade_number=12 AND l.semester=1
 AND l.status='published'
)
SELECT course_label,lesson_type,count(*) published_records,
 count(*) FILTER(WHERE question_count=0) without_saved_questions,
 count(*) FILTER(WHERE question_count>=3) with_three_plus_questions,
 count(*) FILTER(WHERE jsonb_typeof(learning_objectives)='array' AND jsonb_array_length(learning_objectives)>=3
                    AND jsonb_typeof(vocabulary)='array' AND jsonb_array_length(vocabulary)>=3
                    AND question_count>=3) with_full_minimum_fields
FROM scoped GROUP BY course_label,lesson_type ORDER BY course_label,lesson_type;


-- 12. Bahrain Grade 11 Semester 2: first-semester parity / lesson-type gaps.
-- Read-only. 'official-book-unscheduled' tracks are *not* verified against the current ministry plan.
WITH qc AS (
 SELECT lesson_id,COUNT(*)::integer n,
 COUNT(*) FILTER(WHERE question_type='multiple_choice'
  AND jsonb_typeof(options)='array' AND jsonb_array_length(options)=4
  AND correct_answer IN ('a','b','c','d')
  AND EXISTS(SELECT 1 FROM jsonb_array_elements(options) o WHERE o->>'id'=correct_answer)
  AND LENGTH(COALESCE(explanation,''))>=32)::integer structural_mcq
 FROM public.questions GROUP BY lesson_id
), scope AS (
 SELECT l.lesson_type,l.official_content_scope,l.learning_objectives,l.vocabulary,
 COALESCE(qc.n,0) question_count,COALESCE(qc.structural_mcq,0) structural_mcq
 FROM public.lessons l
 JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula c ON c.id=g.curriculum_id
 JOIN public.countries co ON co.id=c.country_id
 LEFT JOIN qc ON qc.lesson_id=l.id
 WHERE co.code='BH' AND g.grade_number=11 AND l.semester=2 AND l.status='published'
)
SELECT lesson_type,official_content_scope,COUNT(*) published_records,
 COUNT(*) FILTER(WHERE question_count=0) missing_saved_questions,
 COUNT(*) FILTER(WHERE question_count>=3) with_three_plus_questions,
 COUNT(*) FILTER(WHERE jsonb_typeof(learning_objectives)='array' AND jsonb_array_length(learning_objectives)>=3
   AND jsonb_typeof(vocabulary)='array' AND jsonb_array_length(vocabulary)>=3
   AND question_count>=3) enriched_minimum,
 SUM(structural_mcq) structurally_valid_mcq
FROM scope GROUP BY lesson_type,official_content_scope ORDER BY lesson_type,official_content_scope;

-- 14. Published assessment coverage: count BOTH stored questions and published activities.
-- This gate validates RECORD PRESENCE only, not learner ability to answer it, pedagogy,
-- exact official syllabus, privacy, or deployed API accessibility.
WITH qc AS (
 SELECT lesson_id,count(*) AS n FROM public.questions GROUP BY lesson_id
), ac AS (
 SELECT lesson_id,count(*) FILTER(WHERE is_published IS TRUE) AS n
 FROM public.lesson_activities GROUP BY lesson_id
)
SELECT
 COUNT(*) AS published_lesson_records,
 COUNT(*) FILTER(WHERE coalesce(qc.n,0)>0 OR coalesce(ac.n,0)>0) AS with_stored_assessment,
 COUNT(*) FILTER(WHERE coalesce(qc.n,0)=0 AND coalesce(ac.n,0)>0) AS assessed_by_activities_only,
 COUNT(*) FILTER(WHERE coalesce(qc.n,0)=0 AND coalesce(ac.n,0)=0) AS missing_stored_assessment,
 ROUND(100.0 * COUNT(*) FILTER(WHERE coalesce(qc.n,0)>0 OR coalesce(ac.n,0)>0)
  / NULLIF(COUNT(*),0),2) AS published_assessment_coverage_pct
FROM public.lessons l LEFT JOIN qc ON qc.lesson_id=l.id
 LEFT JOIN ac ON ac.lesson_id=l.id
WHERE l.status='published';

-- 15. Distinguish imported draft index artifacts, authorable curriculum draft
-- packages, and published BOOK CATALOG reference nodes (not actual lesson texts).
-- Flags are heuristic QA queues; never automatically publish/delete/change a row.
SELECT
 count(*) FILTER(WHERE l.status='draft') AS total_draft_rows,
 count(*) FILTER(WHERE l.status='draft' AND co.code='BH' AND
   length(coalesce(l.content,''))<300 AND NOT EXISTS(
    SELECT 1 FROM public.questions q WHERE q.lesson_id=l.id
   )) AS bahrain_short_no_question_import_candidates,
 count(*) FILTER(WHERE l.status='draft' AND co.code<>'BH') AS other_country_drafts_to_review,
 count(*) FILTER(WHERE l.status='published' AND length(coalesce(l.content,''))=0
   AND l.summary LIKE 'عقدة تغطية رسمية%') AS published_book_catalog_reference_nodes,
 count(*) FILTER(WHERE l.status='published' AND length(coalesce(l.content,''))=0
   AND coalesce(l.summary,'') NOT LIKE 'عقدة تغطية رسمية%') AS published_empty_non_catalog_lessons
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula c ON c.id=g.curriculum_id
JOIN public.countries co ON co.id=c.country_id;

-- 16. Unpublished readiness: group draft lesson records by country/grade/term,
-- preserving separate blockers for missing assessment and source provenance.
-- Short content (<1200 chars) is an editorial signal, NOT a deterministic
-- publication decision. A stored question is NOT evidence of official syllabus
-- matching. No answers, learner records or personally identifying data are read.
-- DO NOT auto-publish, auto-delete or invent source pages from this report.
WITH draft_question_counts AS (
 SELECT lesson_id,count(*) AS n
 FROM public.questions GROUP BY lesson_id
), draft_published_activity_counts AS (
 SELECT lesson_id,count(*) AS n
 FROM public.lesson_activities WHERE is_published IS TRUE GROUP BY lesson_id
)
SELECT
 co.code AS country_code,
 g.grade_number,
 l.semester,
 COUNT(*) AS draft_records,
 COUNT(*) FILTER(WHERE coalesce(qc.n,0)=0 AND coalesce(ac.n,0)=0)
   AS draft_missing_stored_assessment,
 COUNT(*) FILTER(WHERE coalesce(qc.n,0)>0 OR coalesce(ac.n,0)>0)
   AS draft_with_stored_assessment,
 COUNT(*) FILTER(WHERE length(coalesce(l.content,''))<1200)
   AS draft_short_content_under_1200,
 COUNT(*) FILTER(WHERE nullif(btrim(coalesce(l.source_pdf_url,'')),'') IS NULL)
   AS draft_without_source_url,
 COUNT(*) FILTER(WHERE l.source_page_start IS NULL OR l.source_page_start<1)
   AS draft_without_source_start_page,
 COUNT(*) FILTER(WHERE l.semester IS NULL)
   AS draft_without_semester,
 COUNT(*) FILTER(WHERE nullif(btrim(coalesce(l.official_content_scope,'')),'') IS NULL)
   AS draft_without_source_scope
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula c ON c.id=g.curriculum_id
JOIN public.countries co ON co.id=c.country_id
LEFT JOIN draft_question_counts qc ON qc.lesson_id=l.id
LEFT JOIN draft_published_activity_counts ac ON ac.lesson_id=l.id
WHERE l.status='draft'
GROUP BY co.code,g.grade_number,l.semester
ORDER BY draft_records DESC,co.code,g.grade_number,l.semester NULLS LAST;


-- 17. Bahrain imported-index quarantine: these are NOT verified textbook lessons.
-- List only structural metadata for authoring. Never auto-publish placeholder
-- titles, copied table headers or short generic bodies. Source-matching to
-- official 2026-27 plans + textbook page proof must precede any replacement.
SELECT co.code AS country_code,g.grade_number,l.semester,
 COUNT(*) AS draft_index_candidates,
 COUNT(*) FILTER(WHERE l.content LIKE 'يتناول هذا الدرس موضوع%')
   AS generic_scaffold_bodies,
 COUNT(*) FILTER(WHERE l.title ~
   '(عنوان الدرس|اسم الكتاب|الصف:|^القراءة|^الدّرس|ورقمه)')
   AS extracted_toc_or_header_titles,
 COUNT(*) FILTER(WHERE l.source_pdf_url IS NULL OR l.source_page_start IS NULL)
   AS missing_verifiable_page_provenance
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula c ON c.id=g.curriculum_id
JOIN public.countries co ON co.id=c.country_id
WHERE l.status='draft' AND co.code='BH'
GROUP BY co.code,g.grade_number,l.semester
ORDER BY g.grade_number,l.semester NULLS LAST;


-- 18. Bahrain grade-two reconciliation: compare the 12 real reading titles
-- from Ministry 2026-27 Plan1 with published lessons before any new import.
-- This is conservative normalized-substring candidate matching, NOT proof
-- of textbook text identity or permission to overwrite existing lessons.
-- Count only metadata; never access student attempts or correct-answer keys.
-- Arabic tatweel and vowel marks MUST be removed before matching: titles
-- like "الـمصوّر الصّغير" otherwise look falsely absent.
WITH official(lesson_number,official_title) AS (VALUES
 (1,'صديقتي مريم'), (2,'بالروح أفديها'), (3,'سالم مريض'),
 (4,'تعاون النمل'), (5,'المصور الصغير'), (6,'دراجتي'),
 (7,'جولة في محمية محمد بن زايد الطبيعية'), (8,'الطائرة الورقية'),
 (9,'في عيادة العيون'), (10,'نظافتي'),
 (11,'الرياضة غيرت حياتي'), (12,'الغذاء الصحي')
), records AS (
 SELECT l.id,l.title,l.status, length(coalesce(l.content,'')) AS content_chars,
        regexp_replace(regexp_replace(lower(l.title),
          '[ًٌٍَُِّْـ]','','g'),'[^ء-ي]','','g') AS title_key,
        coalesce(q.n,0) AS question_count, coalesce(a.n,0) AS activity_count
 FROM public.lessons l
 JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula cur ON cur.id=g.curriculum_id
 JOIN public.countries co ON co.id=cur.country_id
 LEFT JOIN (SELECT lesson_id,count(*) n FROM public.questions GROUP BY lesson_id) q
   ON q.lesson_id=l.id
 LEFT JOIN (SELECT lesson_id,count(*) FILTER(WHERE is_published) n
   FROM public.lesson_activities GROUP BY lesson_id) a ON a.lesson_id=l.id
 WHERE co.code='BH' AND g.grade_number=2
   AND l.semester=1 AND l.status='published'
)
SELECT o.lesson_number,o.official_title,
 count(r.id) AS published_title_candidates,
 count(r.id) FILTER(WHERE r.question_count>=3) AS with_three_plus_questions,
 count(r.id) FILTER(WHERE r.activity_count>0) AS with_published_activities,
 max(r.content_chars) AS longest_existing_body,
 CASE WHEN count(r.id)=0 THEN 'NO_TITLE_CANDIDATE_REVIEW'
      WHEN count(r.id)>1 THEN 'MULTIPLE_PUBLISHED_RECORDS_REVIEW_DUPLICATES'
      ELSE 'ONE_TITLE_CANDIDATE_REVIEW_CONTENT' END AS reconciliation_status
FROM official o LEFT JOIN records r ON r.title_key LIKE '%' ||
 regexp_replace(regexp_replace(lower(o.official_title),
   '[ًٌٍَُِّْـ]','','g'),'[^ء-ي]','','g') || '%'
GROUP BY o.lesson_number,o.official_title ORDER BY o.lesson_number;

-- 19. Bahrain PUBLISHED scaffold quality queue — not just unpublished drafts.
-- A published flag, source URL or stored exercise does NOT certify that a
-- student-facing lesson contains authored instructional content or matches
-- a current Ministry textbook. This identifies only one known boilerplate
-- fingerprint and does not claim to detect every weak published lesson.
-- Read-only aggregate: do not select private answers, students or attempt rows.
-- No automatic deletion, hiding, grade modification or republishing.
WITH stored_questions AS (
 SELECT lesson_id, COUNT(*) AS n FROM public.questions GROUP BY lesson_id
), published_activities AS (
 SELECT lesson_id, COUNT(*) FILTER(WHERE is_published IS TRUE) AS n
 FROM public.lesson_activities GROUP BY lesson_id
)
SELECT co.code AS country_code, g.grade_number, l.semester,
 COUNT(*) AS published_generic_scaffold_candidates,
 COUNT(*) FILTER(WHERE COALESCE(q.n,0)>=3) AS scaffold_with_three_plus_questions,
 COUNT(*) FILTER(WHERE COALESCE(a.n,0)>0) AS scaffold_with_published_activities,
 COUNT(*) FILTER(WHERE NULLIF(BTRIM(COALESCE(l.source_pdf_url,'')),'') IS NOT NULL)
   AS scaffold_with_source_url_not_proof,
 COUNT(*) FILTER(WHERE l.official_content_scope IS NULL)
   AS scaffold_without_official_scope,
 COUNT(*) FILTER(WHERE l.title ~
  '(عنوان الدرس|اسم الكتاب|الصف:|^القراءة|^الدّرس|ورقمه)')
   AS scaffold_with_index_style_title,
 MAX(LENGTH(COALESCE(l.content,''))) AS longest_scaffold_body
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula cur ON cur.id=g.curriculum_id
JOIN public.countries co ON co.id=cur.country_id
LEFT JOIN stored_questions q ON q.lesson_id=l.id
LEFT JOIN published_activities a ON a.lesson_id=l.id
WHERE co.code='BH' AND l.status='published'
 AND l.content LIKE 'يتناول هذا الدرس موضوع%'
GROUP BY co.code,g.grade_number,l.semester
ORDER BY g.grade_number,l.semester NULLS LAST;
