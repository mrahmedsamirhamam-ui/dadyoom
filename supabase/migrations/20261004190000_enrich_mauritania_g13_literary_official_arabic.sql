-- Mauritania Grade 13 Arabic — Literary track detailed official TOC.
-- Official landing: https://koutoubi.mr/secondaire2/7eme/Arabe/
-- Official 2025 textbook PDF linked by IPN Koutoubi: https://docs.bsimr.com/pdfs/secondaire2s/AR-7AS-LM.pdf
-- Only official titles/structure are retained; Dadyoom learning content is original.

create temp table if not exists tmp_mr_g13_literary(data jsonb) on commit drop;
truncate tmp_mr_g13_literary;
insert into tmp_mr_g13_literary(data) values ($json${"units":[{"number":1,"title":"تاريخ الأدب","lessons":["النهضة العربية","المدارس الأدبية","أسلوب النداء","أسلوب الشرط","الصورة الشعرية","مهارة كتابة مقال تحليلي لنص أدبي"]},{"number":2,"title":"اتجاهات وأغراض الشعر العربي الحديث","lessons":["المدرسة الإحيائية","في سرنديب","بني سورية لأحمد شوقي","الفرات الطاغي للجواهري","سفارة الشعر لابن حامدن","الرومانسية","المساء لخليل مطران","كن بلسما لأبي ماضي","في ظل وادي الموت لأبي القاسم الشابي","الطاغية لفاضل أمين","الشعر العربي المعاصر (الشعر الحر)","سربروس في بابل للسياب","سوسنة اسمها القدس","هوامش على دفتر النكسة لنزار قباني","المجد للإنسان لأحمدو عبد القادر","الإيقاع الشعري","ظواهر الإيقاع الداخلي","بحر الهزج","المتدارك أو الخبب","بحر السريع","السطر والمقطع الشعريان","الصورة الشعرية ومكوناتها","مهارة كتابة مقال تحليلي لنص شعري","تجميع المعطيات - دراسة الخصائص الفنية"]},{"number":3,"title":"أجناس نثرية","lessons":["السرد في الأدب العربي الحديث","فن السيرة","الأيام لطه حسين","القصة في الأدب العربي الحديث","في البيت الجديد لنجيب محفوظ","النخاسة","المسرحية في الأدب العربي","العودة إلى الكهف","عمل المشتقات: اسم الفاعل وصيغ المبالغة والصفة المشبهة باسم الفاعل","مهارة كتابة مقال تحليلي لنص سردي"]},{"number":4,"title":"قضايا أدبية ونقدية","lessons":["النقد ومذاهبه","المناهج النقدية","شروط صناعة الشعر للمرصفي","شوقي في الميزان (توطئة)","الشعر المهموس","ميلاد السرد وتطوره","مراجعة البحور الصافية","عمل المصدر","عمل اسم المفعول","مهارة كتابة مقال تحليلي لنص نقدي"]}],"source":"https://docs.bsimr.com/pdfs/secondaire2s/AR-7AS-LM.pdf"}$json$::jsonb);

with c as (select id from public.countries where code='MR' limit 1)
insert into public.curricula(country_id,name_ar,name_en,academic_year,description,is_active)
select id,
 'اللغة العربية — موريتانيا — السنة السابعة الثانوية — الشعبة الأدبية',
 'Arabic — Mauritania Grade 13 — Literary Track',
 '2026-2027',
 'مسار رسمي مفصل من فهرس كتاب اللغة العربية للسنة السابعة الثانوية الأدبية، طبعة 2025، الصادر عن وزارة التربية والمعهد التربوي الوطني والمرتبط من منصة كُتبي. تحتفظ ضاديوم بالعناوين والبنية فقط وتنتج الشرح والأنشطة بنفسها.',
 true
from c
on conflict (country_id,name_ar,academic_year)
do update set description=excluded.description,is_active=true;

with cu as (
 select cu.id from public.countries c
 join public.curricula cu on cu.country_id=c.id
 where c.code='MR'
   and cu.name_ar='اللغة العربية — موريتانيا — السنة السابعة الثانوية — الشعبة الأدبية'
   and cu.academic_year='2026-2027'
 limit 1
)
insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
select id,'السنة السابعة الثانوية — الشعبة الأدبية','Grade 13 — Literary Track',13,13,true
from cu
on conflict (curriculum_id,name_ar)
do update set grade_number=13,sort_order=13,is_active=true;

with g as (
 select g.id from public.countries c
 join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id
 where c.code='MR'
   and cu.name_ar='اللغة العربية — موريتانيا — السنة السابعة الثانوية — الشعبة الأدبية'
   and g.grade_number=13 limit 1
), defs as (
 select * from jsonb_to_recordset((select data->'units' from tmp_mr_g13_literary))
 as x(number int,title text,lessons jsonb)
)
insert into public.units(grade_id,title,description,unit_number,sort_order)
select g.id,d.title,'وحدة موثقة من فهرس كتاب اللغة العربية الرسمي للسنة السابعة الثانوية الأدبية — طبعة 2025.',d.number,d.number
from g cross join defs d
on conflict (grade_id,unit_number)
do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order;

with g as (
 select g.id from public.countries c
 join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id
 where c.code='MR'
   and cu.name_ar='اللغة العربية — موريتانيا — السنة السابعة الثانوية — الشعبة الأدبية'
   and g.grade_number=13 limit 1
), defs as (
 select * from jsonb_to_recordset((select data->'units' from tmp_mr_g13_literary))
 as x(number int,title text,lessons jsonb)
), expanded as (
 select d.number unit_number,d.title unit_title,
   row_number() over(partition by d.number order by ordinality)::int lesson_number,
   lesson #>> '{}' lesson_title
 from defs d cross join lateral jsonb_array_elements(d.lessons) with ordinality as e(lesson,ordinality)
), tu as (
 select u.id,u.unit_number from public.units u join g on g.id=u.grade_id
)
insert into public.lessons(
 unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,content,
 learning_objectives,vocabulary,instructions,source_pdf_url,status,is_free,estimated_minutes
)
select tu.id,e.lesson_title,
 'mr-official-g13-literary-u'||lpad(e.unit_number::text,2,'0')||'-l'||lpad(e.lesson_number::text,2,'0'),
 e.lesson_number,e.lesson_number,'reading',
 'درس مواءمة أصلي من ضاديوم للعنوان الرسمي «'||e.lesson_title||'» ضمن وحدة «'||e.unit_title||'».',
 'ارجع إلى الكتاب الرسمي أو نسخته المرخصة، ثم استخدم ضاديوم للفهم والتحليل والتطبيق دون إعادة نشر نص الكتاب.',
 jsonb_build_array(
  'أن يحدد المتعلم الفكرة أو المهارة المركزية في الدرس.',
  'أن يحلل المتعلم مثالًا أو شاهدًا مناسبًا ويوضح دلالته.',
  'أن يطبق المتعلم المهارة في استجابة أصلية من صياغته.'
 ),
 jsonb_build_array(
  jsonb_build_object('word','الفكرة','meaning','المعنى أو المهارة المركزية التي يدور حولها الدرس.'),
  jsonb_build_object('word','الشاهد','meaning','مثال أو دليل مناسب يدعم الفهم والتحليل.'),
  jsonb_build_object('word','التطبيق','meaning','استخدام المعرفة أو المهارة في موقف جديد.')
 ),
 jsonb_build_array(
  'راجع عنوان الدرس وموضعه في الكتاب الرسمي.',
  'حدد المفهوم أو الفكرة الرئيسة.',
  'حلل مثالًا أو شاهدًا مناسبًا.',
  'أنجز تطبيقًا قصيرًا من صياغتك ثم راجعه.'
 ),
 (select data->>'source' from tmp_mr_g13_literary),
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
 where c.code='MR'
   and cu.name_ar='اللغة العربية — موريتانيا — السنة السابعة الثانوية — الشعبة الأدبية'
   and g.grade_number=13
)
insert into public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
select tl.id,q.n,
 case q.n
  when 1 then 'ما الخطوة الأولى الأنسب لدراسة «'||tl.title||'»؟'
  when 2 then 'ما الذي يجعل التحليل أو التطبيق مقنعًا في وحدة «'||tl.unit_title||'»؟'
  else 'ما دور ضاديوم في هذا الدرس؟' end,
 'multiple_choice',
 case q.n
  when 1 then jsonb_build_array(
   jsonb_build_object('id','a','text','الرجوع للمادة الرسمية وتحديد الفكرة أو المهارة المركزية.'),
   jsonb_build_object('id','b','text','حفظ إجابة جاهزة بلا فهم.'),
   jsonb_build_object('id','c','text','تجاهل سياق الوحدة.'))
  when 2 then jsonb_build_array(
   jsonb_build_object('id','a','text','مثال أو شاهد مناسب مع تفسير واضح.'),
   jsonb_build_object('id','b','text','نسخ العنوان فقط.'),
   jsonb_build_object('id','c','text','إعادة إجابة محفوظة.'))
  else jsonb_build_array(
   jsonb_build_object('id','a','text','دعم الكتاب الرسمي بشرح وتدريب أصلي.'),
   jsonb_build_object('id','b','text','إعادة نشر الكتاب كاملًا.'),
   jsonb_build_object('id','c','text','استبدال المصدر الرسمي.'))
 end,
 'a',
 case q.n
  when 1 then 'البداية الصحيحة هي فهم موضع الدرس وفكرته أو مهارته من المصدر الرسمي.'
  when 2 then 'التحليل والتطبيق الجيدان يحتاجان دليلًا أو مثالًا وتفسيرًا واضحًا.'
  else 'ضاديوم يقدم شرحًا وتدريبًا أصليين مع إبقاء المصدر الرسمي مرجعًا.' end,
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
 where c.code='MR'
   and cu.name_ar='اللغة العربية — موريتانيا — السنة السابعة الثانوية — الشعبة الأدبية'
   and g.grade_number=13
)
insert into public.lesson_activities(
 lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required
)
select tl.id,
 case a.n when 1 then 'فهم الدرس' when 2 then 'تحليل وتطبيق' else 'إنتاج قصير' end,
 case a.n when 1 then 'reading' when 2 then 'multiple_choice' else 'writing' end,
 case a.n
  when 1 then 'حدد الفكرة أو المهارة الرئيسة في «'||tl.title||'».'
  when 2 then 'اختر مثالًا أو شاهدًا مناسبًا وفسر علاقته بالدرس.'
  else 'اكتب استجابة قصيرة من صياغتك تطبق فيها ما تعلمته.' end,
 jsonb_build_object('origin','DADYOOM_MR_G13_LITERARY_OFFICIAL','officialTitle',tl.title),
 a.n,5,true,
 case a.n when 1 then 'understanding' when 2 then 'analysis' else 'production' end,
 null,'{}'::jsonb,true
from tl cross join generate_series(1,3) a(n)
where not exists (
 select 1 from public.lesson_activities x
 where x.lesson_id=tl.id and x.activity_order=a.n
   and x.title=case a.n when 1 then 'فهم الدرس' when 2 then 'تحليل وتطبيق' else 'إنتاج قصير' end
);
