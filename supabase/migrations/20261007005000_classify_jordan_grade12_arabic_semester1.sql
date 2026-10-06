-- Jordan Grade 12 Arabic: classify only lessons/units whose official NCCD
-- source explicitly points to first-semester books for 2026-2027.

update public.lessons l
set semester = 1,
    updated_at = now()
from public.units u
join public.grades g on g.id = u.grade_id
join public.curricula cur on cur.id = g.curriculum_id
join public.countries c on c.id = cur.country_id
where l.unit_id = u.id
  and c.code = 'JO'
  and cur.name_ar = 'اللغة العربية — المطابقة الرسمية الأردنية'
  and g.grade_number = 12
  and l.status = 'published'
  and l.semester is null
  and (
    l.source_pdf_url like '%/2026-2027%book/arabic/G12/1/%'
    or l.source_pdf_url like '%C12P1%'
  );

update public.units u
set semester = 1,
    updated_at = now()
from public.grades g
join public.curricula cur on cur.id = g.curriculum_id
join public.countries c on c.id = cur.country_id
where u.grade_id = g.id
  and c.code = 'JO'
  and cur.name_ar = 'اللغة العربية — المطابقة الرسمية الأردنية'
  and g.grade_number = 12
  and u.semester is null
  and exists (
    select 1
    from public.lessons l
    where l.unit_id = u.id
      and l.status = 'published'
  )
  and not exists (
    select 1
    from public.lessons l
    where l.unit_id = u.id
      and l.status = 'published'
      and coalesce(l.semester, 0) <> 1
  );

update public.secondary_tracks
set last_audited_date = date '2026-10-06',
    updated_at = now()
where country_code = 'JO'
  and academic_year = '2026-2027'
  and is_active;
