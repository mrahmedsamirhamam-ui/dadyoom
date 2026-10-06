-- Bahrain Grade 3 Arabic Part 2 — complete official book content map.
-- Current 2026-2027 S2 plan is not published; content remains book-only/unscheduled.

with target_grade as (
  select g.id
  from public.grades g
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH' and cur.name_ar='اللغة العربية'
    and cur.academic_year='2026-2027' and g.grade_number=3
  limit 1
),
units_data(unit_number,sort_order,title) as (
  values
    (221,221,'الجزء الثاني — الوحدة الأولى: في حب الوطن'),
    (222,222,'الجزء الثاني — الوحدة الثانية: البيئة والصحة'),
    (223,223,'الجزء الثاني — الوحدة الثالثة: مشاهد من الطفولة')
)
insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
select tg.id,ud.title,
       'محتوى كتاب براعم العربية — الجزء الثاني. محتوى كتاب رسمي غير مجدول حاليًا لعام 2026-2027 حتى نشر خطة الفصل الثاني.',
       ud.unit_number,ud.sort_order,2
from target_grade tg cross join units_data ud
on conflict (grade_id,unit_number)
do update set title=excluded.title,description=excluded.description,semester=2;

with target_units as (
  select u.id,u.unit_number
  from public.units u
  join public.grades g on g.id=u.grade_id
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH' and cur.name_ar='اللغة العربية'
    and cur.academic_year='2026-2027' and g.grade_number=3
    and u.unit_number in (221,222,223)
),
items(unit_number,lesson_number,sort_order,title,lesson_type,summary,book_start,book_end,plan_page) as (
  values
  (221,90,0,'الاستماع: مزرعتي','listening','نص الاستماع الرسمي السابق للوحدة الأولى.',8,13,10),
  (221,1,1,'الدرس الأول: نداء الواجب (1)','reading','قراءة: نداء الواجب (1).',11,21,10),
  (221,2,2,'الدرس الثاني: نداء الواجب (2)','reading','قراءة: نداء الواجب (2).',22,32,10),
  (221,3,3,'الدرس الثالث: صباح الخير يا وطني','reading','قصيدة صباح الخير يا وطني — للحفظ كاملة.',33,41,10),
  (221,4,4,'الدرس الرابع: حرف خالدة','reading','قراءة: حرف خالدة.',42,51,11),

  (222,90,0,'الاستماع: الإنسان يقطع أشجار الغابة','listening','نص الاستماع الرسمي السابق للوحدة الثانية.',50,54,11),
  (222,5,1,'الدرس الخامس: معًا نحفظ بيئتنا (1)','reading','قراءة: معًا نحفظ بيئتنا (1).',55,65,11),
  (222,6,2,'الدرس السادس: معًا نحفظ بيئتنا (2)','reading','قراءة: معًا نحفظ بيئتنا (2).',66,75,11),
  (222,7,3,'الدرس السابع: شكوى الفراشة','reading','شكوى الفراشة — للحفظ من (1) إلى (8).',76,83,11),
  (222,8,4,'الدرس الثامن: البلاستيك والصحة','reading','قراءة: البلاستيك والصحة.',84,93,12),

  (223,90,0,'الاستماع: ما أجمل اللعب في ساحة الحي!','listening','نص الاستماع الرسمي السابق للوحدة الثالثة.',90,94,12),
  (223,9,1,'الدرس التاسع: ذكريات من أيام الطفولة (1)','reading','قراءة: ذكريات من أيام الطفولة (1).',97,105,13),
  (223,10,2,'الدرس العاشر: ذكريات من أيام الطفولة (2)','reading','قراءة: ذكريات من أيام الطفولة (2).',106,115,13),
  (223,11,3,'الدرس الحادي عشر: مرح الطفولة','reading','مرح الطفولة — للحفظ من (1) إلى (6).',116,122,14),
  (223,12,4,'الدرس الثاني عشر: طفولة مبدعة','reading','قراءة: طفولة مبدعة.',123,132,14)
)
insert into public.lessons(
  unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
  source_pdf_url,source_page_start,source_page_end,status,is_free,semester,official_content_scope
)
select tu.id,i.title,i.lesson_number,i.sort_order,i.lesson_type,i.summary,
       'محتوى كتاب رسمي للجزء الثاني. لا يُعرض على أنه مقرر في 2026-2027 قبل نشر خطة الفصل الثاني الحالية.',
       'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',
       i.plan_page,i.plan_page,'published',true,2,'official-book-unscheduled'
from items i join target_units tu on tu.unit_number=i.unit_number
on conflict (unit_id,lesson_number)
do update set title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
  summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
  source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
  status='published',semester=2,official_content_scope='official-book-unscheduled',updated_at=now();

with training(parent_lesson,unit_number,activity_order,title,activity_type,start_page,end_page,plan_page) as (
  values
  (1,221,201,'أتدرب','reading',14,15,10),(1,221,202,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',16,20,10),
  (2,221,201,'أتدرب','reading',21,22,10),(2,221,202,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',23,30,10),
  (3,221,201,'أتدرب','reading',31,33,10),(3,221,202,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',34,39,11),
  (4,221,201,'أتدرب','reading',40,44,11),(4,221,202,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',45,48,11),

  (5,222,201,'أتدرب','reading',55,58,11),(5,222,202,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',59,63,11),
  (6,222,201,'أتدرب','reading',64,66,11),(6,222,202,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',66,69,11),
  (7,222,201,'أتدرب','reading',70,74,12),(7,222,202,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',75,78,12),
  (8,222,201,'أتدرب','reading',79,82,12),(8,222,202,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',83,87,12),

  (9,223,201,'أتدرب','reading',95,97,13),(9,223,202,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',98,103,13),
  (10,223,201,'أتدرب','reading',104,107,13),(10,223,202,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',108,114,14),
  (11,223,201,'أتدرب','reading',115,118,14),(11,223,202,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',119,124,14),
  (12,223,201,'أتدرب','reading',125,127,14),(12,223,202,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',128,132,14)
),
parents as (
  select l.id as lesson_id,u.unit_number,l.lesson_number
  from public.lessons l
  join public.units u on u.id=l.unit_id
  join public.grades g on g.id=u.grade_id
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH' and cur.name_ar='اللغة العربية'
    and cur.academic_year='2026-2027' and g.grade_number=3
    and u.unit_number in (221,222,223) and l.lesson_number between 1 and 12
)
insert into public.lesson_activities(
  lesson_id,title,activity_type,instructions,content,activity_order,
  points,is_published,section,prompt,answer,is_required
)
select p.lesson_id,t.title,t.activity_type,
       'تدريب رسمي من كتاب التدريبات اللغوية — الجزء الثاني. الجدولة الحالية منفصلة حتى نشر خطة 2026-2027.',
       jsonb_build_object('origin','BH_G3_PART2_COMPLETE_BOOK_COMPONENT',
         'official_plan_reference','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',
         'official_plan_page',t.plan_page,'book_page_start',t.start_page,'book_page_end',t.end_page,
         'semester',2,'schedule_status','official-book-unscheduled'),
       t.activity_order,0,true,'official_content',null,'{}'::jsonb,true
from training t join parents p on p.unit_number=t.unit_number and p.lesson_number=t.parent_lesson
where not exists (
  select 1 from public.lesson_activities la
  where la.lesson_id=p.lesson_id and la.activity_order=t.activity_order
    and la.content->>'origin'='BH_G3_PART2_COMPLETE_BOOK_COMPONENT'
);
