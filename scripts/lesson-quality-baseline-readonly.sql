-- READ ONLY. Never use this script for curriculum import or migration.
-- Real production tables inspected: public.lessons, questions, lesson_activities.
WITH act AS (
 SELECT lesson_id,
  bool_or(activity_type='reading' AND is_published) AS has_reading,
  bool_or(activity_type='writing' AND is_published) AS has_writing,
  bool_or(activity_type='listening' AND is_published) AS has_listening,
  bool_or(activity_type='speaking' AND is_published) AS has_speaking,
  bool_or(is_published AND (section ILIKE '%pre%' OR section ILIKE '%قبلي%')) AS tagged_pre,
  bool_or(is_published AND (section ILIKE '%post%' OR section ILIKE '%بعدي%')) AS tagged_post,
  count(*) FILTER(WHERE is_published) AS activity_count
 FROM public.lesson_activities GROUP BY lesson_id
), q AS (SELECT lesson_id,count(*) AS n FROM public.questions GROUP BY lesson_id)
SELECT
 count(*) AS all_lessons,
 count(*) FILTER(WHERE l.status='published') AS published,
 count(*) FILTER(WHERE l.status='draft') AS drafts,
 count(*) FILTER(WHERE l.status='published' AND coalesce(q.n,0)=0) AS published_without_question_records,
 count(*) FILTER(WHERE l.status='published' AND coalesce(a.activity_count,0)=0) AS published_without_published_activities,
 count(*) FILTER(WHERE l.status='published' AND NOT (
  coalesce(a.has_reading,false) AND coalesce(a.has_writing,false) AND
  coalesce(a.has_listening,false) AND coalesce(a.has_speaking,false)
 )) AS published_fewer_than_four_tagged_activity_skill_types,
 count(*) FILTER(WHERE l.status='published' AND NOT coalesce(a.tagged_pre,false)) AS published_without_explicitly_tagged_pre_section,
 count(*) FILTER(WHERE l.status='published' AND NOT coalesce(a.tagged_post,false)) AS published_without_explicitly_tagged_post_section
FROM public.lessons l LEFT JOIN act a ON a.lesson_id=l.id LEFT JOIN q ON q.lesson_id=l.id;

-- IMPORTANT LIMITATIONS:
-- Activity types / sections are structural hints, NOT verified mastery or competence.
-- 'assessment' alone does not establish a post-test; a quiz may exist elsewhere.
-- No trustworthy canonical audio asset registry mapped to lessons was verified.
-- Do not report 'missing recordings' or real four-skill coverage without asset and human audits.
