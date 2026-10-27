-- Dadyoom 22 Arab countries x Grades 1-3: evidence-only 2026-27 baseline.
-- SELECT ONLY. No student records, answers, secrets or production writes.
-- Published rows and count of stored questions do not establish textbook alignment
-- or the pedagogical validity of their answer keys.
WITH question_counts AS (
  SELECT lesson_id,COUNT(*)::int n FROM public.questions GROUP BY lesson_id
), activity_counts AS (
  SELECT lesson_id,COUNT(*)::int n FROM public.lesson_activities GROUP BY lesson_id
), word_counts AS (
  SELECT lesson_id,COUNT(*)::int n FROM public.lesson_vocabulary GROUP BY lesson_id
), rows_by_grade AS (
 SELECT c.code country_code,c.name_ar country_name,g.grade_number,l.id lesson_id,
        l.status,l.semester,l.content,l.vocabulary,l.official_content_scope,
        COALESCE(q.n,0) questions,COALESCE(a.n,0) activities,COALESCE(v.n,0) linked_vocabulary
 FROM public.countries c
 JOIN public.curricula cu ON cu.country_id=c.id
 JOIN public.grades g ON g.curriculum_id=cu.id AND g.grade_number IN (1,2,3)
 LEFT JOIN public.units u ON u.grade_id=g.id
 LEFT JOIN public.lessons l ON l.unit_id=u.id
 LEFT JOIN question_counts q ON q.lesson_id=l.id
 LEFT JOIN activity_counts a ON a.lesson_id=l.id
 LEFT JOIN word_counts v ON v.lesson_id=l.id
)
SELECT country_code,country_name,grade_number,
       COUNT(lesson_id) total_lessons,
       COUNT(lesson_id) FILTER(WHERE status='published') published_lessons,
       COUNT(lesson_id) FILTER(WHERE status IS DISTINCT FROM 'published') nonpublished_lessons,
       COUNT(lesson_id) FILTER(WHERE status='published' AND semester IS NULL) published_no_term,
       COUNT(lesson_id) FILTER(WHERE status='published' AND (vocabulary='[]'::jsonb OR vocabulary IS NULL) AND linked_vocabulary=0) published_no_stored_vocabulary,
       COUNT(lesson_id) FILTER(WHERE status='published' AND questions+activities<3) published_fewer_than_3_assessment_records,
       COUNT(lesson_id) FILTER(WHERE status='published' AND content LIKE 'حزمة ضاديوم الموضوعية المتخصصة%') published_generic_dadyoom_skill_packs,
       COUNT(lesson_id) FILTER(WHERE status='published' AND official_content_scope IS NOT NULL) published_with_source_scope_label,
       COUNT(lesson_id) FILTER(WHERE status='published' AND length(btrim(coalesce(content,'')))<40) published_short_content,
       COALESCE(SUM(questions),0) total_question_rows,
       COALESCE(SUM(activities),0) total_activity_rows
FROM rows_by_grade
GROUP BY country_code,country_name,grade_number
ORDER BY grade_number,country_code;
