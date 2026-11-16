-- READ ONLY. Run only with a read-only role. No DDL/DML.
-- Counts describe the existing lesson_completeness_v1 view, not official ministry coverage.
SELECT
  country_code,
  grade_number,
  count(*) AS lessons_registered,
  count(*) FILTER (WHERE is_core_complete) AS core_complete,
  count(*) FILTER (WHERE NOT is_core_complete) AS core_incomplete,
  count(*) FILTER (WHERE NOT has_source) AS missing_recorded_source,
  count(*) FILTER (WHERE question_count = 0) AS without_questions,
  count(*) FILTER (WHERE activity_count = 0) AS without_activities,
  count(*) FILTER (WHERE coalesce(content_chars,0) < 120) AS short_content,
  count(*) FILTER (WHERE coalesce(objectives_count,0) = 0) AS without_objectives
FROM public.lesson_completeness_v1
GROUP BY country_code,grade_number
ORDER BY CASE country_code WHEN 'BH' THEN 0 WHEN 'PS' THEN 1 ELSE 2 END,
         country_code,grade_number;

-- Highest-priority existing lesson records for teacher/source review.
-- Do NOT auto-fill sources, publish lessons or manufacture questions from this output.
SELECT lesson_id,country_code,grade_number,unit_title,lesson_number,title,status,
       summary_chars,content_chars,objectives_count,vocabulary_count,
       question_count,activity_count,has_source,is_core_complete
FROM public.lesson_completeness_v1
WHERE country_code IN ('BH','PS') AND grade_number BETWEEN 1 AND 3
  AND (NOT is_core_complete OR NOT has_source)
ORDER BY CASE country_code WHEN 'BH' THEN 0 ELSE 1 END,
         grade_number,
         CASE WHEN coalesce(content_chars,0) < 120 THEN 0 ELSE 1 END,
         CASE WHEN coalesce(question_count,0)=0 THEN 0 ELSE 1 END,
         lesson_number
LIMIT 250;
