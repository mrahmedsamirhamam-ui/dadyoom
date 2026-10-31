-- Dadyoom / 2026-10-31 / READ ONLY / grades 1-3, 22 countries.
-- These are stored lesson-record signals, NOT proof of ministry syllabus completion.
-- No learner identities, answer keys, grant changes or data mutations.

WITH activity_counts AS (
 SELECT lesson_id, count(*) FILTER (WHERE is_published) AS published_activities
 FROM public.lesson_activities GROUP BY lesson_id
), question_counts AS (
 SELECT lesson_id, count(*) AS saved_questions,
 count(*) FILTER (WHERE nullif(trim(question),'') IS NOT NULL
 AND nullif(trim(explanation),'') IS NOT NULL) AS explained_questions
 FROM public.questions GROUP BY lesson_id
), lesson_records AS (
 SELECT c.code AS country_code, c.name_ar AS country,
        g.grade_number AS grade, l.id AS lesson_id, l.title,
        l.status, l.source_pdf_url, l.official_content_scope,
        coalesce(a.published_activities,0) AS activities,
        coalesce(q.saved_questions,0) AS questions,
        coalesce(q.explained_questions,0) AS explained_questions
 FROM public.lessons l
 JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula cur ON cur.id=g.curriculum_id
 JOIN public.countries c ON c.id=cur.country_id
 LEFT JOIN activity_counts a ON a.lesson_id=l.id
 LEFT JOIN question_counts q ON q.lesson_id=l.id
 WHERE g.grade_number BETWEEN 1 AND 3
)
SELECT country_code, country, grade,
 count(*) AS stored_lessons,
 count(*) FILTER (WHERE status='published') AS published_lessons,
 count(*) FILTER (WHERE status<>'published') AS unpublished_lessons,
 count(*) FILTER (WHERE status='published' AND activities BETWEEN 6 AND 10) AS published_with_6_to_10_activities,
 count(*) FILTER (WHERE status='published' AND activities < 6) AS published_below_6_activities,
 count(*) FILTER (WHERE status='published' AND activities=0) AS published_without_activities,
 count(*) FILTER (WHERE status='published' AND questions >= 3 AND explained_questions >= 3) AS published_with_3_explained_questions,
 count(*) FILTER (WHERE status='published' AND source_pdf_url IS NOT NULL) AS published_with_source_url,
 count(*) FILTER (WHERE status='published' AND official_content_scope IS NOT NULL) AS published_with_scope_label
FROM lesson_records GROUP BY country_code,country,grade ORDER BY country_code,grade;

-- Detailed next-review queue (read-only; preserves every existing record).
WITH activities AS (
 SELECT lesson_id,count(*) FILTER(WHERE is_published) AS n
 FROM public.lesson_activities GROUP BY lesson_id
)
SELECT c.code AS country_code, g.grade_number AS grade,
       l.id AS lesson_id, l.title, l.status, l.semester,
       coalesce(a.n,0) AS published_activity_count,
       l.official_content_scope, l.source_pdf_url
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula cu ON cu.id=g.curriculum_id
JOIN public.countries c ON c.id=cu.country_id
LEFT JOIN activities a ON a.lesson_id=l.id
WHERE g.grade_number BETWEEN 1 AND 3
  AND (l.status<>'published' OR coalesce(a.n,0)<6)
ORDER BY CASE WHEN l.status='published' AND coalesce(a.n,0)=0 THEN 0
              WHEN l.status='published' THEN 1 ELSE 2 END,
         c.code,g.grade_number,l.title,l.id;

-- Review registration and the official-source ledger independently:
SELECT (SELECT count(*) FROM public.countries) AS registered_country_rows,
       (SELECT count(*) FROM public.curriculum_toc_evidence) AS ministry_toc_evidence_rows;
