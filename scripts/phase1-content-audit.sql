-- Read-only Dadyoom phase 1 audit; main Dadyoom database only.
select status,count(*) from public.lessons group by status order by status;
select c.name_ar country,g.grade_number,u.title unit,l.id lesson_id,l.title lesson,l.status,
case when nullif(btrim(coalesce(l.content,'')),'') is null then 'NO_BODY_OR_BOOK_INDEX'
when nullif(btrim(coalesce(l.summary,'')),'') is null then 'MISSING_SUMMARY_REVIEW'
else 'EDITORIAL_REASON_UNKNOWN' end diagnostic_hint
from public.lessons l join public.units u on u.id=l.unit_id
join public.grades g on g.id=u.grade_id
join public.curricula cu on cu.id=g.curriculum_id
join public.countries c on c.id=cu.country_id
where l.status is distinct from 'published'
order by c.name_ar,g.grade_number,u.sort_order nulls last,u.title,l.sort_order nulls last,l.title,l.id;
select c.name_ar country,g.grade_number,u.id unit_id,u.title unit
from public.units u join public.grades g on g.id=u.grade_id
join public.curricula cu on cu.id=g.curriculum_id
join public.countries c on c.id=cu.country_id
where not exists(select 1 from public.lessons l where l.unit_id=u.id and l.status='published')
order by c.name_ar,g.grade_number,u.title;
select c.name_ar country,g.grade_number,g.id grade_id
from public.grades g join public.curricula cu on cu.id=g.curriculum_id
join public.countries c on c.id=cu.country_id
where not exists(select 1 from public.units u join public.lessons l on l.unit_id=u.id where u.grade_id=g.id and l.status='published')
order by c.name_ar,g.grade_number;