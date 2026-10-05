-- Oman G10/G11: keep only the current book-node activities published.
-- Historical generic activities remain stored but hidden.

with books as (
  select l.id
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  join public.lessons l on l.unit_id=u.id
  where c.code='OM'
    and cu.name_ar='اللغة العربية — المطابقة الرسمية العُمانية'
    and g.grade_number in (10,11)
    and l.status='published'
)
update public.lesson_activities a
set is_published=(
  a.title in ('تحديد الكتاب الرسمي','ربط المهارة بالمقرر','تطبيق أصلي')
)
from books b
where a.lesson_id=b.id;
