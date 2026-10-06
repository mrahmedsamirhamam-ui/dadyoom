-- Bahrain technical/vocational secondary Arabic — verified S2 book components.
-- Grounded in the Ministry 2025-2026 official S2 Plan3 for Arab 802/804/806.
-- Current 2026-2027 S2 schedule is not published, so these remain book-only.

insert into public.curricula(country_id,name_ar,name_en,academic_year,description,is_active)
select c.id,
       'اللغة العربية — التعليم الفني والمهني — الجزء الثاني',
       'Bahrain Arabic technical/vocational Part 2',
       '2026-2027',
       'محتوى كتاب الجزء الثاني الموثق من خطة وزارة التربية والتعليم الرسمية للفصل الثاني 2025-2026؛ لا يعني جدولة 2026-2027 قبل نشر الخطة الحالية.',
       true
from public.countries c
where c.code='BH'
on conflict (country_id,name_ar,academic_year)
do update set description=excluded.description,is_active=true;

with cur as (
  select cur.id
  from public.curricula cur
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية — التعليم الفني والمهني — الجزء الثاني'
    and cur.academic_year='2026-2027'
)
insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
select cur.id,x.name_ar,x.name_en,x.grade_number,x.grade_number,true
from cur
cross join (values
  ('الصف الأول الثانوي — عرب 802','Grade 10 — Arab 802',10),
  ('الصف الثاني الثانوي — عرب 804','Grade 11 — Arab 804',11),
  ('الصف الثالث الثانوي — عرب 806','Grade 12 — Arab 806',12)
) as x(name_ar,name_en,grade_number)
on conflict (curriculum_id,name_ar)
do update set grade_number=excluded.grade_number,sort_order=excluded.sort_order,is_active=true;

with grades as (
  select g.id,g.grade_number
  from public.grades g
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية — التعليم الفني والمهني — الجزء الثاني'
    and cur.academic_year='2026-2027'
),
u(grade_number,unit_number,title) as (
  values
    (10,8022,'عرب 802 — الجزء الثاني'),
    (11,8042,'عرب 804 — الجزء الثاني'),
    (12,8062,'عرب 806 — الجزء الثاني')
)
insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
select g.id,u.title,
       'مكوّنات كتاب رسمي موثقة من خطة الوزارة للفصل الثاني 2025-2026؛ لا تعني الجدولة الحالية قبل نشر خطة S2 للعام 2026-2027.',
       u.unit_number,u.unit_number,2
from grades g join u on u.grade_number=g.grade_number
on conflict (grade_id,unit_number)
do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order,semester=2;

with target_units as (
  select g.grade_number,u.id,u.unit_number
  from public.units u
  join public.grades g on g.id=u.grade_id
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية — التعليم الفني والمهني — الجزء الثاني'
    and cur.academic_year='2026-2027'
),
items(grade_number,unit_number,lesson_number,sort_order,title,lesson_type,summary,plan_page) as (
  values
  (10,8022,1,1,'القراءة: الشباب بين الواقع والآمال','reading','عرب 802 ص 8-22.',2),
  (10,8022,2,2,'الظواهر اللغوية: الفعل المبني للمعلوم والفعل المبني للمجهول','grammar','عرب 802 ص 8-22.',2),
  (10,8022,3,3,'الإنتاج الكتابي: بناء الحوار الحجاجي','writing','إنتاج كتابي مثبت في الخطة الرسمية.',2),
  (10,8022,4,4,'القراءة: تحية للشباب - أحمد رفيق المهدوي','reading','عرب 802 ص 24-35.',2),
  (10,8022,5,5,'الظواهر اللغوية: الخبر والإنشاء (1)','grammar','عرب 802 ص 24-35.',2),
  (10,8022,6,6,'التواصل الشفوي: حوار تفاعلي حول العمل التطوعي','speaking','تواصل شفوي مثبت في الخطة الرسمية.',2),
  (10,8022,7,7,'القراءة: من أعاجيب أهل مرو','reading','عرب 802 ص 74-84.',2),
  (10,8022,8,8,'الظواهر اللغوية: التشبيه - أركانه وأنواعه','grammar','عرب 802 ص 74-84.',2),
  (10,8022,9,9,'الإنتاج الكتابي: تعليمات السلامة في الورشة','writing','إنتاج كتابي مثبت في الخطة الرسمية.',2),
  (10,8022,10,10,'القراءة: أعيني فيك الحيلة - ابن عبد ربه','reading','عرب 802 ص 86-98.',2),
  (10,8022,11,11,'الظواهر اللغوية: الخبر والإنشاء (2)','grammar','عرب 802 ص 86-98.',2),
  (10,8022,12,12,'التواصل الشفوي: حوار تفاعلي حول آداب الزيارة','speaking','تواصل شفوي مثبت في الخطة الرسمية.',2),

  (11,8042,1,1,'شرف العمل','reading','عرب 804 ص 8-12.',3),
  (11,8042,2,2,'الظواهر اللغوية: أساليب التوكيد بالنفي وأداة الاستثناء','grammar','عرب 804 ص 8-12.',3),
  (11,8042,3,3,'الإنتاج الكتابي: كتابة تعليمات عن السلامة في الورشة','writing','إنتاج كتابي مثبت في الخطة الرسمية.',3),
  (11,8042,4,4,'الحجاج بالسرد: الطبع والتطبع - ابن عبد ربه','reading','عرب 202 ص 6-23.',3),
  (11,8042,5,5,'على أبواب الرحلة الأولى','reading','عرب 804 ص 19-24.',3),
  (11,8042,6,6,'الظواهر اللغوية: جزم الفعل المضارع بلا الناهية','grammar','عرب 804 ص 19-24.',3),
  (11,8042,7,7,'الحجاج بالسرد: الفردية سوس ينخر المجتمع - خليل هنداوي','reading','عرب 202 ص 68-76.',3),
  (11,8042,8,8,'رسالة إلى ابني','reading','عرب 804 ص 44-50.',3),
  (11,8042,9,9,'الظواهر اللغوية: النعت والمنعوت','grammar','عرب 804 ص 44-50.',3),
  (11,8042,10,10,'الإنتاج الكتابي: مهارة التلخيص','writing','إنتاج كتابي مثبت في الخطة الرسمية.',3),

  (12,8062,1,1,'رحلة إلى البحرين','reading','عرب 806 ص 10-13.',4),
  (12,8062,2,2,'الظواهر اللغوية: تطبيق على أسلوب التفضيل','grammar','عرب 806 ص 10-13.',4),
  (12,8062,3,3,'الإنتاج الكتابي: كتابة التقرير وفق بيانات','writing','إنتاج كتابي مثبت في الخطة الرسمية.',4),
  (12,8062,4,4,'التعليق الصحفي: حديث في الحداثة - قمر الكيلاني','reading','عرب 302 ص 28-37.',4),
  (12,8062,5,5,'منظر الرياض','reading','عرب 806 ص 18-24.',4),
  (12,8062,6,6,'الظواهر اللغوية: أسلوب النداء وأسلوب التمني','grammar','عرب 806 ص 18-24.',4),
  (12,8062,7,7,'التعقيب الصحفي: اللغة العربية والفكر والعلم - أدونيس','reading','عرب 302 ص 53-57.',4),
  (12,8062,8,8,'الإنتاج الكتابي: المقالة الأدبية','writing','إنتاج كتابي مثبت في الخطة الرسمية.',4),
  (12,8062,9,9,'يموت الهوى مني','reading','عرب 806 ص 39-46.',4),
  (12,8062,10,10,'الظواهر اللغوية: بناء الفعل للمجهول','grammar','عرب 806 ص 39-46.',4)
)
insert into public.lessons(
  unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
  source_pdf_url,source_page_start,source_page_end,status,is_free,semester,official_content_scope
)
select tu.id,i.title,i.lesson_number,i.sort_order,i.lesson_type,i.summary,
       'مكوّن موثق من كتاب رسمي للتعليم الفني والمهني. المصدر التفصيلي خطة الوزارة الرسمية للفصل الثاني 2025-2026، ولا يعني جدولة 2026-2027.',
       'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan3.pdf',
       i.plan_page,i.plan_page,'published',true,2,'official-book-unscheduled'
from items i
join target_units tu on tu.grade_number=i.grade_number and tu.unit_number=i.unit_number
on conflict (unit_id,lesson_number)
do update set
  title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
  summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
  source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
  status='published',semester=2,official_content_scope='official-book-unscheduled',updated_at=now();

insert into public.secondary_track_curricula(secondary_track_id,curriculum_id,relation_type,is_default,notes)
select st.id,cur.id,'official',false,
       'Verified official Part-2 book content; current 2026-2027 S2 schedule not yet published.'
from public.secondary_tracks st
join public.countries c on c.code='BH' and c.code=st.country_code
join public.curricula cur on cur.country_id=c.id
 and cur.name_ar='اللغة العربية — التعليم الفني والمهني — الجزء الثاني'
 and cur.academic_year='2026-2027'
where st.country_code='BH'
  and st.academic_year='2026-2027'
  and st.track_name_ar='التعليم الفني والمهني'
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=false,notes=excluded.notes;

insert into public.secondary_track_units(secondary_track_id,unit_id,relation_type,notes)
select st.id,u.id,'official',
       'Official Part-2 book content; not a current-year S2 scheduling claim.'
from public.secondary_tracks st
join public.countries c on c.code='BH' and c.code=st.country_code
join public.curricula cur on cur.country_id=c.id
 and cur.name_ar='اللغة العربية — التعليم الفني والمهني — الجزء الثاني'
 and cur.academic_year='2026-2027'
join public.grades g on g.curriculum_id=cur.id and g.grade_number=any(st.grades)
join public.units u on u.grade_id=g.id
where st.country_code='BH'
  and st.academic_year='2026-2027'
  and st.track_name_ar='التعليم الفني والمهني'
on conflict (secondary_track_id,unit_id)
do update set relation_type='official',notes=excluded.notes;

update public.secondary_track_grade_terms gt
set detail_status='partial-imported',
    audited_at=current_date,
    notes=coalesce(gt.notes,'') || ' Verified technical/vocational Part-2 book components imported from Ministry Plan3 2025-2026; current 2026-2027 S2 schedule remains unpublished.',
    updated_at=now()
from public.secondary_tracks st
where gt.secondary_track_id=st.id
  and st.country_code='BH'
  and st.academic_year='2026-2027'
  and st.track_name_ar='التعليم الفني والمهني'
  and gt.academic_year='2026-2027'
  and gt.semester=2;
