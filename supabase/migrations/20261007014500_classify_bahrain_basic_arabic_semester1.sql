-- Bahrain basic education grades 1-9:
-- the imported official Arabic lesson counts exactly match the verified
-- 2026-2027 semester-1 curriculum packs derived from Edunet Plan1.
-- Classify only the official Bahrain Arabic curriculum; Dadyoom supporting
-- content remains unclassified/supporting.

update public.lessons l
set semester = 1,
    updated_at = now()
from public.units u
join public.grades g on g.id = u.grade_id
join public.curricula cur on cur.id = g.curriculum_id
join public.countries c on c.id = cur.country_id
where l.unit_id = u.id
  and c.code = 'BH'
  and cur.name_ar = 'اللغة العربية'
  and cur.academic_year = '2026-2027'
  and g.grade_number between 1 and 9
  and l.status = 'published'
  and l.semester is null;

update public.units u
set semester = 1
from public.grades g
join public.curricula cur on cur.id = g.curriculum_id
join public.countries c on c.id = cur.country_id
where u.grade_id = g.id
  and c.code = 'BH'
  and cur.name_ar = 'اللغة العربية'
  and cur.academic_year = '2026-2027'
  and g.grade_number between 1 and 9
  and u.semester is null
  and exists (
    select 1
    from public.lessons l
    where l.unit_id = u.id
      and l.status = 'published'
      and l.semester = 1
  );
