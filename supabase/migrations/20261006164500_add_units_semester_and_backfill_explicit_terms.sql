alter table public.units
  add column if not exists semester smallint
  check (semester is null or semester between 1 and 3);

comment on column public.units.semester is
  'Official semester/term number when explicitly known from the source; NULL means not safely classified.';

update public.units
set semester = case
  when title ilike '%الفصل الأول%' then 1
  when title ilike '%الفصل الدراسي الأول%' then 1
  when title ilike '%الفصل الثاني%' then 2
  when title ilike '%الفصل الدراسي الثاني%' then 2
  when title ilike '%الفصل الثالث%' then 3
  when title ilike '%الفصل الدراسي الثالث%' then 3
  else semester
end
where semester is null
  and (
    title ilike '%الفصل الأول%'
    or title ilike '%الفصل الدراسي الأول%'
    or title ilike '%الفصل الثاني%'
    or title ilike '%الفصل الدراسي الثاني%'
    or title ilike '%الفصل الثالث%'
    or title ilike '%الفصل الدراسي الثالث%'
  );

update public.units u
set semester = case
  when cur.name_ar ilike '%الفصل الأول%' or cur.name_ar ilike '%الفصل الدراسي الأول%' then 1
  when cur.name_ar ilike '%الفصل الثاني%' or cur.name_ar ilike '%الفصل الدراسي الثاني%' then 2
  when cur.name_ar ilike '%الفصل الثالث%' or cur.name_ar ilike '%الفصل الدراسي الثالث%' then 3
  else u.semester
end
from public.grades g
join public.curricula cur on cur.id=g.curriculum_id
where u.grade_id=g.id
  and u.semester is null
  and (
    cur.name_ar ilike '%الفصل الأول%'
    or cur.name_ar ilike '%الفصل الدراسي الأول%'
    or cur.name_ar ilike '%الفصل الثاني%'
    or cur.name_ar ilike '%الفصل الدراسي الثاني%'
    or cur.name_ar ilike '%الفصل الثالث%'
    or cur.name_ar ilike '%الفصل الدراسي الثالث%'
  );

update public.units u
set semester=1
from public.grades g
join public.curricula cur on cur.id=g.curriculum_id
join public.countries c on c.id=cur.country_id
where u.grade_id=g.id
  and c.code='BH'
  and cur.academic_year='2026-2027'
  and cur.name_ar='اللغة العربية'
  and g.grade_number between 10 and 12
  and u.semester is null;

create index if not exists units_grade_semester_idx
on public.units(grade_id,semester);
