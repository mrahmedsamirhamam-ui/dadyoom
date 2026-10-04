-- Sudan Grade 12 Arabic grammar — verified readable portion of the official TOC.
-- Official source: https://mdl.edu.sd/img/bookpdf/nahw3_1678863142.pdf
-- Authority: Sudan Ministry of General Education / National Centre for Curricula and Educational Research.
-- Only clearly readable official TOC headings are retained. Ambiguous/corrupted TOC rows are intentionally omitted.
-- Dadyoom lesson explanations, questions and activities are original.

create temp table if not exists tmp_sd_g12_grammar(data jsonb) on commit drop;
truncate tmp_sd_g12_grammar;
insert into tmp_sd_g12_grammar(data) values ($json${"units":[{"number":1,"title":"الجمل وأشباه الجمل التي لها محل من الإعراب","lessons":["الجمل وأشباه الجمل التي لها محل من الإعراب — مراجعة"]},{"number":2,"title":"أسلوب الشرط","lessons":["أدوات الشرط الجازمة","أدوات الشرط غير الجازمة","اقتران جواب الشرط بالفاء","جزم المضارع في جواب الطلب"]},{"number":3,"title":"النسب","lessons":["صيغة النسب","النسب إلى المقصور","النسب إلى المنقوص","النسب إلى الممدود","النسب إلى ما فيه ياء مشددة","النسب إلى الاسم الثلاثي مكسور العين","النسب إلى الاسم الثلاثي محذوف اللام","النسب إلى المركب","النسب إلى المثنى والجمع"]},{"number":4,"title":"الجامد والمشتق","lessons":["تقسيم الاسم إلى جامد ومشتق","أنواع الأسماء المشتقة","اسم الفاعل","صيغ المبالغة","صيغة اسم المفعول","إعمال اسم الفاعل واسم المفعول","صيغ الصفة المشبهة باسم الفاعل"]}],"source":"https://mdl.edu.sd/img/bookpdf/nahw3_1678863142.pdf"}$json$::jsonb);

with c as (
  select id from public.countries where code='SD' limit 1
)
insert into public.curricula(country_id,name_ar,name_en,academic_year,description,is_active)
select id,
  'اللغة العربية — السودان — الصف الثالث الثانوي — قواعد اللغة العربية',
  'Arabic — Sudan Grade 12 — Arabic Grammar',
  '2026-2027',
  'مسار رسمي مفصل جزئيًا من العناوين المقروءة بوضوح في فهرس كتاب قواعد اللغة العربية للصف الثالث الثانوي الصادر عن وزارة التعليم العام والمركز القومي للمناهج والبحث التربوي. تحتفظ ضاديوم بالعناوين والبنية فقط وتنتج الشرح والأنشطة بنفسها.',
  true
from c
on conflict (country_id,name_ar,academic_year)
do update set description=excluded.description,is_active=true;

with cu as (
  select cu.id
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  where c.code='SD'
    and cu.name_ar='اللغة العربية — السودان — الصف الثالث الثانوي — قواعد اللغة العربية'
    and cu.academic_year='2026-2027'
  limit 1
)
insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
select id,'الصف الثالث الثانوي — قواعد اللغة العربية','Grade 12 — Arabic Grammar',12,12,true
from cu
on conflict (curriculum_id,name_ar)
do update set grade_number=12,sort_order=12,is_active=true;

with g as (
  select g.id
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  where c.code='SD'
    and cu.name_ar='اللغة العربية — السودان — الصف الثالث الثانوي — قواعد اللغة العربية'
    and g.grade_number=12
  limit 1
), defs as (
  select *
  from jsonb_to_recordset((select data->'units' from tmp_sd_g12_grammar))
  as x(number int,title text,lessons jsonb)
)
insert into public.units(grade_id,title,description,unit_number,sort_order)
select g.id,d.title,
  'قسم موثق من الجزء المقروء بوضوح من فهرس كتاب قواعد اللغة العربية الرسمي للصف الثالث الثانوي.',
  d.number,d.number
from g cross join defs d
on conflict (grade_id,unit_number)
do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order;

with g as (
  select g.id
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  where c.code='SD'
    and cu.name_ar='اللغة العربية — السودان — الصف الثالث الثانوي — قواعد اللغة العربية'
    and g.grade_number=12
  limit 1
), defs as (
  select *
  from jsonb_to_recordset((select data->'units' from tmp_sd_g12_grammar))
  as x(number int,title text,lessons jsonb)
), expanded as (
  select d.number unit_number,d.title unit_title,
    row_number() over(partition by d.number order by ordinality)::int lesson_number,
    lesson #>> '{}' lesson_title
  from defs d
  cross join lateral jsonb_array_elements(d.lessons) with ordinality as e(lesson,ordinality)
), target_units as (
  select u.id,u.unit_number
  from public.units u
  join g on g.id=u.grade_id
)
insert into public.lessons(
  unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,content,
  learning_objectives,vocabulary,instructions,source_pdf_url,status,is_free,estimated_minutes
)
select target_units.id,e.lesson_title,
  'sd-official-g12-grammar-u'||lpad(e.unit_number::text,2,'0')||'-l'||lpad(e.lesson_number::text,2,'0'),
  e.lesson_number,e.lesson_number,'grammar',
  'درس مواءمة أصلي من ضاديوم للعنوان الرسمي «'||e.lesson_title||'» ضمن قسم «'||e.unit_title||'».',
  'راجع كتاب قواعد اللغة العربية الرسمي للصف الثالث الثانوي أو نسخة مرخصة منه لدراسة المادة، ثم استخدم ضاديوم للفهم والتحليل والتطبيق دون إعادة نشر نص الكتاب.',
  jsonb_build_array(
    'أن يحدد المتعلم القاعدة أو المفهوم المركزي في الدرس.',
    'أن يفسر المتعلم مثالًا نحويًا أو صرفيًا مناسبًا.',
    'أن يطبق المتعلم القاعدة في مثال جديد من صياغته.'
  ),
  jsonb_build_array(
    jsonb_build_object('word','القاعدة','meaning','المبدأ اللغوي الذي ينظم الاستعمال في الدرس.'),
    jsonb_build_object('word','الشاهد','meaning','مثال لغوي يستخدم للفهم والتحليل.'),
    jsonb_build_object('word','التطبيق','meaning','استخدام القاعدة في مثال أو سياق جديد.')
  ),
  jsonb_build_array(
    'راجع عنوان الدرس في الكتاب الرسمي.',
    'حدد القاعدة أو المفهوم الرئيس.',
    'حلل مثالًا مناسبًا يوضح القاعدة.',
    'أنشئ مثالًا من صياغتك وراجعه.'
  ),
  (select data->>'source' from tmp_sd_g12_grammar),
  'published',true,35
from expanded e
join target_units on target_units.unit_number=e.unit_number
on conflict (unit_id,lesson_number)
do update set
  title=excluded.title,
  slug=excluded.slug,
  sort_order=excluded.sort_order,
  lesson_type=excluded.lesson_type,
  summary=excluded.summary,
  content=excluded.content,
  learning_objectives=excluded.learning_objectives,
  vocabulary=excluded.vocabulary,
  instructions=excluded.instructions,
  source_pdf_url=excluded.source_pdf_url,
  status='published',
  is_free=true,
  estimated_minutes=excluded.estimated_minutes,
  updated_at=now();

with target_lessons as (
  select l.id,l.title,u.title unit_title
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  join public.lessons l on l.unit_id=u.id
  where c.code='SD'
    and cu.name_ar='اللغة العربية — السودان — الصف الثالث الثانوي — قواعد اللغة العربية'
    and g.grade_number=12
)
insert into public.questions(
  lesson_id,question_order,question,question_type,options,correct_answer,explanation,points
)
select target_lessons.id,q.n,
  case q.n
    when 1 then 'ما البداية الصحيحة لدراسة «'||target_lessons.title||'»؟'
    when 2 then 'ما الذي يثبت فهمك للقاعدة في قسم «'||target_lessons.unit_title||'»؟'
    else 'ما دور ضاديوم في هذا الدرس؟'
  end,
  'multiple_choice',
  case q.n
    when 1 then jsonb_build_array(
      jsonb_build_object('id','a','text','الرجوع للمادة الرسمية وتحديد القاعدة أو المفهوم المركزي.'),
      jsonb_build_object('id','b','text','حفظ إجابة جاهزة بلا فهم.'),
      jsonb_build_object('id','c','text','تجاهل عنوان الدرس وسياقه.')
    )
    when 2 then jsonb_build_array(
      jsonb_build_object('id','a','text','تحليل مثال مناسب ثم إنشاء تطبيق جديد صحيح.'),
      jsonb_build_object('id','b','text','نسخ عنوان الدرس فقط.'),
      jsonb_build_object('id','c','text','إعادة مثال محفوظ دون تفسير.')
    )
    else jsonb_build_array(
      jsonb_build_object('id','a','text','دعم الكتاب الرسمي بشرح وتدريب أصلي.'),
      jsonb_build_object('id','b','text','إعادة نشر الكتاب كاملًا.'),
      jsonb_build_object('id','c','text','استبدال المصدر الرسمي.')
    )
  end,
  'a',
  case q.n
    when 1 then 'البداية الصحيحة هي فهم موضع الدرس وقاعدته من المصدر الرسمي.'
    when 2 then 'الفهم يظهر في التحليل والتطبيق الصحيح على مثال جديد.'
    else 'ضاديوم يقدم شرحًا وتدريبًا أصليين مع إبقاء المصدر الرسمي مرجعًا.'
  end,
  1
from target_lessons
cross join generate_series(1,3) q(n)
on conflict (lesson_id,question_order)
do update set
  question=excluded.question,
  question_type=excluded.question_type,
  options=excluded.options,
  correct_answer=excluded.correct_answer,
  explanation=excluded.explanation,
  points=excluded.points,
  updated_at=now();

with target_lessons as (
  select l.id,l.title
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  join public.lessons l on l.unit_id=u.id
  where c.code='SD'
    and cu.name_ar='اللغة العربية — السودان — الصف الثالث الثانوي — قواعد اللغة العربية'
    and g.grade_number=12
)
insert into public.lesson_activities(
  lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required
)
select target_lessons.id,
  case a.n when 1 then 'فهم القاعدة' when 2 then 'تحليل مثال' else 'تطبيق جديد' end,
  case a.n when 1 then 'reading' when 2 then 'multiple_choice' else 'writing' end,
  case a.n
    when 1 then 'لخص القاعدة أو الفكرة الرئيسة في «'||target_lessons.title||'» بكلماتك.'
    when 2 then 'اختر مثالًا مناسبًا وحلل كيف يوضح القاعدة.'
    else 'اكتب مثالًا جديدًا من صياغتك يطبق ما تعلمته.'
  end,
  jsonb_build_object('origin','DADYOOM_SD_G12_OFFICIAL_GRAMMAR','officialTitle',target_lessons.title),
  a.n,5,true,
  case a.n when 1 then 'understanding' when 2 then 'analysis' else 'production' end,
  null,'{}'::jsonb,true
from target_lessons
cross join generate_series(1,3) a(n)
where not exists (
  select 1
  from public.lesson_activities existing
  where existing.lesson_id=target_lessons.id
    and existing.activity_order=a.n
    and existing.title=case a.n when 1 then 'فهم القاعدة' when 2 then 'تحليل مثال' else 'تطبيق جديد' end
);
