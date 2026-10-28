-- Live, READ-ONLY 22 Arab countries x grades 1-3 curriculum quality baseline.
-- Unlike title/source TOC evidence, this measures stored lesson & question
-- quality only and DOES NOT establish ministry/2026-27 edition alignment.
-- No answer values, student information, IDs, or raw lesson text returned.
WITH question_quality AS (
 SELECT lesson_id,
 COUNT(*) AS question_count,
 COUNT(*) FILTER (WHERE question IN (
  'ما المهارة الرئيسة التي يتدرب عليها هذا الدرس؟',
  'كيف تتحقق من إتقان المهارة الأساسية في هذا الدرس؟',
  'ما عنوان الدرس الذي تدرسه الآن؟'
 ) OR question LIKE 'أي عنوان من الآتي يطابق الدرس المحدد ضمن الصف%'
 OR question LIKE 'في الوحدة «القراءة والنصوص»، ما عنوان الدرس رقم%') AS generic_question_count
 FROM public.questions GROUP BY lesson_id
), lesson_quality AS (
 SELECT co.code AS country_code,co.name_ar AS country_name,g.grade_number,l.status,
 COALESCE(q.question_count,0) AS question_count,
 COALESCE(q.generic_question_count,0) AS generic_question_count,
 l.content LIKE 'يتناول هذا الدرس موضوع%' AS generic_scaffold,
 (l.content LIKE 'مسار القراءة والفهم الأصلي%'
  OR l.content LIKE 'إثراء ضاديوم الأصلي%') AS original_reading_support,
 l.instructions @> '[{"kind":"dadyoom_source","source_content_status":"MVP_DRAFT"}]'::jsonb AS marked_mvp_draft,
 CASE WHEN jsonb_typeof(l.learning_objectives)='array'
   THEN jsonb_array_length(l.learning_objectives)>=3 ELSE false END AS three_objectives,
 CASE WHEN jsonb_typeof(l.vocabulary)='array'
   THEN jsonb_array_length(l.vocabulary)>=3 ELSE false END AS three_vocabulary,
 l.official_content_scope='plan-scheduled' AS plan_scheduled
 FROM public.lessons l
 JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula c ON c.id=g.curriculum_id
 JOIN public.countries co ON co.id=c.country_id
 LEFT JOIN question_quality q ON q.lesson_id=l.id
 WHERE g.grade_number BETWEEN 1 AND 3
)
SELECT country_code,country_name,grade_number,
 COUNT(*) AS total_lessons,
 COUNT(*) FILTER(WHERE status='published') AS published,
 COUNT(*) FILTER(WHERE status='draft') AS draft,
 COUNT(*) FILTER(WHERE status='published' AND question_count<3) AS published_with_fewer_than_three_questions,
 COUNT(*) FILTER(WHERE status='published' AND generic_scaffold) AS generic_scaffold_lessons,
 COUNT(*) FILTER(WHERE status='published' AND generic_question_count>0) AS lessons_with_generic_questions,
 COALESCE(SUM(generic_question_count) FILTER(WHERE status='published'),0) AS generic_question_rows,
 COUNT(*) FILTER(WHERE status='published' AND original_reading_support) AS original_reading_support_lessons,
 COUNT(*) FILTER(WHERE status='published' AND marked_mvp_draft) AS published_marked_mvp_draft,
 COUNT(*) FILTER(WHERE status='published' AND three_objectives) AS lessons_with_three_objectives,
 COUNT(*) FILTER(WHERE status='published' AND three_vocabulary) AS lessons_with_three_vocabulary,
 COUNT(*) FILTER(WHERE status='published' AND plan_scheduled) AS published_marked_plan_scheduled
FROM lesson_quality
GROUP BY country_code,country_name,grade_number
ORDER BY country_code,grade_number;
