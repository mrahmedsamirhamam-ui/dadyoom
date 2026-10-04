-- Djibouti Grade 10 Arabic — detailed official CRIPEN programme.
-- Official programme: https://cripen.dj/wp-content/uploads/2025/05/Programmes-compile-seconde.pdf
-- Only official programme headings/topics are retained; Dadyoom learning content is original.

create temp table if not exists tmp_dj_g10(data jsonb) on commit drop;
truncate tmp_dj_g10;
insert into tmp_dj_g10(data) values ($json${"units":[{"number":1,"title":"المجال الاجتماعي","topics":["الأسرة","المخدرات","التدخين"]},{"number":2,"title":"المجال الثقافي","topics":["عادات وتقاليد","المطالعة","المسرح"]},{"number":3,"title":"المجال الصحي","topics":["الوقاية","الأمراض المعدية","الأمراض المزمنة"]},{"number":4,"title":"المجال الإنساني","topics":["حقوق الإنسان","حقوق الطفل","حقوق المرأة"]},{"number":5,"title":"المجال البيئي","topics":["التلوث البيئي","مقاومة التصحر","مشكلة المياه"]},{"number":6,"title":"المجال الفني والمهني","topics":["العمل","الحرف اليدوية","العلاقات المهنية"]},{"number":7,"title":"المجال الرياضي","topics":["الرياضة والصحة","الرياضة والعنف","رياضات وشخصيات"]},{"number":8,"title":"مجال القيم","topics":["التعلق بالوطن","المسؤولية","التسامح"]},{"number":9,"title":"مجال الإعلام","topics":["الصحف والمجلات","الإعلام المرئي والسمعي","الإنترنت"]},{"number":10,"title":"المجال الاقتصادي","topics":["مصادر الطاقة","وسائل الإنتاج","التجارة"]},{"number":11,"title":"النحو","topics":["المعارف (مراجعة)","المبني والمعرب (مراجعة)","الضمائر المتصلة والمنفصلة","أدوات الاستفهام","الأفعال المتعدية واللازمة وتعدية الفعل اللازم","أدوات النفي","المبني للمعلوم والمبني للمجهول","أدوات الشرط الجازمة","المفعول لأجله","المجرد والمزيد"]},{"number":12,"title":"البلاغة","topics":["الخبر والإنشاء وأنواع الإنشاء","التشبيه","الحقيقة والمجاز"]},{"number":13,"title":"الإملاء","topics":["رسم التنوين","رسم التاء في آخر الكلمة","همزة الوصل والقطع"]}],"source":"https://cripen.dj/wp-content/uploads/2025/05/Programmes-compile-seconde.pdf"}$json$::jsonb);

with c as (select id from public.countries where code='DJ' limit 1)
insert into public.curricula(country_id,name_ar,name_en,academic_year,description,is_active)
select id,
 'اللغة العربية — جيبوتي — Seconde — البرنامج الرسمي التفصيلي',
 'Arabic — Djibouti Seconde — Detailed Official Programme',
 '2026-2027',
 'برنامج العربية الرسمي التفصيلي للصف الأول الثانوي من MENFOP/CRIPEN. تحتفظ ضاديوم بالعناوين والبنية فقط وتنتج الشرح والأنشطة بنفسها.',
 true
from c
on conflict (country_id,name_ar,academic_year)
do update set description=excluded.description,is_active=true;

with cu as (
 select cu.id from public.countries c join public.curricula cu on cu.country_id=c.id
 where c.code='DJ'
   and cu.name_ar='اللغة العربية — جيبوتي — Seconde — البرنامج الرسمي التفصيلي'
   and cu.academic_year='2026-2027' limit 1
)
insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
select id,'Seconde / الصف الأول الثانوي','Seconde / Grade 10',10,10,true
from cu
on conflict (curriculum_id,name_ar)
do update set grade_number=10,sort_order=10,is_active=true;

with g as (
 select g.id from public.countries c
 join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id
 where c.code='DJ'
   and cu.name_ar='اللغة العربية — جيبوتي — Seconde — البرنامج الرسمي التفصيلي'
   and g.grade_number=10 limit 1
), defs as (
 select * from jsonb_to_recordset((select data->'units' from tmp_dj_g10))
 as x(number int,title text,topics jsonb)
)
insert into public.units(grade_id,title,description,unit_number,sort_order)
select g.id,d.title,'مجال/فرع موثق من البرنامج الرسمي للغة العربية للصف الأول الثانوي في جيبوتي.',d.number,d.number
from g cross join defs d
on conflict (grade_id,unit_number)
do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order;

with g as (
 select g.id from public.countries c
 join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id
 where c.code='DJ'
   and cu.name_ar='اللغة العربية — جيبوتي — Seconde — البرنامج الرسمي التفصيلي'
   and g.grade_number=10 limit 1
), defs as (
 select * from jsonb_to_recordset((select data->'units' from tmp_dj_g10))
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
 'dj-official-g10-u'||lpad(e.unit_number::text,2,'0')||'-l'||lpad(e.lesson_number::text,2,'0'),
 e.lesson_number,e.lesson_number,'reading',
 'موضوع موثق من البرنامج الرسمي «'||e.lesson_title||'» ضمن «'||e.unit_title||'».',
 'يستخدم هذا الدرس عنوان البرنامج الرسمي كنقطة انطلاق، ويقدم شرحًا وتطبيقات أصلية من ضاديوم دون نسخ نصوص المصدر.',
 jsonb_build_array(
  'أن يحدد المتعلم المفهوم أو الفكرة المركزية في الموضوع.',
  'أن يفسر المتعلم مثالًا مناسبًا ويربطه بسياقه.',
  'أن يوظف المتعلم المعرفة أو المهارة في استجابة أصلية.'
 ),
 jsonb_build_array(
  jsonb_build_object('word','الفكرة','meaning','المعنى أو المهارة المركزية في الموضوع.'),
  jsonb_build_object('word','السياق','meaning','الموقف أو المجال الذي يظهر فيه المعنى.'),
  jsonb_build_object('word','التطبيق','meaning','استخدام ما تعلمه المتعلم في مثال جديد.')
 ),
 jsonb_build_array(
  'راجع عنوان الموضوع في البرنامج الرسمي.',
  'حدد المفهوم أو الفكرة الرئيسة.',
  'حلل مثالًا مناسبًا.',
  'أنجز تطبيقًا قصيرًا من صياغتك.'
 ),
 (select data->>'source' from tmp_dj_g10),
 'published',true,35
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
 and cu.name_ar='اللغة العربية — جيبوتي — Seconde — البرنامج الرسمي التفصيلي'
 and g.grade_number=10
)
insert into public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
select tl.id,q.n,
 case q.n
  when 1 then 'ما أفضل خطوة أولى لفهم «'||tl.title||'»؟'
  when 2 then 'كيف يظهر الفهم الجيد لهذا الموضوع ضمن «'||tl.unit_title||'»؟'
  else 'ما وظيفة ضاديوم هنا؟' end,
 'multiple_choice',
 case q.n
  when 1 then jsonb_build_array(
   jsonb_build_object('id','a','text','تحديد الفكرة أو المهارة وربطها بسياقها.'),
   jsonb_build_object('id','b','text','حفظ كلمات بلا فهم.'),
   jsonb_build_object('id','c','text','تجاهل أمثلة الموضوع.'))
  when 2 then jsonb_build_array(
   jsonb_build_object('id','a','text','بشرح الفكرة وتطبيقها في مثال مناسب.'),
   jsonb_build_object('id','b','text','بنسخ العنوان فقط.'),
   jsonb_build_object('id','c','text','بترك الموضوع دون تحليل.'))
  else jsonb_build_array(
   jsonb_build_object('id','a','text','دعم البرنامج الرسمي بشرح وتدريب أصلي.'),
   jsonb_build_object('id','b','text','استبدال البرنامج الرسمي.'),
   jsonb_build_object('id','c','text','إعادة نشر المصدر كاملًا.'))
 end,
 'a',
 case q.n
  when 1 then 'الفهم يبدأ بتحديد الفكرة أو المهارة وسياقها.'
  when 2 then 'الفهم الجيد يظهر في تفسير وتطبيق مناسبين.'
  else 'ضاديوم يدعم البرنامج الرسمي بمحتوى أصلي.' end,
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
 and cu.name_ar='اللغة العربية — جيبوتي — Seconde — البرنامج الرسمي التفصيلي'
 and g.grade_number=10
)
insert into public.lesson_activities(
 lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required
)
select tl.id,
 case a.n when 1 then 'فهم الموضوع' when 2 then 'تحليل وتطبيق' else 'إنتاج قصير' end,
 case a.n when 1 then 'reading' when 2 then 'multiple_choice' else 'writing' end,
 case a.n
  when 1 then 'حدد الفكرة أو المهارة الرئيسة في «'||tl.title||'».'
  when 2 then 'اختر مثالًا مناسبًا وفسر علاقته بالموضوع.'
  else 'اكتب استجابة قصيرة من صياغتك تطبق فيها ما تعلمته.' end,
 jsonb_build_object('origin','DADYOOM_DJ_G10_OFFICIAL_PROGRAMME','officialTitle',tl.title),
 a.n,5,true,
 case a.n when 1 then 'understanding' when 2 then 'analysis' else 'production' end,
 null,'{}'::jsonb,true
from tl cross join generate_series(1,3) a(n)
where not exists (
 select 1 from public.lesson_activities x
 where x.lesson_id=tl.id and x.activity_order=a.n
 and x.title=case a.n when 1 then 'فهم الموضوع' when 2 then 'تحليل وتطبيق' else 'إنتاج قصير' end
);
