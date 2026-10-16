-- Structure only explicit goals in already-published, independent Dadyoom
-- originals in Bahrain, across ALL known goal-heading formats in one query.
-- Re-runnable: empty target field prevents duplicate writes.
-- No official textbook certification or publication-status change.
WITH eligible AS (
  SELECT l.id,
    btrim(
      CASE
        WHEN position('أهداف التعلم:' in l.content) > 0
          THEN split_part(split_part(l.content, 'أهداف التعلم:', 2), chr(10), 1)
        WHEN position('أهداف التعليم:' in l.content) > 0
          THEN split_part(split_part(l.content, 'أهداف التعليم:', 2), chr(10), 1)
        WHEN position('الأهداف التعليمية:' in l.content) > 0
          THEN split_part(split_part(l.content, 'الأهداف التعليمية:', 2), chr(10), 1)
        ELSE ''
      END
    ) AS objective
  FROM public.lessons l
  JOIN public.units u ON u.id = l.unit_id
  JOIN public.grades g ON g.id = u.grade_id
  JOIN public.curricula c ON c.id = g.curriculum_id
  JOIN public.countries co ON co.id = c.country_id
  WHERE co.code = 'BH'
    AND c.is_active IS TRUE
    AND l.status = 'published'
    AND (l.learning_objectives IS NULL OR l.learning_objectives = '[]'::jsonb)
    AND (
      position('أهداف التعلم:' in l.content) > 0
      OR position('أهداف التعليم:' in l.content) > 0
      OR position('الأهداف التعليمية:' in l.content) > 0
    )
    AND (
      l.content LIKE 'ضاديوم — إثراء مستقل أصلي%'
      OR l.content LIKE 'ضاديوم — إثراء تعليمي أصلي%'
      OR l.content LIKE 'مادة إثرائية أصلية من ضاديوم%'
      OR l.content LIKE 'مادة تعليمية إثرائية أصلية من ضاديوم%'
      OR l.content LIKE 'دعم أصلي من ضاديوم%'
    )
),
updated AS (
  UPDATE public.lessons l
  SET learning_objectives = jsonb_build_array(e.objective)
  FROM eligible e
  WHERE l.id = e.id
    AND length(e.objective) BETWEEN 20 AND 240
  RETURNING l.id
)
SELECT count(*) AS updated_lessons FROM updated;
