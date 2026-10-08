-- Repair a copied grade-eight header in original supplementary lesson content.
-- Covers exactly Bahrain grades 9-12 and keeps all other lesson text, student
-- progress, source labels, activities, RLS, payments and official titles intact.
-- Safe to re-run: only the known erroneous phrase is replaced.
DO $dadyoom$
DECLARE
  changed_count integer;
  remaining integer;
BEGIN
  WITH corrected AS (
    UPDATE public.lessons l SET
      content = replace(
        l.content,
        'ضاديوم — إثراء مستقل أصلي للصف الثامن،',
        'ضاديوم — إثراء مستقل أصلي للصف ' ||
        CASE g.grade_number
          WHEN 9 THEN 'التاسع'
          WHEN 10 THEN 'العاشر'
          WHEN 11 THEN 'الحادي عشر'
          WHEN 12 THEN 'الثاني عشر'
        END || '،'
      ),
      updated_at = now()
    FROM public.units u
    JOIN public.grades g ON g.id = u.grade_id
    JOIN public.curricula cu ON cu.id = g.curriculum_id
    JOIN public.countries co ON co.id = cu.country_id
    WHERE l.unit_id = u.id
      AND co.code = 'BH'
      AND g.grade_number BETWEEN 9 AND 12
      AND l.content LIKE '%ضاديوم — إثراء مستقل أصلي للصف الثامن،%'
      AND (l.content LIKE 'ضاديوم — إثراء مستقل أصلي %'
           OR l.content LIKE 'ضاديوم — إثراء تعليمي أصلي معاد توظيفه %')
    RETURNING l.id
  )
  SELECT count(*) INTO changed_count FROM corrected;
  IF changed_count > 359 THEN
    RAISE EXCEPTION 'Refusing unexpected grade-label repair count: %', changed_count;
  END IF;
  SELECT count(*) INTO remaining
    FROM public.lessons l
    JOIN public.units u ON u.id = l.unit_id
    JOIN public.grades g ON g.id = u.grade_id
    JOIN public.curricula cu ON cu.id = g.curriculum_id
    JOIN public.countries co ON co.id = cu.country_id
    WHERE co.code = 'BH' AND g.grade_number BETWEEN 9 AND 12
      AND l.content LIKE '%ضاديوم — إثراء مستقل أصلي للصف الثامن،%';
  IF remaining <> 0 THEN
    RAISE EXCEPTION 'Some wrongly attributed grade-8 enrichment headers remain: %',remaining;
  END IF;
  RAISE NOTICE 'DADYOOM_GRADE_LABEL_REPAIR_PASS rows_updated=%',changed_count;
END
$dadyoom$;