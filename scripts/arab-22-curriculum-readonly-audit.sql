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

-- 4. Comprehensive read-only teaching readiness flags for ALL 22 Arab countries.
-- A row count, source URL or lesson status is NOT proof of current official textbook coverage.
-- Metadata in `lessons` may differ from the normalized editorial tables.
WITH q AS (
  SELECT lesson_id, count(*)::int AS n FROM public.questions GROUP BY lesson_id
), a AS (
  SELECT lesson_id, count(*) FILTER (WHERE is_published IS TRUE)::int AS n
  FROM public.lesson_activities GROUP BY lesson_id
), base AS (
  SELECT co.code, l.status, l.content, l.summary, l.learning_objectives,
         l.vocabulary, l.instructions, l.source_pdf_url,
         l.source_page_start, l.semester, l.official_content_scope,
         coalesce(q.n,0) AS question_count, coalesce(a.n,0) AS activity_count
  FROM public.countries co
  JOIN public.curricula cu ON cu.country_id = co.id
  JOIN public.grades gr ON gr.curriculum_id = cu.id
  JOIN public.units un ON un.grade_id = gr.id
  JOIN public.lessons l ON l.unit_id = un.id
  LEFT JOIN q ON q.lesson_id = l.id LEFT JOIN a ON a.lesson_id = l.id
)
SELECT code AS country_code, count(*) AS lesson_rows,
  count(*) FILTER (WHERE status = 'published') AS published_rows,
  count(*) FILTER (WHERE status IS DISTINCT FROM 'published') AS unpublished_rows,
  count(*) FILTER (WHERE status='published' AND instructions @> '[{"kind":"dadyoom_source","source_content_status":"MVP_DRAFT"}]'::jsonb) AS published_mvp_draft,
  count(*) FILTER (WHERE learning_objectives='[]'::jsonb OR learning_objectives='{}'::jsonb) AS missing_embedded_objectives,
  count(*) FILTER (WHERE vocabulary='[]'::jsonb OR vocabulary='{}'::jsonb) AS missing_embedded_vocabulary,
  count(*) FILTER (WHERE instructions='[]'::jsonb OR instructions='{}'::jsonb) AS missing_embedded_instructions,
  count(*) FILTER (WHERE coalesce(length(btrim(summary)),0) < 30) AS missing_useful_summary,
  count(*) FILTER (WHERE source_pdf_url IS NULL OR btrim(source_pdf_url)='') AS source_reference_review,
  count(*) FILTER (WHERE source_page_start IS NULL) AS source_page_review,
  count(*) FILTER (WHERE semester IS NULL) AS semester_review,
  count(*) FILTER (WHERE official_content_scope IS NULL) AS official_scope_review,
  count(*) FILTER (WHERE status='published' AND question_count+activity_count<3) AS needs_assessment_review
FROM base GROUP BY code ORDER BY code;

-- 5. Editor-scoped repair queue. Never rewrite published or attempted lesson IDs.
-- Does not inspect private grading keys, learner rows, or student attempts.
WITH q AS (
  SELECT lesson_id, count(*)::int AS n FROM public.questions GROUP BY lesson_id
), a AS (
  SELECT lesson_id, count(*) FILTER (WHERE is_published IS TRUE)::int AS n
  FROM public.lesson_activities GROUP BY lesson_id
), queue AS (
  SELECT co.code, cu.name_ar AS curriculum, gr.name_ar AS grade,
    l.id AS lesson_id, l.title, l.status,
    coalesce(q.n,0) AS questions, coalesce(a.n,0) AS activities,
    l.instructions @> '[{"kind":"dadyoom_source","source_content_status":"MVP_DRAFT"}]'::jsonb AS unreviewed_mvp,
    l.vocabulary='[]'::jsonb AS empty_vocabulary,
    l.learning_objectives='[]'::jsonb AS empty_objectives,
    coalesce(length(btrim(l.content)),0)<200 AS short_content,
    l.source_pdf_url IS NULL AS missing_source_url,
    l.semester IS NULL AS missing_semester,
    l.official_content_scope IS NULL AS missing_scope
  FROM public.countries co
  JOIN public.curricula cu ON cu.country_id=co.id
  JOIN public.grades gr ON gr.curriculum_id=cu.id
  JOIN public.units un ON un.grade_id=gr.id
  JOIN public.lessons l ON l.unit_id=un.id
  LEFT JOIN q ON q.lesson_id=l.id
  LEFT JOIN a ON a.lesson_id=l.id
)
SELECT code AS country_code,curriculum,grade,lesson_id,title,status,
  questions,activities,unreviewed_mvp,empty_vocabulary,empty_objectives,
  short_content,missing_source_url,missing_semester,missing_scope
FROM queue
WHERE (status='published' AND (questions+activities<3 OR unreviewed_mvp OR short_content))
  OR (status IS DISTINCT FROM 'published')
ORDER BY CASE WHEN status='published' AND questions+activities<3 THEN 0
              WHEN status='published' AND unreviewed_mvp THEN 1
              WHEN status='published' AND short_content THEN 2 ELSE 3 END,
         code,grade,title
LIMIT 500;

-- 6. Missing inline vocabulary vs. already-stored linked vocabulary.
-- RLS-bound page reader may recover the linked words for signed-in learners,
-- but it must NOT generate/deduplicate database rows or elevate privileges.
SELECT co.code AS country_code,
  count(*) FILTER (WHERE l.vocabulary='[]'::jsonb) AS embedded_vocabulary_missing,
  count(*) FILTER (
    WHERE l.vocabulary='[]'::jsonb
      AND EXISTS (SELECT 1 FROM public.lesson_vocabulary v WHERE v.lesson_id=l.id)
  ) AS existing_relational_vocabulary_recoverable,
  count(*) FILTER (
    WHERE l.vocabulary='[]'::jsonb
      AND NOT EXISTS (SELECT 1 FROM public.lesson_vocabulary v WHERE v.lesson_id=l.id)
  ) AS vocabulary_authoring_review_required
FROM public.countries co
JOIN public.curricula cu ON cu.country_id=co.id
JOIN public.grades gr ON gr.curriculum_id=cu.id
JOIN public.units un ON un.grade_id=gr.id
JOIN public.lessons l ON l.unit_id=un.id
GROUP BY co.code ORDER BY co.code;
