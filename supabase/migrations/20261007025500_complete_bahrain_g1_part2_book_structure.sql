-- Bahrain Grade 1 Arabic Part 2 — complete verified book structure.
-- Current 2026-2027 semester-2 teaching plan is not published as of the audit.
-- Therefore every row added here is official book content, NOT asserted as
-- scheduled current-year curriculum. The content/page map is grounded in the
-- official Ministry S2 plan for the same book plus live Edunet Part_2 assets.

update public.units u
set title='الجزء الثاني — الوحدة الثانية: ألعابنا وهواياتنا',
    description='محتوى كتاب براعم العربية — الجزء الثاني — الوحدة الثانية. محتوى كتاب رسمي؛ لا يعني أنه مقرر في خطة الفصل الثاني 2026-2027 قبل نشرها.',
    semester=2
from public.grades g
join public.curricula cur on cur.id=g.curriculum_id
join public.countries c on c.id=cur.country_id
where u.grade_id=g.id
  and c.code='BH'
  and cur.name_ar='اللغة العربية'
  and cur.academic_year='2026-2027'
  and g.grade_number=1
  and u.unit_number=202;

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
insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
select id,
       'الجزء الثاني — الوحدة الثالثة: بيئتنا وصحتنا',
       'محتوى كتاب براعم العربية — الجزء الثاني — الوحدة الثالثة. محتوى كتاب رسمي؛ لا يعني أنه مقرر في خطة الفصل الثاني 2026-2027 قبل نشرها.',
       203,203,2
from target_grade
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
    and g.grade_number=1
    and u.unit_number in (201,202,203)
),
book_items(unit_number,lesson_number,sort_order,title,lesson_type,summary,source_url,source_plan_page) as (
  values
  (201,101,1,'حرف (ص)','reading','محتوى كتاب براعم العربية — الجزء الثاني — حرف (ص).','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',2),
  (201,102,2,'حرف (ش)','reading','محتوى كتاب براعم العربية — الجزء الثاني — حرف (ش).','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',2),
  (201,190,90,'أعزز مكتسباتي — الوحدة الأولى','assessment','تعزيز مكتسبات الوحدة الأولى من كتاب براعم العربية — الجزء الثاني.','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',3),
  (201,191,91,'أنشودة الوحدة الأولى: بحرين يا أغلى وطن','listening','أنشودة الوحدة الأولى كما يثبتها المصدر الرسمي للكتاب.','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',3),
  (201,192,92,'قصة الوحدة الأولى: حمدان يزور مملكة البحرين','reading','قصة الوحدة الأولى — محتوى رقمي رسمي.','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',3),

  (202,106,1,'حرف (ق)','reading','محتوى كتاب براعم العربية — الجزء الثاني — حرف (ق).','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',3),
  (202,107,2,'الحرفان (ط-ز)','reading','محتوى كتاب براعم العربية — الجزء الثاني — الحرفان (ط-ز).','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',3),
  (202,9,4,'الدرس التاسع: حرف (ض)','reading','محتوى كتاب براعم العربية — الجزء الثاني — الدرس التاسع حرف (ض)، وله مورد EduNet حي مباشر.','https://www.edunet.bh/e_content/level_1/stage_1/subject_ID_1/Part_2/lessons/G1-Linguistic-structure-Thaa-W9-Ins/G1-Linguistic-structure-Thaa-W9-Ins.pdf',4),
  (202,290,90,'أعزز مكتسباتي — الوحدة الثانية','assessment','تعزيز مكتسبات الوحدة الثانية من كتاب براعم العربية — الجزء الثاني.','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',4),
  (202,291,91,'أنشودة الوحدة الثانية: هيا نقرأ','listening','أنشودة الوحدة الثانية كما يثبتها المصدر الرسمي للكتاب.','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',4),
  (202,292,92,'قصة الوحدة الثانية: فاطمة تحب القراءة','reading','قصة الوحدة الثانية — محتوى رقمي رسمي.','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',4),

  (203,110,1,'الحرفان (و-ث)','reading','محتوى كتاب براعم العربية — الجزء الثاني — الحرفان (و-ث).','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',4),
  (203,111,2,'الحرف (هـ)','reading','محتوى كتاب براعم العربية — الجزء الثاني — الحرف (هـ).','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',4),
  (203,112,3,'الحرفان (غ-ي)','reading','محتوى كتاب براعم العربية — الجزء الثاني — الحرفان (غ-ي).','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',4),
  (203,14,4,'الدرس الرابع عشر: حرف (ظ)','reading','محتوى كتاب براعم العربية — الجزء الثاني — الدرس الرابع عشر حرف (ظ)، وله مورد EduNet حي مباشر.','https://www.edunet.bh/e_content/level_1/stage_1/subject_ID_1/Part_2/lessons/G1-L14-Harf-Althaa-Aktashef-Alharf-W13%281%29/G1-L14-Harf-Althaa-Aktashef-Alharf-W13%281%29.pdf',5),
  (203,390,90,'أعزز مكتسباتي — الوحدة الثالثة','assessment','تعزيز مكتسبات الوحدة الثالثة من كتاب براعم العربية — الجزء الثاني.','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',5),
  (203,391,91,'أنشودة الوحدة الثالثة: في حينا حديقة','listening','أنشودة الوحدة الثالثة كما يثبتها المصدر الرسمي للكتاب.','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',5),
  (203,392,92,'قصة الوحدة الثالثة: كيف أحافظ على صحتي؟','reading','قصة الوحدة الثالثة — محتوى رقمي رسمي.','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',5)
)
insert into public.lessons(
  unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
  source_pdf_url,source_page_start,source_page_end,status,is_free,semester,
  official_content_scope
)
select tu.id,bi.title,bi.lesson_number,bi.sort_order,bi.lesson_type,
       bi.summary,
       'محتوى من كتاب رسمي. خطة الفصل الثاني 2026-2027 لم تُنشر حتى آخر مراجعة؛ لذلك لا يُعرض هذا العنصر على أنه مقرر حاليًا.',
       bi.source_url,bi.source_plan_page,bi.source_plan_page,
       'published',true,2,'official-book-unscheduled'
from book_items bi
join target_units tu on tu.unit_number=bi.unit_number
on conflict (unit_id,lesson_number)
do update set
  title=excluded.title,
  sort_order=excluded.sort_order,
  lesson_type=excluded.lesson_type,
  summary=excluded.summary,
  content=excluded.content,
  source_pdf_url=excluded.source_pdf_url,
  source_page_start=excluded.source_page_start,
  source_page_end=excluded.source_page_end,
  status='published',
  semester=2,
  official_content_scope='official-book-unscheduled',
  updated_at=now();

-- Normalize the already-verified direct Edunet parent lessons.
update public.lessons l
set official_content_scope='official-book-unscheduled',
    semester=2,
    updated_at=now()
from public.units u
join public.grades g on g.id=u.grade_id
join public.curricula cur on cur.id=g.curriculum_id
join public.countries c on c.id=cur.country_id
where l.unit_id=u.id
  and c.code='BH'
  and cur.name_ar='اللغة العربية'
  and cur.academic_year='2026-2027'
  and g.grade_number=1
  and u.unit_number in (201,202,203)
  and l.status='published';

with component_rows(unit_number,parent_key,activity_order,title,activity_type,book_start,book_end,plan_page) as (
  values
  (201,'حرف (ص)',201,'الاستماع','listening',8,10,2),
  (201,'حرف (ص)',202,'التحدث والقراءة','reading',11,17,2),
  (201,'حرف (ص)',203,'أكتشف الحرف','reading',17,21,2),
  (201,'حرف (ص)',204,'أتدرب','reading',22,23,2),
  (201,'حرف (ص)',205,'الكتابة: الخط والإملاء والتعبير','writing',24,25,2),

  (201,'حرف (ش)',201,'الاستماع','listening',26,28,2),
  (201,'حرف (ش)',202,'التحدث والقراءة','reading',29,34,2),
  (201,'حرف (ش)',203,'أكتشف الحرف','reading',34,38,2),
  (201,'حرف (ش)',204,'أتدرب','reading',39,40,2),
  (201,'حرف (ش)',205,'الكتابة: الخط والإملاء والتعبير','writing',41,42,2),

  (201,'الدرس الثالث: حرف (ك)',201,'الاستماع','listening',43,44,2),
  (201,'الدرس الثالث: حرف (ك)',202,'التحدث والقراءة','reading',45,50,2),
  (201,'الدرس الثالث: حرف (ك)',203,'أكتشف الحرف','reading',50,54,2),
  (201,'الدرس الثالث: حرف (ك)',204,'أتدرب','reading',55,55,2),
  (201,'الدرس الثالث: حرف (ك)',205,'الكتابة: الخط والإملاء والتعبير','writing',56,57,2),

  (201,'الدرس الرابع: حرفا (ف) و(أ)',201,'الاستماع','listening',58,59,2),
  (201,'الدرس الرابع: حرفا (ف) و(أ)',202,'التحدث والقراءة','reading',60,65,2),
  (201,'الدرس الرابع: حرفا (ف) و(أ)',203,'أكتشف الحرف','reading',65,71,3),
  (201,'الدرس الرابع: حرفا (ف) و(أ)',204,'أتدرب','reading',71,72,3),
  (201,'الدرس الرابع: حرفا (ف) و(أ)',205,'الكتابة: الخط والإملاء والتعبير','writing',73,74,3),

  (202,'حرف (ق)',201,'الاستماع','listening',87,89,3),
  (202,'حرف (ق)',202,'التحدث والقراءة','reading',90,94,3),
  (202,'حرف (ق)',203,'أكتشف الحرف','reading',95,98,3),
  (202,'حرف (ق)',204,'أتدرب','reading',99,100,3),
  (202,'حرف (ق)',205,'الكتابة: الخط والإملاء والتعبير','writing',101,102,3),

  (202,'الحرفان (ط-ز)',201,'الاستماع','listening',103,104,3),
  (202,'الحرفان (ط-ز)',202,'التحدث والقراءة','reading',105,109,3),
  (202,'الحرفان (ط-ز)',203,'أكتشف الحرف','reading',110,115,3),
  (202,'الحرفان (ط-ز)',204,'أتدرب','reading',116,117,3),
  (202,'الحرفان (ط-ز)',205,'الكتابة: الخط والإملاء والتعبير','writing',118,119,3),

  (202,'الدرس الثامن: حرفا (خ) و(ذ)',201,'الاستماع','listening',120,121,3),
  (202,'الدرس الثامن: حرفا (خ) و(ذ)',202,'التحدث والقراءة','reading',122,126,3),
  (202,'الدرس الثامن: حرفا (خ) و(ذ)',203,'أكتشف الحرف','reading',127,133,3),
  (202,'الدرس الثامن: حرفا (خ) و(ذ)',204,'أتدرب','reading',133,133,3),
  (202,'الدرس الثامن: حرفا (خ) و(ذ)',205,'الكتابة: الخط والإملاء والتعبير','writing',134,135,3),

  (202,'الدرس التاسع: حرف (ض)',201,'الاستماع','listening',136,137,4),
  (202,'الدرس التاسع: حرف (ض)',202,'التحدث والقراءة','reading',138,142,4),
  (202,'الدرس التاسع: حرف (ض)',203,'أكتشف الحرف','reading',143,145,4),
  (202,'الدرس التاسع: حرف (ض)',204,'أتدرب','reading',146,147,4),
  (202,'الدرس التاسع: حرف (ض)',205,'الكتابة: الخط والإملاء والتعبير','writing',148,149,4),

  (203,'الحرفان (و-ث)',201,'الاستماع','listening',159,161,4),
  (203,'الحرفان (و-ث)',202,'التحدث والقراءة','reading',162,166,4),
  (203,'الحرفان (و-ث)',203,'أكتشف الحرف','reading',167,174,4),
  (203,'الحرفان (و-ث)',204,'أتدرب','reading',175,176,4),
  (203,'الحرفان (و-ث)',205,'الكتابة: الخط والإملاء والتعبير','writing',177,178,4),

  (203,'الحرف (هـ)',201,'الاستماع','listening',179,180,4),
  (203,'الحرف (هـ)',202,'التحدث والقراءة','reading',181,184,4),
  (203,'الحرف (هـ)',203,'أكتشف الحرف','reading',185,189,4),
  (203,'الحرف (هـ)',204,'أتدرب','reading',189,189,4),
  (203,'الحرف (هـ)',205,'الكتابة: الخط والإملاء والتعبير','writing',190,191,4),

  (203,'الحرفان (غ-ي)',201,'الاستماع','listening',192,194,4),
  (203,'الحرفان (غ-ي)',202,'التحدث والقراءة','reading',195,200,4),
  (203,'الحرفان (غ-ي)',203,'أكتشف الحرف','reading',201,208,4),
  (203,'الحرفان (غ-ي)',204,'أتدرب','reading',209,211,5),
  (203,'الحرفان (غ-ي)',205,'الكتابة: الخط والإملاء والتعبير','writing',212,213,5),

  (203,'الدرس الرابع عشر: حرف (ظ)',201,'الاستماع','listening',214,215,5),
  (203,'الدرس الرابع عشر: حرف (ظ)',202,'التحدث والقراءة','reading',216,220,5),
  (203,'الدرس الرابع عشر: حرف (ظ)',203,'أكتشف الحرف','reading',221,225,5),
  (203,'الدرس الرابع عشر: حرف (ظ)',204,'أتدرب','reading',225,227,5),
  (203,'الدرس الرابع عشر: حرف (ظ)',205,'الكتابة: الخط والإملاء والتعبير','writing',228,229,5)
),
target as (
  select l.id as lesson_id,u.unit_number,l.title
  from public.lessons l
  join public.units u on u.id=l.unit_id
  join public.grades g on g.id=u.grade_id
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية'
    and cur.academic_year='2026-2027'
    and g.grade_number=1
    and u.unit_number in (201,202,203)
)
insert into public.lesson_activities(
  lesson_id,title,activity_type,instructions,content,activity_order,
  points,is_published,section,prompt,answer,is_required
)
select
  t.lesson_id,
  cr.title,
  cr.activity_type,
  'مكوّن رسمي من كتاب براعم العربية — الجزء الثاني. أرقام الصفحات هي صفحات الكتاب، والمصدر الرسمي يثبت بنية المحتوى؛ لا يعني ذلك أنه مقرر حاليًا في 2026-2027.',
  jsonb_build_object(
    'origin','BH_G1_PART2_COMPLETE_BOOK_COMPONENT',
    'official_plan_reference','https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',
    'official_plan_page',cr.plan_page,
    'book_page_start',cr.book_start,
    'book_page_end',cr.book_end,
    'semester',2,
    'schedule_status','official-book-unscheduled'
  ),
  cr.activity_order,
  0,true,'official_content',null,'{}'::jsonb,true
from component_rows cr
join target t
  on t.unit_number=cr.unit_number
 and t.title=cr.parent_key
where not exists (
  select 1 from public.lesson_activities la
  where la.lesson_id=t.lesson_id
    and la.activity_order=cr.activity_order
    and la.content->>'origin'='BH_G1_PART2_COMPLETE_BOOK_COMPONENT'
);
