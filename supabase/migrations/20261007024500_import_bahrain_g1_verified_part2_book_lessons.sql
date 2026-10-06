-- Bahrain Grade 1 / official Arabic book Part 2.
-- Only lesson identities directly verified from Edunet Part_2 lesson PDFs
-- are inserted here. They are NOT asserted as scheduled in the current
-- 2026-2027 semester-2 plan, because that plan is not published yet.

with target_grade as (
  select g.id
  from public.grades g
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية'
    and cur.academic_year='2026-2027'
    and g.grade_number=1
  limit 1
)
insert into public.units (
  grade_id,title,description,unit_number,sort_order,semester
)
select
  tg.id,
  'الجزء الثاني — الوحدة الأولى: وطننا',
  'محتوى كتاب براعم العربية — الجزء الثاني. البنود هنا من الكتاب الرسمي، ولا تعني أن خطة الفصل الثاني 2026-2027 منشورة.',
  201,
  201,
  2
from target_grade tg
on conflict (grade_id,unit_number)
do update set
  title=excluded.title,
  description=excluded.description,
  semester=2;

with target_grade as (
  select g.id
  from public.grades g
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية'
    and cur.academic_year='2026-2027'
    and g.grade_number=1
  limit 1
)
insert into public.units (
  grade_id,title,description,unit_number,sort_order,semester
)
select
  tg.id,
  'الجزء الثاني — وحدة: العناية وهواياتنا',
  'محتوى كتاب براعم العربية — الجزء الثاني. البنود هنا من الكتاب الرسمي، ولا تعني أن خطة الفصل الثاني 2026-2027 منشورة.',
  202,
  202,
  2
from target_grade tg
on conflict (grade_id,unit_number)
do update set
  title=excluded.title,
  description=excluded.description,
  semester=2;

with target_units as (
  select u.id,u.unit_number
  from public.units u
  join public.grades g on g.id=u.grade_id
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية'
    and cur.academic_year='2026-2027'
    and g.grade_number=1
    and u.unit_number in (201,202)
),
book_lessons(
  unit_number,lesson_number,title,summary,source_url
) as (
  values
  (
    201,
    3,
    'الدرس الثالث: حرف (ك)',
    'درس موثق مباشرة من موارد EduNet لكتاب براعم العربية — الجزء الثاني — وحدة وطننا. تم التحقق من مكوّن «أكتشف الحرف (ك)».',
    'https://www.edunet.bh/e_content/level_1/stage_1/subject_ID_1/Part_2/lessons/letter-K---aktashif-alharaf%281%29/letter-K---aktashif-alharaf%281%29.pdf'
  ),
  (
    201,
    4,
    'الدرس الرابع: حرفا (ف) و(أ)',
    'درس موثق مباشرة من موارد EduNet لكتاب براعم العربية — الجزء الثاني — وحدة وطننا. تم التحقق من مكوّن «أكتشف الحرف (ف) و(أ)».',
    'https://www.edunet.bh/e_content/level_1/stage_1/subject_ID_1/Part_2/lessons/Ershadat-aktashef-f-a/Ershadat-aktashef-f-a.pdf'
  ),
  (
    202,
    8,
    'الدرس الثامن: حرفا (خ) و(ذ)',
    'درس موثق مباشرة من موارد EduNet لكتاب براعم العربية — الجزء الثاني — وحدة العناية وهواياتنا. تم التحقق من مكوّن «أكتشف الحرف (خ) و(ذ)».',
    'https://www.edunet.bh/e_content/level_1/stage_1/subject_ID_1/Part_2/lessons/Ershadat-Aktashef-5a2-wa-Thal/Ershadat-Aktashef-5a2-wa-Thal.pdf'
  )
)
insert into public.lessons (
  unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
  source_pdf_url,status,is_free,semester,official_content_scope
)
select
  tu.id,
  bl.title,
  bl.lesson_number,
  bl.lesson_number,
  'reading',
  bl.summary,
  'هذا عنصر من كتاب براعم العربية الرسمي — الجزء الثاني. يعرض ضاديوم هوية الدرس ومصدره الرسمي كما تم التحقق منه، بينما تبقى حالة المقرر الحالي منفصلة حتى تنشر وزارة التربية والتعليم خطة الفصل الثاني 2026-2027.',
  bl.source_url,
  'published',
  true,
  2,
  'official-book-unscheduled'
from book_lessons bl
join target_units tu on tu.unit_number=bl.unit_number
on conflict (unit_id,lesson_number)
do update set
  title=excluded.title,
  sort_order=excluded.sort_order,
  lesson_type=excluded.lesson_type,
  summary=excluded.summary,
  content=excluded.content,
  source_pdf_url=excluded.source_pdf_url,
  status='published',
  semester=2,
  official_content_scope='official-book-unscheduled',
  updated_at=now();

with verified as (
  select
    l.id as lesson_id,
    l.source_pdf_url
  from public.lessons l
  join public.units u on u.id=l.unit_id
  join public.grades g on g.id=u.grade_id
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية'
    and cur.academic_year='2026-2027'
    and g.grade_number=1
    and u.unit_number in (201,202)
    and l.lesson_number in (3,4,8)
)
insert into public.lesson_activities (
  lesson_id,title,activity_type,instructions,content,activity_order,
  points,is_published,section,prompt,answer,is_required
)
select
  v.lesson_id,
  'أكتشف الحرف — المصدر الرسمي',
  'reading',
  'مكوّن رسمي موثق من مورد EduNet المباشر للدرس.',
  jsonb_build_object(
    'origin','BH_EDUNET_G1_PART2_VERIFIED_COMPONENT',
    'source_url',v.source_pdf_url,
    'semester',2,
    'schedule_status','official-book-unscheduled'
  ),
  100,
  0,
  true,
  'official_content',
  null,
  '{}'::jsonb,
  true
from verified v
where not exists (
  select 1
  from public.lesson_activities la
  where la.lesson_id=v.lesson_id
    and la.content->>'origin'='BH_EDUNET_G1_PART2_VERIFIED_COMPONENT'
);
