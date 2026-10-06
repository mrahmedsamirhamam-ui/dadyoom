-- Bahrain Grade 2 Arabic Part 2 — complete official book content map.
-- Source: Ministry S2 content plan for the same official Part-2 books.
-- Current 2026-2027 S2 scheduling is deliberately NOT asserted.

with target_grade as (
  select g.id
  from public.grades g
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية'
    and cur.academic_year='2026-2027'
    and g.grade_number=2
  limit 1
),
units_data(unit_number,sort_order,title) as (
  values
    (211,211,'الجزء الثاني — الوحدة الأولى: وطني البحرين'),
    (212,212,'الجزء الثاني — الوحدة الثانية: البيئة في بلادي'),
    (213,213,'الجزء الثاني — الوحدة الثالثة: اختراعات وابتكارات')
)
insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
select tg.id,ud.title,
       'محتوى كتاب براعم العربية — الجزء الثاني. محتوى كتاب رسمي؛ لا يُعد مقررًا في خطة الفصل الثاني 2026-2027 قبل نشر الخطة الحالية.',
       ud.unit_number,ud.sort_order,2
from target_grade tg
cross join units_data ud
on conflict (grade_id,unit_number)
do update set title=excluded.title,description=excluded.description,semester=2;

with target_units as (
  select u.id,u.unit_number
  from public.units u
  join public.grades g on g.id=u.grade_id
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية'
    and cur.academic_year='2026-2027'
    and g.grade_number=2
    and u.unit_number in (211,212,213)
),
items(unit_number,lesson_number,sort_order,title,lesson_type,summary,book_start,book_end,plan_page) as (
  values
  (211,90,0,'الاستماع: اللاعب الماهر','listening','الاستماع الرسمي السابق للوحدة الأولى.',8,10,6),
  (211,1,1,'الدرس الأول: فرحة القرقاعون','reading','التحدث: مرحبًا يا رمضان — القراءة: فرحة القرقاعون.',10,16,6),
  (211,2,2,'الدرس الثاني: وطني الغالي','reading','التحدث: صرح الميثاق — القراءة: وطني الغالي (شعر).',17,22,6),
  (211,3,3,'الدرس الثالث: ما أجمل صناعة أجدادنا!','reading','التحدث: حرف أجدادي — القراءة: ما أجمل صناعة أجدادنا!',23,29,7),
  (211,4,4,'الدرس الرابع: معالم من بلادي','reading','التحدث: تراثنا الجميل — القراءة: معالم من بلادي.',30,37,7),

  (212,90,0,'الاستماع: نعمة الماء','listening','الاستماع الرسمي السابق للوحدة الثانية.',72,74,7),
  (212,5,1,'الدرس الخامس: نادر في المزرعة','reading','التحدث: بلادي الجميلة — القراءة: نادر في المزرعة.',40,47,7),
  (212,6,2,'الدرس السادس: النخلة','reading','التحدث: تمور بلادي — القراءة: النخلة (شعر).',48,52,8),
  (212,7,3,'الدرس السابع: جاسم والببغاء','reading','التحدث: بيئتنا الجميلة — القراءة: جاسم والببغاء.',53,61,8),
  (212,8,4,'الدرس الثامن: شجرة الحياة','reading','التحدث: البحر في بلادي — القراءة: شجرة الحياة.',62,68,8),

  (213,90,0,'الاستماع: المجرة الصغيرة','listening','الاستماع الرسمي السابق للوحدة الثالثة.',136,138,9),
  (213,9,1,'الدرس التاسع: الرجل الطائر','reading','التحدث: الطائر بين الأمس واليوم — القراءة: الرجل الطائر.',70,78,9),
  (213,10,2,'الدرس العاشر: سفينة الفضاء','reading','التحدث: اختراعات خالدة — القراءة: سفينة الفضاء.',79,84,9),
  (213,11,3,'الدرس الحادي عشر: المطعم الذكي','reading','التحدث: الإنسان الآلي في حياتنا — القراءة: المطعم الذكي.',85,91,10),
  (213,12,4,'الدرس الثاني عشر: اختراع ينير الطريق','reading','التحدث: اختراع الهاتف — القراءة: اختراع ينير الطريق.',92,98,10)
)
insert into public.lessons(
  unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
  source_pdf_url,source_page_start,source_page_end,status,is_free,semester,official_content_scope
)
select tu.id,i.title,i.lesson_number,i.sort_order,i.lesson_type,i.summary,
       'محتوى كتاب رسمي للجزء الثاني. خطة الفصل الثاني 2026-2027 غير منشورة حتى آخر مراجعة، لذا لا يُعرض هذا العنصر على أنه مقرر حاليًا.',
       'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',
       i.plan_page,i.plan_page,'published',true,2,'official-book-unscheduled'
from items i
join target_units tu on tu.unit_number=i.unit_number
on conflict (unit_id,lesson_number)
do update set
  title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
  summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
  source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
  status='published',semester=2,official_content_scope='official-book-unscheduled',updated_at=now();

with training(parent_lesson,unit_number,activity_order,title,activity_type,start_page,end_page,plan_page) as (
  values
  (1,211,201,'أثري لغتي / أميز الحروف والأصوات','reading',11,15,6),
  (1,211,202,'أحلل وأركب / أتدرب','reading',16,21,6),
  (1,211,203,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',22,25,6),
  (2,211,201,'أثري لغتي / أميز الحروف والأصوات','reading',26,29,6),
  (2,211,202,'أحلل وأركب / أتدرب','reading',29,34,6),
  (2,211,203,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',35,37,6),
  (3,211,201,'أثري لغتي / أميز الحروف والأصوات','reading',38,42,7),
  (3,211,202,'أحلل وأركب / أتدرب','reading',42,52,7),
  (3,211,203,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',53,55,7),
  (4,211,201,'أثري لغتي / أميز الحروف والأصوات','reading',56,60,7),
  (4,211,202,'أحلل وأركب / أتدرب','reading',60,67,7),
  (4,211,203,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',68,70,7),

  (5,212,201,'أثري لغتي / أميز الحروف والأصوات','reading',75,78,7),
  (5,212,202,'أحلل وأركب / أتدرب','reading',78,83,8),
  (5,212,203,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',84,87,8),
  (6,212,201,'أثري لغتي / أميز الحروف والأصوات','reading',88,91,8),
  (6,212,202,'أحلل وأركب / أتدرب','reading',91,99,8),
  (6,212,203,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',100,102,8),
  (7,212,201,'أثري لغتي / أميز الحروف والأصوات','reading',103,107,8),
  (7,212,202,'أحلل وأركب / أتدرب','reading',107,113,8),
  (7,212,203,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',114,117,8),
  (8,212,201,'أثري لغتي / أميز الحروف والأصوات','reading',118,122,9),
  (8,212,202,'أحلل وأركب / أتدرب','reading',122,129,9),
  (8,212,203,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',130,133,9),

  (9,213,201,'أثري لغتي / أميز الحروف والأصوات','reading',139,142,9),
  (9,213,202,'أحلل وأركب / أتدرب','reading',143,149,9),
  (9,213,203,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',150,153,9),
  (10,213,201,'أثري لغتي / أميز الحروف والأصوات','reading',154,158,9),
  (10,213,202,'أحلل وأركب / أتدرب','reading',158,162,9),
  (10,213,203,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',163,166,10),
  (11,213,201,'أثري لغتي / أميز الحروف والأصوات','reading',167,171,10),
  (11,213,202,'أحلل وأركب / أتدرب','reading',171,177,10),
  (11,213,203,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',178,180,10),
  (12,213,201,'أثري لغتي / أميز الحروف والأصوات','reading',181,183,10),
  (12,213,202,'أحلل وأركب / أتدرب','reading',183,187,10),
  (12,213,203,'أنسخ / أكتب ما يمليه المعلم / أنتج','writing',188,190,10)
),
parents as (
  select l.id as lesson_id,u.unit_number,l.lesson_number
  from public.lessons l
  join public.units u on u.id=l.unit_id
  join public.grades g on g.id=u.grade_id
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية'
    and cur.academic_year='2026-2027'
    and g.grade_number=2
    and u.unit_number in (211,212,213)
    and l.lesson_number between 1 and 12
)
insert into public.lesson_activities(
  lesson_id,title,activity_type,instructions,content,activity_order,
  points,is_published,section,prompt,answer,is_required
)
select p.lesson_id,t.title,t.activity_type,
       'تدريب رسمي من كتاب براعم العربية — التدريبات اللغوية الجزء الثاني. لا يُعد مجدولًا حاليًا لعام 2026-2027 قبل نشر الخطة.',
       jsonb_build_object(
         'origin','BH_G2_PART2_COMPLETE_BOOK_COMPONENT',
         'official_plan_reference','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',
         'official_plan_page',t.plan_page,
         'book_page_start',t.start_page,
         'book_page_end',t.end_page,
         'semester',2,
         'schedule_status','official-book-unscheduled'
       ),
       t.activity_order,0,true,'official_content',null,'{}'::jsonb,true
from training t
join parents p on p.unit_number=t.unit_number and p.lesson_number=t.parent_lesson
where not exists (
  select 1 from public.lesson_activities la
  where la.lesson_id=p.lesson_id
    and la.activity_order=t.activity_order
    and la.content->>'origin'='BH_G2_PART2_COMPLETE_BOOK_COMPONENT'
);
