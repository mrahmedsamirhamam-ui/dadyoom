-- Recover only the explicitly written goals already present in ORIGINAL
-- Bahrain lesson content. Safe to re-run: existing structured objectives never
-- overwritten. No publication, PDF attribution, student data or XP mutation.
-- 2026-10-16 verified effect: 507 published original records structured;
-- three book-reference cards intentionally remain without lesson objectives.
WITH eligible AS (
  SELECT l.id,
    CASE
      WHEN position('الهدف الأول:' in l.content)>0
       AND position('الهدف الثاني:' in l.content)>0
       AND position('الهدف الثالث:' in l.content)>0
      THEN jsonb_build_array(
        btrim(split_part(split_part(l.content,'الهدف الأول:',2),'الهدف الثاني:',1)),
        btrim(split_part(split_part(l.content,'الهدف الثاني:',2),'الهدف الثالث:',1)),
        btrim(split_part(split_part(l.content,'الهدف الثالث:',2),chr(10),1))
      )
      ELSE jsonb_build_array(btrim(CASE
        WHEN position('أهداف التعلم:' in l.content)>0
          THEN split_part(split_part(l.content,'أهداف التعلم:',2),chr(10),1)
        WHEN position('أهداف التعليم:' in l.content)>0
          THEN split_part(split_part(l.content,'أهداف التعليم:',2),chr(10),1)
        WHEN position('الأهداف التعليمية:' in l.content)>0
          THEN split_part(split_part(l.content,'الأهداف التعليمية:',2),chr(10),1)
        WHEN position('أهداف تعلم قابلة للقياس:' in l.content)>0
          THEN split_part(split_part(l.content,'أهداف تعلم قابلة للقياس:',2),chr(10),1)
        WHEN position('هدف تعلم واضح:' in l.content)>0
          THEN split_part(split_part(l.content,'هدف تعلم واضح:',2),chr(10),1)
        WHEN position('هدف التعلم:' in l.content)>0
          THEN split_part(split_part(l.content,'هدف التعلم:',2),chr(10),1)
        WHEN position('المهارة المستهدفة:' in l.content)>0
          THEN split_part(split_part(l.content,'المهارة المستهدفة:',2),chr(10),1)
        WHEN position('الأهداف:' in l.content)>0
          THEN split_part(split_part(l.content,'الأهداف:',2),chr(10),1)
        ELSE '' END))
    END AS objectives
  FROM public.lessons l
  JOIN public.units u ON u.id=l.unit_id
  JOIN public.grades g ON g.id=u.grade_id
  JOIN public.curricula c ON c.id=g.curriculum_id
  JOIN public.countries co ON co.id=c.country_id
  WHERE co.code='BH'
    AND c.is_active IS TRUE
    AND l.status='published'
    AND (l.learning_objectives IS NULL OR l.learning_objectives='[]'::jsonb)
    AND (
      l.content LIKE 'ضاديوم — إثراء مستقل أصلي%'
      OR l.content LIKE 'ضاديوم — إثراء تعليمي أصلي%'
      OR l.content LIKE 'ضاديوم — درس إثرائي أصلي%'
      OR l.content LIKE 'مادة إثرائية أصلية من ضاديوم%'
      OR l.content LIKE 'مادة تعليمية إثرائية أصلية من ضاديوم%'
      OR l.content LIKE 'دعم أصلي من ضاديوم%'
    )
),
updated AS (
  UPDATE public.lessons l SET learning_objectives=e.objectives
  FROM eligible e
  WHERE l.id=e.id
    AND jsonb_typeof(e.objectives)='array'
    AND jsonb_array_length(e.objectives) BETWEEN 1 AND 3
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(e.objectives) AS item(goal)
      WHERE length(btrim(item.goal)) NOT BETWEEN 20 AND 240
    )
  RETURNING l.id
)
SELECT count(*) AS updated_lessons FROM updated;
