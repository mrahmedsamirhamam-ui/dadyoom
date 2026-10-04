-- Expand Tunisia secondary official Arabic textbook coverage from official CNP 2026-2027 lists.
with target as (
  select g.grade_number, u.id as unit_id
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  where c.code='TN'
    and cu.name_ar not ilike '%ضاديوم%'
    and g.grade_number between 10 and 13
    and u.unit_number=1
),
books(grade_number, lesson_number, title, code, slug) as (
  values
    (10,1,'آفاق أدبية — كتاب النصوص','201103','tn-official-g10-arabic-201103'),
    (10,2,'كتاب النصوص — رياضة','201104','tn-official-g10-arabic-201104'),
    (11,1,'عيون الأدب — الجزء الأول','201202','tn-official-g11-arabic-201202'),
    (11,2,'عيون الأدب — الجزء الثاني','201203','tn-official-g11-arabic-201203'),
    (11,3,'كتاب النصوص — رياضة','201281','tn-official-g11-arabic-201281'),
    (12,1,'علامات — كتاب النصوص','201302','tn-official-g12-arabic-201302'),
    (12,2,'نصوص — آداب','201321','tn-official-g12-arabic-201321'),
    (12,3,'كتاب النصوص — رياضة','201381','tn-official-g12-arabic-201381'),
    (13,1,'النصوص: رؤى — كافة الشعب ما عدا الآداب','201403','tn-official-g13-arabic-201403'),
    (13,2,'نصوص — آداب — الجزء الأول','201421','tn-official-g13-arabic-201421'),
    (13,3,'نصوص — آداب — الجزء الثاني','201422','tn-official-g13-arabic-201422'),
    (13,4,'كتاب العربية — رياضة','201481','tn-official-g13-arabic-201481')
)
insert into public.lessons (
  unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,status,is_free,estimated_minutes
)
select
  t.unit_id,b.title,b.slug,b.lesson_number,b.lesson_number,'reading',
  'عقدة تغطية رسمية تمثل كتاب اللغة العربية المعتمد في القائمة الرسمية للمركز الوطني البيداغوجي التونسي للعام الدراسي 2026-2027. الرمز الرسمي: ' || b.code || '. هذا العنوان يمثل كتابًا رسميًا/مسارًا رسميًا وليس اسم درس مفترض.',
  'published',false,40
from target t
join books b using (grade_number)
on conflict (unit_id, lesson_number)
do update set
  title=excluded.title,
  slug=excluded.slug,
  sort_order=excluded.sort_order,
  lesson_type=excluded.lesson_type,
  summary=excluded.summary,
  status='published',
  updated_at=now();
