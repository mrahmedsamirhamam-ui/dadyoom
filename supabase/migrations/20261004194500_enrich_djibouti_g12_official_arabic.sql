-- Djibouti Grade 12 Arabic — verified readable detailed CRIPEN programme.
-- Official programme: https://cripen.dj/wp-content/uploads/2025/05/Programme-compile-Terminale.pdf
-- Four OCR-unresolved official slots are intentionally not guessed.

create temp table if not exists tmp_dj_g12(data jsonb) on commit drop;
truncate tmp_dj_g12;
insert into tmp_dj_g12(data) values ($json${"units":[{"number":1,"title":"المجال الاجتماعي","topics":["الزواج (الزواج المبكر، اختيار الشريك، شروط الزواج، الزواج والعمل)","التضامن الاجتماعي","هجرة العقول"]},{"number":2,"title":"المجال القيمي الإنساني","topics":["احترام الآخر","السلم والحرب في عالمنا المعاصر","دور المجتمع المدني في التنمية"]},{"number":3,"title":"الثقافة والعولمة","topics":["العولمة والثقافة","الأصالة والمعاصرة","ثقافة القراءة"]},{"number":4,"title":"المجال الأدبي — الأدب الرومنطيقي","topics":["إيليا أبو ماضي","معروف الرصافي","علي محمود طه"]},{"number":5,"title":"المجال الرياضي","topics":["كأس العالم","الرياضة والإعلام","الرياضة والمنشطات"]},{"number":6,"title":"المجال العلمي","topics":["الطاقة النظيفة","الآلة والإنسان","غزو الفضاء"]},{"number":7,"title":"المجال الصحي","topics":["التغذية والصحة","الوقاية من الأمراض","تطور الأساليب الطبية"]},{"number":8,"title":"المجال الأدبي — النثر العربي المعاصر","topics":["القصة القصيرة","السيرة الذاتية","المسرحية"]},{"number":9,"title":"المجال البيئي","topics":["خطر النفايات على البيئة","انحسار الغطاء النباتي","الاهتمام العالمي بالبيئة"]},{"number":10,"title":"المجال الاقتصادي","topics":["الثروة الحيوانية","الفساد وأثره على الاقتصاد"]},{"number":11,"title":"الإعلام والاتصال","topics":["شبكات التواصل الاجتماعي","الإعلام بين الإخبار والتأثير"]},{"number":12,"title":"المجال الأدبي — الشعر الوطني","topics":["أبو القاسم الشابي","محمود درويش"]},{"number":13,"title":"النحو والصرف","topics":["مصادر الأفعال المجردة (الثلاثية والرباعية)","مصادر الأفعال المزيدة","معاني صيغ الفعل المزيد","المدح والذم (بئس ونعم)","التصغير","الأدوات المحددة لأزمنة الأفعال","النسبة","العدد والمعدود"]},{"number":14,"title":"البلاغة","topics":["المقابلة","الجناس","الطباق"]}],"source":"https://cripen.dj/wp-content/uploads/2025/05/Programme-compile-Terminale.pdf"}$json$::jsonb);

with c as (select id from public.countries where code='DJ' limit 1)
insert into public.curricula(country_id,name_ar,name_en,academic_year,description,is_active)
select id,
 'اللغة العربية — جيبوتي — Terminale — البرنامج الرسمي التفصيلي الموثق',
 'Arabic — Djibouti Terminale — Verified Detailed Official Programme',
 '2026-2027',
 'برنامج العربية الرسمي للصف الثالث الثانوي من MENFOP/CRIPEN. أُدخلت الموضوعات المقروءة بوضوح فقط؛ أربع خانات غير واضحة لم تُخمن.',
 true
from c
on conflict (country_id,name_ar,academic_year)
do update set description=excluded.description,is_active=true;

with cu as (
 select cu.id from public.countries c join public.curricula cu on cu.country_id=c.id
 where c.code='DJ'
   and cu.name_ar='اللغة العربية — جيبوتي — Terminale — البرنامج الرسمي التفصيلي الموثق'
   and cu.academic_year='2026-2027' limit 1
)
insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
select id,'Terminale / الصف الثالث الثانوي','Terminale / Grade 12',12,12,true
from cu
on conflict (curriculum_id,name_ar)
do update set grade_number=12,sort_order=12,is_active=true;

with g as (
 select g.id from public.countries c
 join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id
 where c.code='DJ'
   and cu.name_ar='اللغة العربية — جيبوتي — Terminale — البرنامج الرسمي التفصيلي الموثق'
   and g.grade_number=12 limit 1
), defs as (
 select * from jsonb_to_recordset((select data->'units' from tmp_dj_g12))
 as x(number int,title text,topics jsonb)
)
insert into public.units(grade_id,title,description,unit_number,sort_order)
select g.id,d.title,'مجال/فرع موثق ومقروء بوضوح من البرنامج الرسمي للعربية في Terminale.',d.number,d.number
from g cross join defs d
on conflict (grade_id,unit_number)
do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order;

with g as (
 select g.id from public.countries c
 join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id
 where c.code='DJ'
   and cu.name_ar='اللغة العربية — جيبوتي — Terminale — البرنامج الرسمي التفصيلي الموثق'
   and g.grade_number=12 limit 1
), defs as (
 select * from jsonb_to_recordset((select data->'units' from tmp_dj_g12))
 as x(number int,title text,topics jsonb)
), expanded as (
 select d.number unit_number,d.title unit_title,
 row_number() over(partition by d.number order by ordinality)::int lesson_number,
 topic #>> '{}' lesson_title
 from defs d
 cross join lateral jsonb_array_elements(d.topics) with ordinality as e(topic,ordinality)
), tu as (
 select u.id,u.unit_number from public.units u join g on g.id=u.grade_id
)
insert into public.lessons(
 unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,content,
 learning_objectives,vocabulary,instructions,source_pdf_url,status,is_free,estimated_minutes
)
select tu.id,e.lesson_title,
 'dj-official-g12-u'||lpad(e.unit_number::text,2,'0')||'-l'||lpad(e.lesson_number::text,2,'0'),
 e.lesson_number,e.lesson_number,'reading',
 'موضوع موثق من برنامج Terminale الرسمي «'||e.lesson_title||'» ضمن «'||e.unit_title||'».',
 'يستخدم هذا الدرس عنوان البرنامج الرسمي كنقطة انطلاق ويقدم شرحًا وتطبيقات أصلية من ضاديوم دون نسخ نصوص المصدر.',
 jsonb_build_array(
  'أن يحدد المتعلم الفكرة أو المهارة المركزية في الموضوع.',
  'أن يحلل المتعلم مثالًا أو شاهدًا مناسبًا.',
  'أن يوظف المتعلم ما تعلمه في استجابة أصلية.'
 ),
 jsonb_build_array(
  jsonb_build_object('word','الفكرة','meaning','المعنى أو المهارة المركزية في الموضوع.'),
  jsonb_build_object('word','التحليل','meaning','تفكيك الفكرة وربطها بأدلتها أو أمثلتها.'),
  jsonb_build_object('word','التطبيق','meaning','توظيف المعرفة في موقف جديد.')
 ),
 jsonb_build_array(
  'راجع عنوان الموضوع في البرنامج الرسمي.',
  'حدد الفكرة أو المهارة الرئيسة.',
  'حلل مثالًا مناسبًا.',
  'أنجز تطبيقًا قصيرًا من صياغتك.'
 ),
 (select data->>'source' from tmp_dj_g12),
 'published',true,40
from expanded e join tu on tu.unit_number=e.unit_number
on conflict (unit_id,lesson_number)
do update set title=excluded.title,slug=excluded.slug,sort_order=excluded.sort_order,
 summary=excluded.summary,content=excluded.content,learning_objectives=excluded.learning_objectives,
 vocabulary=excluded.vocabulary,instructions=excluded.instructions,source_pdf_url=excluded.source_pdf_url,
 status='published',is_free=true,estimated_minutes=excluded.estimated_minutes,updated_at=now();

with tl as (
 select l.id,l.title,u.title unit_title
 from public.countries c
 join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id
 join public.units u on u.grade_id=g.id
 join public.lessons l on l.unit_id=u.id
 where c.code='DJ'
 and cu.name_ar='اللغة العربية — جيبوتي — Terminale — البرنامج الرسمي التفصيلي الموثق'
 and g.grade_number=12
)
insert into public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
select tl.id,q.n,
 case q.n
  when 1 then 'ما الخطوة الأولى الأنسب لدراسة «'||tl.title||'»؟'
  when 2 then 'ما الذي يثبت فهمك للموضوع ضمن «'||tl.unit_title||'»؟'
  else 'ما دور ضاديوم في هذا الموضوع؟' end,
 'multiple_choice',
 case q.n
  when 1 then jsonb_build_array(
   jsonb_build_object('id','a','text','تحديد الفكرة أو المهارة وربطها بالسياق.'),
   jsonb_build_object('id','b','text','حفظ إجابة بلا فهم.'),
   jsonb_build_object('id','c','text','تجاهل الأمثلة.'))
  when 2 then jsonb_build_array(
   jsonb_build_object('id','a','text','تفسير مثال أو شاهد وتطبيق الفكرة.'),
   jsonb_build_object('id','b','text','نسخ العنوان فقط.'),
   jsonb_build_object('id','c','text','إعادة عبارة محفوظة.'))
  else jsonb_build_array(
   jsonb_build_object('id','a','text','دعم البرنامج الرسمي بشرح وتدريب أصلي.'),
   jsonb_build_object('id','b','text','إعادة نشر المصدر.'),
   jsonb_build_object('id','c','text','استبدال المنهج الوطني.'))
 end,
 'a',
 case q.n
  when 1 then 'الفهم يبدأ بتحديد الفكرة أو المهارة في سياقها.'
  when 2 then 'التحليل والتطبيق يبرهنان على الفهم.'
  else 'ضاديوم يدعم المنهج الرسمي بمحتوى أصلي.' end,
 1
from tl cross join generate_series(1,3) q(n)
on conflict (lesson_id,question_order)
do update set question=excluded.question,question_type=excluded.question_type,options=excluded.options,
correct_answer=excluded.correct_answer,explanation=excluded.explanation,points=excluded.points,updated_at=now();

with tl as (
 select l.id,l.title
 from public.countries c
 join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id
 join public.units u on u.grade_id=g.id
 join public.lessons l on l.unit_id=u.id
 where c.code='DJ'
 and cu.name_ar='اللغة العربية — جيبوتي — Terminale — البرنامج الرسمي التفصيلي الموثق'
 and g.grade_number=12
)
insert into public.lesson_activities(
 lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required
)
select tl.id,
 case a.n when 1 then 'فهم الموضوع' when 2 then 'تحليل وتطبيق' else 'إنتاج قصير' end,
 case a.n when 1 then 'reading' when 2 then 'multiple_choice' else 'writing' end,
 case a.n
  when 1 then 'حدد الفكرة أو المهارة الرئيسة في «'||tl.title||'».'
  when 2 then 'اختر مثالًا أو شاهدًا مناسبًا وفسر علاقته بالموضوع.'
  else 'اكتب استجابة قصيرة من صياغتك تطبق فيها ما تعلمته.' end,
 jsonb_build_object('origin','DADYOOM_DJ_G12_OFFICIAL_PROGRAMME','officialTitle',tl.title),
 a.n,5,true,
 case a.n when 1 then 'understanding' when 2 then 'analysis' else 'production' end,
 null,'{}'::jsonb,true
from tl cross join generate_series(1,3) a(n)
where not exists (
 select 1 from public.lesson_activities x
 where x.lesson_id=tl.id and x.activity_order=a.n
 and x.title=case a.n when 1 then 'فهم الموضوع' when 2 then 'تحليل وتطبيق' else 'إنتاج قصير' end
);
