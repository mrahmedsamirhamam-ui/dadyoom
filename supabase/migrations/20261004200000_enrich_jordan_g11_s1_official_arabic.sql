-- Jordan Grade 11 S1 Arabic detailed current official structure.
create temp table tmp_jo_g11_s1(data jsonb) on commit drop;
insert into tmp_jo_g11_s1 values ($json${"units":[{"number":1,"title":"من القيم الإنسانية في القرآن الكريم","lessons":["الاستماع","التحدث","القراءة","الكتابة","أبني لغتي"]},{"number":2,"title":"في حب الوطن","lessons":["الاستماع","التحدث","القراءة","الكتابة","أبني لغتي"]},{"number":3,"title":"أمراض العصر","lessons":["الاستماع","التحدث","القراءة","الكتابة","أبني لغتي"]},{"number":4,"title":"نحن والإعلام","lessons":["الاستماع","التحدث","القراءة","الكتابة","أبني لغتي"]},{"number":5,"title":"التعليم التقني بوابة المستقبل","lessons":["الاستماع","التحدث","القراءة","الكتابة","أبني لغتي"]}],"source":"https://nccd.gov.jo/ar/pages/TextBooksGrade/118","pdf":"https://nccd.gov.jo/EBV4.0/Root_Storage/AR/Arabic/2025/%D8%B9%D8%B1%D8%A8%D9%8A%206.7.2025/11/%D9%83%D8%AA%D8%A7%D8%A8%20%D8%A7%D9%84%D8%AD%D8%A7%D8%AF%D9%8A%20%D8%B9%D8%B4%D8%B1%20%D9%811%20%D8%A7%D8%B9%D8%A7%D8%AF%D8%A9%20%D8%B7%D8%A8%D8%A7%D8%B9%D8%A9%2025-5.pdf"}$json$::jsonb);

with c as (select id from public.countries where code='JO' limit 1)
insert into public.curricula(country_id,name_ar,name_en,academic_year,description,is_active)
select id,'اللغة العربية — الأردن — الصف الحادي عشر — الفصل الأول الرسمي التفصيلي',
'Arabic — Jordan Grade 11 — Semester 1 Detailed Official','2026-2027',
'تفصيل كتاب العربية لغتي للصف الحادي عشر، الفصل الأول، المنشور ضمن صفحة NCCD الحالية 2026-2027. العناوين والبنية فقط؛ المحتوى التعليمي أصلي.',true
from c
on conflict (country_id,name_ar,academic_year) do update
set description=excluded.description,is_active=true;

with cu as (
 select cu.id from public.countries c join public.curricula cu on cu.country_id=c.id
 where c.code='JO' and cu.name_ar='اللغة العربية — الأردن — الصف الحادي عشر — الفصل الأول الرسمي التفصيلي'
 and cu.academic_year='2026-2027' limit 1)
insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
select id,'الصف الحادي عشر — الفصل الأول','Grade 11 — Semester 1',11,11,true from cu
on conflict (curriculum_id,name_ar) do update set grade_number=11,sort_order=11,is_active=true;

with g as (
 select g.id from public.countries c join public.curricula cu on cu.country_id=c.id join public.grades g on g.curriculum_id=cu.id
 where c.code='JO' and cu.name_ar='اللغة العربية — الأردن — الصف الحادي عشر — الفصل الأول الرسمي التفصيلي'
 and g.grade_number=11 limit 1),
defs as (
 select * from jsonb_to_recordset((select data->'units' from tmp_jo_g11_s1))
 as x(number int,title text,lessons jsonb))
insert into public.units(grade_id,title,description,unit_number,sort_order)
select g.id,d.title,'وحدة من كتاب العربية لغتي الرسمي للصف الحادي عشر — الفصل الأول.',d.number,d.number
from g cross join defs d
on conflict (grade_id,unit_number) do update
set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order;

with g as (
 select g.id from public.countries c join public.curricula cu on cu.country_id=c.id join public.grades g on g.curriculum_id=cu.id
 where c.code='JO' and cu.name_ar='اللغة العربية — الأردن — الصف الحادي عشر — الفصل الأول الرسمي التفصيلي'
 and g.grade_number=11 limit 1),
defs as (
 select * from jsonb_to_recordset((select data->'units' from tmp_jo_g11_s1))
 as x(number int,title text,lessons jsonb)),
expanded as (
 select d.number unit_number,d.title unit_title,ordinality::int lesson_number, lesson #>> '{}' lesson_title
 from defs d cross join lateral jsonb_array_elements(d.lessons) with ordinality as e(lesson,ordinality)),
tu as (select u.id,u.unit_number from public.units u join g on g.id=u.grade_id)
insert into public.lessons(unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,content,
 learning_objectives,vocabulary,instructions,source_pdf_url,status,is_free,estimated_minutes)
select tu.id,e.lesson_title,
 'jo-official-g11-s1-u'||lpad(e.unit_number::text,2,'0')||'-l'||lpad(e.lesson_number::text,2,'0'),
 e.lesson_number,e.lesson_number,
 case e.lesson_title when 'الاستماع' then 'listening' when 'التحدث' then 'speaking'
 when 'الكتابة' then 'writing' else 'reading' end,
 'مهارة «'||e.lesson_title||'» ضمن الوحدة الرسمية «'||e.unit_title||'».',
 'محتوى تدريبي أصلي من ضاديوم يدعم مهارة «'||e.lesson_title||'» في سياق الوحدة «'||e.unit_title||'» دون إعادة نشر نص الكتاب.',
 jsonb_build_array('أن يفهم المتعلم هدف المهارة في سياق الوحدة.','أن يحلل أو يطبق نموذجًا مناسبًا.','أن ينتج استجابة أصلية وفق متطلبات المهارة.'),
 jsonb_build_array(jsonb_build_object('word','المهارة','meaning','الأداء اللغوي المستهدف.'),jsonb_build_object('word','السياق','meaning','موضوع الوحدة الذي تطبق فيه المهارة.')),
 jsonb_build_array('راجع عنوان الوحدة والمهارة.','نفذ تدريب الفهم أو التحليل.','أنجز تطبيقًا أصليًا وراجعه.'),
 (select data->>'pdf' from tmp_jo_g11_s1),'published',true,35
from expanded e join tu on tu.unit_number=e.unit_number
on conflict (unit_id,lesson_number) do update
set title=excluded.title,slug=excluded.slug,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
summary=excluded.summary,content=excluded.content,learning_objectives=excluded.learning_objectives,
vocabulary=excluded.vocabulary,instructions=excluded.instructions,source_pdf_url=excluded.source_pdf_url,status='published',
is_free=true,estimated_minutes=excluded.estimated_minutes,updated_at=now();

with tl as (
 select l.id,l.title,u.title unit_title from public.countries c
 join public.curricula cu on cu.country_id=c.id join public.grades g on g.curriculum_id=cu.id
 join public.units u on u.grade_id=g.id join public.lessons l on l.unit_id=u.id
 where c.code='JO' and cu.name_ar='اللغة العربية — الأردن — الصف الحادي عشر — الفصل الأول الرسمي التفصيلي' and g.grade_number=11)
insert into public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
select tl.id,n,
 case n when 1 then 'ما الهدف الرئيس من مهارة «'||tl.title||'» في وحدة «'||tl.unit_title||'»؟'
 when 2 then 'ما أفضل دليل على إتقان هذه المهارة؟' else 'كيف تستخدم ضاديوم في هذا الجزء؟' end,
 'multiple_choice',
 case n when 1 then jsonb_build_array(jsonb_build_object('id','a','text','فهم المهارة وتطبيقها في سياق الوحدة.'),jsonb_build_object('id','b','text','حفظ العنوان فقط.'),jsonb_build_object('id','c','text','تجاهل السياق.'))
 when 2 then jsonb_build_array(jsonb_build_object('id','a','text','إنتاج استجابة صحيحة ومفسرة.'),jsonb_build_object('id','b','text','نسخ مثال جاهز.'),jsonb_build_object('id','c','text','عدم تنفيذ التطبيق.'))
 else jsonb_build_array(jsonb_build_object('id','a','text','للتدريب الأصلي الداعم للكتاب الرسمي.'),jsonb_build_object('id','b','text','لاستبدال الكتاب الرسمي.'),jsonb_build_object('id','c','text','لنسخ الكتاب كاملًا.')) end,
 'a','الإجابة الصحيحة تركز على الفهم والتطبيق الأصلي مع بقاء الكتاب الرسمي مرجعًا.',1
from tl cross join generate_series(1,3) n
on conflict (lesson_id,question_order) do update set question=excluded.question,options=excluded.options,correct_answer='a',explanation=excluded.explanation,updated_at=now();

with tl as (
 select l.id,l.title from public.countries c join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id join public.units u on u.grade_id=g.id join public.lessons l on l.unit_id=u.id
 where c.code='JO' and cu.name_ar='اللغة العربية — الأردن — الصف الحادي عشر — الفصل الأول الرسمي التفصيلي' and g.grade_number=11)
insert into public.lesson_activities(lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required)
select tl.id,
 case n when 1 then 'فهم المهارة' when 2 then 'تطبيق المهارة' else 'إنتاج أصلي' end,
 case n when 1 then 'reading' when 2 then 'multiple_choice' else 'writing' end,
 case n when 1 then 'حدد المطلوب في مهارة «'||tl.title||'».'
 when 2 then 'نفذ تطبيقًا مناسبًا للمهارة.' else 'أنشئ استجابة قصيرة من صياغتك.' end,
 jsonb_build_object('origin','DADYOOM_JO_G11_S1_OFFICIAL','skill',tl.title),n,5,true,
 case n when 1 then 'understanding' when 2 then 'application' else 'production' end,null,'{}'::jsonb,true
from tl cross join generate_series(1,3) n
where not exists (
 select 1 from public.lesson_activities a where a.lesson_id=tl.id and a.activity_order=n
 and a.title=case n when 1 then 'فهم المهارة' when 2 then 'تطبيق المهارة' else 'إنتاج أصلي' end
);
