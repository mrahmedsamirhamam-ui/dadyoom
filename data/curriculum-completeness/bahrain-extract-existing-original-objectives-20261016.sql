-- Bahrain: materialize the explicitly written original learning goal.
-- Idempotent; does NOT publish drafts, modify lesson text, certify official
-- textbooks, infer missing objectives, or change student learning records.
-- This is a structured-data repair, not a national-curriculum completeness flag.
WITH eligible AS (
  SELECT l.id,
    btrim(split_part(split_part(l.content, 'أهداف التعلم:', 2), chr(10), 1)) AS objective
  FROM public.lessons l
  JOIN public.units u ON u.id = l.unit_id
  JOIN public.grades g ON g.id = u.grade_id
  JOIN public.curricula c ON c.id = g.curriculum_id
  JOIN public.countries co ON co.id = c.country_id
  WHERE co.code = 'BH'
    AND c.is_active IS TRUE
    AND l.status = 'published'
    AND (l.learning_objectives IS NULL OR l.learning_objectives = '[]'::jsonb)
    AND position('أهداف التعلم:' in l.content) > 0
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
