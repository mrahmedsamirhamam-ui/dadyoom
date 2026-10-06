-- Bahrain Grade 1 / Baraem Arabic / semester 1:
-- preserve every official internal lesson component from Edunet Plan1 as
-- structured lesson activities. These are components of the existing lessons,
-- not separate invented lessons.

with component_map(
  lesson_title,
  listening_start,listening_end,
  speaking_start,speaking_end,
  discover_start,discover_end,
  structures_start,structures_end,
  expression_start,expression_end
) as (
  values
  ('الدرس الأول: حرف (ب) (1)',8,9,10,14,15,18,18,20,21,21),
  ('الدرس الثاني: حرف (ب) (2)',22,23,24,28,28,31,31,33,34,34),
  ('الدرس الثالث: حرف (م)',35,36,37,41,41,44,45,47,48,48),
  ('الدرس الرابع: حرف (د)',49,50,51,55,56,59,59,60,61,61),
  ('الدرس السادس: حرف (ح)',68,69,70,73,74,77,77,80,81,81),
  ('الدرس السابع: حرف (ر)',82,83,84,88,88,92,93,95,96,96),
  ('الدرس الثامن: حرف (س)',97,98,99,103,104,107,107,108,109,109),
  ('الدرس التاسع: حرف (ل)',110,111,112,116,116,120,120,122,123,123),
  ('الدرس الحادي عشر: حرف (ج)',132,133,134,137,138,140,141,143,144,144),
  ('الدرس الثاني عشر: حرف (ن)',145,146,147,150,151,153,154,155,156,156),
  ('الدرس الثالث عشر: حرف (ع)',157,158,159,163,163,166,166,167,168,168),
  ('الدرس الرابع عشر: حرف (ت)',169,170,171,175,175,178,178,180,181,181)
),
target_lessons as (
  select
    l.id as lesson_id,
    l.title,
    cm.*
  from public.countries c
  join public.curricula cur
    on cur.country_id=c.id
   and cur.is_active
   and cur.name_ar='اللغة العربية'
   and cur.academic_year='2026-2027'
  join public.grades g
    on g.curriculum_id=cur.id
   and g.grade_number=1
  join public.units u on u.grade_id=g.id
  join public.lessons l
    on l.unit_id=u.id
   and l.status='published'
  join component_map cm on cm.lesson_title=l.title
  where c.code='BH'
),
components as (
  select lesson_id,100 as activity_order,'الاستماع'::text as title,'listening'::text as activity_type,
         listening_start as page_start,listening_end as page_end
  from target_lessons
  union all
  select lesson_id,101,'التحدث والقراءة','reading',speaking_start,speaking_end
  from target_lessons
  union all
  select lesson_id,102,'أكتشف الحرف','reading',discover_start,discover_end
  from target_lessons
  union all
  select lesson_id,103,'التراكيب اللغوية + الخط','writing',structures_start,structures_end
  from target_lessons
  union all
  select lesson_id,104,'التعبير','speaking',expression_start,expression_end
  from target_lessons
)
insert into public.lesson_activities (
  lesson_id,title,activity_type,instructions,content,activity_order,
  points,is_published,section,prompt,answer,is_required
)
select
  c.lesson_id,
  c.title,
  c.activity_type,
  'مكوّن رسمي من بنية الدرس في كتاب براعم العربية؛ يُعرض ضمن الدرس الأصلي ولا يُعامل كدرس مستقل.',
  jsonb_build_object(
    'origin','BH_EDUNET_PLAN1_OFFICIAL_COMPONENT_2026_2027',
    'source_url','https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf',
    'source_page_start',c.page_start,
    'source_page_end',c.page_end,
    'semester',1
  ),
  c.activity_order,
  0,
  true,
  'official_content',
  null,
  '{}'::jsonb,
  true
from components c
where not exists (
  select 1
  from public.lesson_activities la
  where la.lesson_id=c.lesson_id
    and la.activity_order=c.activity_order
    and la.content->>'origin'='BH_EDUNET_PLAN1_OFFICIAL_COMPONENT_2026_2027'
);
