alter table public.lessons
  add column if not exists semester smallint
  check (semester is null or semester between 1 and 3);

comment on column public.lessons.semester is
  'Official semester/term number when explicitly known from source or import metadata; NULL means not safely classified.';

update public.lessons
set semester = case
  when title ilike '%الفصل الأول%' or title ilike '%الفصل الدراسي الأول%' then 1
  when title ilike '%الفصل الثاني%' or title ilike '%الفصل الدراسي الثاني%' then 2
  when title ilike '%الفصل الثالث%' or title ilike '%الفصل الدراسي الثالث%' then 3
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

update public.lessons l
set semester=u.semester
from public.units u
where l.unit_id=u.id
  and l.semester is null
  and u.semester is not null;

update public.lessons l
set semester=1
from public.units u
join public.grades g on g.id=u.grade_id
join public.curricula cur on cur.id=g.curriculum_id
join public.countries c on c.id=cur.country_id
where l.unit_id=u.id
  and l.semester is null
  and c.code='JO'
  and cur.academic_year='2026-2027'
  and cur.name_ar ilike '%الصف الحادي عشر%الفصل الأول%';

update public.lessons l
set semester=2
from public.units u
join public.grades g on g.id=u.grade_id
join public.curricula cur on cur.id=g.curriculum_id
join public.countries c on c.id=cur.country_id
where l.unit_id=u.id
  and l.semester is null
  and c.code='OM'
  and cur.academic_year='2026-2027'
  and cur.name_ar ilike '%الصف الثاني عشر%المؤنس%الفصل الثاني%';

create index if not exists lessons_unit_semester_idx
on public.lessons(unit_id,semester);
