-- Mauritania Grade 10 Arabic — detailed official 2025 IPN textbook TOC.
create temp table tmp_mr_g10(data jsonb) on commit drop;
insert into tmp_mr_g10 values ($json${"units":[{"number":1,"title":"القيم الإسلامية","lessons":["حقوق الجار","العطف","حقوق المرأة في الإسلام","المصدر الصناعي","بالأخاديد رسوم وخيم","اسم الآلة","أبو حنيفة وجاره السكير","التشبيه وأركانه","وصية أبي بكر الشقروي","البحر الكامل","مهارة كتابة القصاصة الصحفية"]},{"number":2,"title":"القيم الوطنية والإنسانية","lessons":["الاستقلال","التوكيد","الجاليات الموريتانية في الخارج","الأحرف المشبهة بليس","مئذنة البوح","الممنوع من الصرف","عند النجاشي","أقسام التشبيه","انتظار","البحر الوافر","مهارة كتابة تقرير"]},{"number":3,"title":"المجتمع والبيئة","lessons":["تزايد النمو السكاني","الجملة الواقعة فاعلًا أو نائب فاعل","وسائط التواصل الاجتماعي","الجملة الواقعة مفعولًا به","حنين إلى الربوع","المضاف إليه ما قبله","أزمة اقتصادية","الحقيقة والمجاز","التعاون (أتويزة)","الاستعارة التصريحية والمكنية","مهارة إنتاج نص حكائي"]},{"number":4,"title":"المجال الحضاري","lessons":["تطور الطب","جملة صلة الموصول","الاتصال السمعي البصري","الجناس","سجايا النبي صلى الله عليه وسلم","الطباق والمقابلة","في الطريق إلى الإسكندرية","البحر المتقارب","بين البدو والحضر","مهارة توسيع فكرة"]}],"source":"https://docs.bsimr.com/pdfs/secondaire1s/AR-4AS-M.pdf"}$json$::jsonb);

with c as (select id from public.countries where code='MR' limit 1)
insert into public.curricula(country_id,name_ar,name_en,academic_year,description,is_active)
select id,'اللغة العربية — موريتانيا — السنة الرابعة الإعدادية — المنهج الرسمي التفصيلي',
'Arabic — Mauritania Grade 10 / 4AS — Detailed Official','2026-2027',
'تفصيل كتاب اللغة العربية الرسمي للسنة الرابعة الإعدادية، طبعة 2025، من المعهد التربوي الوطني. عناوين وبنية فقط؛ محتوى ضاديوم أصلي.',true
from c on conflict (country_id,name_ar,academic_year) do update set description=excluded.description,is_active=true;

with cu as (
 select cu.id from public.countries c join public.curricula cu on cu.country_id=c.id
 where c.code='MR' and cu.name_ar='اللغة العربية — موريتانيا — السنة الرابعة الإعدادية — المنهج الرسمي التفصيلي'
 and cu.academic_year='2026-2027' limit 1)
insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
select id,'السنة الرابعة الإعدادية','4AS / Grade 10',10,10,true from cu
on conflict (curriculum_id,name_ar) do update set grade_number=10,sort_order=10,is_active=true;

with g as (
 select g.id from public.countries c join public.curricula cu on cu.country_id=c.id join public.grades g on g.curriculum_id=cu.id
 where c.code='MR' and cu.name_ar='اللغة العربية — موريتانيا — السنة الرابعة الإعدادية — المنهج الرسمي التفصيلي'
 and g.grade_number=10 limit 1),
defs as (select * from jsonb_to_recordset((select data->'units' from tmp_mr_g10)) as x(number int,title text,lessons jsonb))
insert into public.units(grade_id,title,description,unit_number,sort_order)
select g.id,d.title,'وحدة موثقة من فهرس كتاب اللغة العربية الرسمي 2025.',d.number,d.number from g cross join defs d
on conflict (grade_id,unit_number) do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order;

with g as (
 select g.id from public.countries c join public.curricula cu on cu.country_id=c.id join public.grades g on g.curriculum_id=cu.id
 where c.code='MR' and cu.name_ar='اللغة العربية — موريتانيا — السنة الرابعة الإعدادية — المنهج الرسمي التفصيلي'
 and g.grade_number=10 limit 1),
defs as (select * from jsonb_to_recordset((select data->'units' from tmp_mr_g10)) as x(number int,title text,lessons jsonb)),
expanded as (
 select d.number unit_number,d.title unit_title,ordinality::int lesson_number,lesson #>> '{}' lesson_title
 from defs d cross join lateral jsonb_array_elements(d.lessons) with ordinality as e(lesson,ordinality)),
tu as (select u.id,u.unit_number from public.units u join g on g.id=u.grade_id)
insert into public.lessons(unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,content,learning_objectives,vocabulary,instructions,source_pdf_url,status,is_free,estimated_minutes)
select tu.id,e.lesson_title,'mr-official-g10-u'||lpad(e.unit_number::text,2,'0')||'-l'||lpad(e.lesson_number::text,2,'0'),
e.lesson_number,e.lesson_number,'reading',
'درس مواءمة أصلي للعنوان الرسمي «'||e.lesson_title||'» ضمن وحدة «'||e.unit_title||'».',
'ارجع إلى الكتاب الرسمي لدراسة المادة، ثم استخدم ضاديوم للفهم والتحليل والتطبيق بمحتوى أصلي.',
jsonb_build_array('أن يحدد المتعلم الفكرة أو المهارة المركزية.','أن يحلل مثالًا أو شاهدًا مناسبًا.','أن يطبق ما تعلمه في استجابة أصلية.'),
jsonb_build_array(jsonb_build_object('word','الفكرة','meaning','المعنى أو المهارة المركزية.'),jsonb_build_object('word','التطبيق','meaning','استخدام المعرفة في موقف جديد.')),
jsonb_build_array('راجع عنوان الدرس في الكتاب الرسمي.','حدد الفكرة أو المهارة.','حلل مثالًا مناسبًا.','أنجز تطبيقًا قصيرًا من صياغتك.'),
(select data->>'source' from tmp_mr_g10),'published',true,35
from expanded e join tu on tu.unit_number=e.unit_number
on conflict (unit_id,lesson_number) do update set title=excluded.title,slug=excluded.slug,sort_order=excluded.sort_order,summary=excluded.summary,content=excluded.content,learning_objectives=excluded.learning_objectives,vocabulary=excluded.vocabulary,instructions=excluded.instructions,source_pdf_url=excluded.source_pdf_url,status='published',is_free=true,estimated_minutes=excluded.estimated_minutes,updated_at=now();

with tl as (
 select l.id,l.title,u.title unit_title from public.countries c join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id join public.units u on u.grade_id=g.id join public.lessons l on l.unit_id=u.id
 where c.code='MR' and cu.name_ar='اللغة العربية — موريتانيا — السنة الرابعة الإعدادية — المنهج الرسمي التفصيلي' and g.grade_number=10)
insert into public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
select tl.id,n,
case n when 1 then 'ما الخطوة الأولى لفهم «'||tl.title||'»؟' when 2 then 'ما الذي يثبت إتقان الدرس؟' else 'ما دور ضاديوم هنا؟' end,
'multiple_choice',
case n when 1 then jsonb_build_array(jsonb_build_object('id','a','text','تحديد الفكرة أو المهارة من المصدر الرسمي.'),jsonb_build_object('id','b','text','حفظ عنوان فقط.'),jsonb_build_object('id','c','text','تجاهل السياق.'))
when 2 then jsonb_build_array(jsonb_build_object('id','a','text','تحليل مثال أو شاهد ثم التطبيق.'),jsonb_build_object('id','b','text','نسخ إجابة جاهزة.'),jsonb_build_object('id','c','text','عدم تنفيذ تدريب.'))
else jsonb_build_array(jsonb_build_object('id','a','text','تقديم شرح وتدريب أصلي داعم للكتاب الرسمي.'),jsonb_build_object('id','b','text','إعادة نشر الكتاب.'),jsonb_build_object('id','c','text','استبدال المصدر الرسمي.')) end,
'a','الإجابة الصحيحة تركز على الفهم والتحليل والتطبيق الأصلي.',1
from tl cross join generate_series(1,3) n
on conflict (lesson_id,question_order) do update set question=excluded.question,options=excluded.options,correct_answer='a',explanation=excluded.explanation,updated_at=now();

with tl as (
 select l.id,l.title from public.countries c join public.curricula cu on cu.country_id=c.id join public.grades g on g.curriculum_id=cu.id
 join public.units u on u.grade_id=g.id join public.lessons l on l.unit_id=u.id
 where c.code='MR' and cu.name_ar='اللغة العربية — موريتانيا — السنة الرابعة الإعدادية — المنهج الرسمي التفصيلي' and g.grade_number=10)
insert into public.lesson_activities(lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required)
select tl.id,case n when 1 then 'فهم الدرس' when 2 then 'تحليل وتطبيق' else 'إنتاج قصير' end,
case n when 1 then 'reading' when 2 then 'multiple_choice' else 'writing' end,
case n when 1 then 'حدد الفكرة أو المهارة الرئيسة في «'||tl.title||'».' when 2 then 'حلل مثالًا مناسبًا وفسر علاقته بالدرس.' else 'اكتب استجابة قصيرة من صياغتك.' end,
jsonb_build_object('origin','DADYOOM_MR_G10_OFFICIAL','officialTitle',tl.title),n,5,true,
case n when 1 then 'understanding' when 2 then 'analysis' else 'production' end,null,'{}'::jsonb,true
from tl cross join generate_series(1,3) n
where not exists (select 1 from public.lesson_activities a where a.lesson_id=tl.id and a.activity_order=n and a.title=case n when 1 then 'فهم الدرس' when 2 then 'تحليل وتطبيق' else 'إنتاج قصير' end);
