-- Oman Grade 12 Arabic — Al-Mu'nis — Semester 2.
-- Official digital book: https://ict.moe.gov.om/book/PDF/12/cls12_Muunis_P2/files/downloads/cls12_Muunis_P2.pdf
-- Official TOC: https://ict.moe.gov.om/book/PDF/12/cls12_Muunis_P2/files/basic-html/page12.html
-- The book explicitly states enrichment texts are not part of the official syllabus;
-- therefore enrichment texts are intentionally excluded from this detailed curriculum.
-- Dadyoom explanations, questions and activities are original.

create temp table if not exists tmp_om_g12_muunis_s2(data jsonb) on commit drop;
truncate tmp_om_g12_muunis_s2;
insert into tmp_om_g12_muunis_s2(data) values ($json${"units":[{"number":1,"title":"المحور الأول: تطور أشكال القصيدة العربية الحديثة","lessons":["قضية الشعر الجديد","أنشودة المطر","قصيدة حب إلى مطرح"]},{"number":2,"title":"المحور الثاني: المسرح في الأدب العربي الحديث","lessons":["الأدب المسرحي","كم لبثنا في الكهف؟"]},{"number":3,"title":"المحور الثالث: السيرة الذاتية في الأدب العربي","lessons":["أدب السيرة الذاتية","عهد الطفولة","مغامر عُماني في أدغال إفريقيا"]},{"number":4,"title":"المحور الرابع: تطور الأشكال السردية في الأدب العربي الحديث","lessons":["القصة","اليوم الجديد","زمن الفقر"]},{"number":5,"title":"المحور الخامس: من الأدب العالمي المترجم","lessons":["حوار الترجمة الأدبية ومشكلاتها","الصحراء العربية"]},{"number":6,"title":"المطالعة: قضايا حضارية وإنسانية","lessons":["حوار الشعوب","شجرة التواصل الحضاري: مسيرة الخير 1995","الشباب ووقت الفراغ","السينما والأدب"]},{"number":7,"title":"التعبير: فنون المشافهة والتحرير","lessons":["كيف تكتب بحثًا","الحوار الصحفي","كتابة القصة","الاستدلال","الحوار حول قضية (الاستنساخ)","التخطيط","محاضر الاجتماعات","البرهنة (رهانات المستقبل)"]}],"source":"https://ict.moe.gov.om/book/PDF/12/cls12_Muunis_P2/files/downloads/cls12_Muunis_P2.pdf"}$json$::jsonb);

with c as (
  select id from public.countries where code='OM' limit 1
)
insert into public.curricula(country_id,name_ar,name_en,academic_year,description,is_active)
select id,
  'اللغة العربية — عُمان — الصف الثاني عشر — المؤنس — الفصل الثاني',
  'Arabic — Oman Grade 12 — Al-Mu''nis — Semester 2',
  '2026-2027',
  'مسار رسمي مفصل من فهرس كتاب المؤنس الرقمي الرسمي للصف الثاني عشر، الفصل الدراسي الثاني. النصوص الإثرائية غير محتسبة لأنها ليست جزءًا من المقرر الرسمي.',
  true
from c
on conflict (country_id,name_ar,academic_year)
do update set description=excluded.description,is_active=true;

with cu as (
  select cu.id
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  where c.code='OM'
    and cu.name_ar='اللغة العربية — عُمان — الصف الثاني عشر — المؤنس — الفصل الثاني'
    and cu.academic_year='2026-2027'
  limit 1
)
insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
select id,'الصف الثاني عشر — المؤنس — الفصل الثاني','Grade 12 — Al-Mu''nis — Semester 2',12,12,true
from cu
on conflict (curriculum_id,name_ar)
do update set grade_number=12,sort_order=12,is_active=true;

with g as (
  select g.id
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  where c.code='OM'
    and cu.name_ar='اللغة العربية — عُمان — الصف الثاني عشر — المؤنس — الفصل الثاني'
    and g.grade_number=12
  limit 1
), defs as (
  select *
  from jsonb_to_recordset((select data->'units' from tmp_om_g12_muunis_s2))
  as x(number int,title text,lessons jsonb)
)
insert into public.units(grade_id,title,description,unit_number,sort_order)
select g.id,d.title,
  'قسم موثق من فهرس كتاب المؤنس الرسمي للصف الثاني عشر، الفصل الدراسي الثاني.',
  d.number,d.number
from g cross join defs d
on conflict (grade_id,unit_number)
do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order;

with g as (
  select g.id
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  where c.code='OM'
    and cu.name_ar='اللغة العربية — عُمان — الصف الثاني عشر — المؤنس — الفصل الثاني'
    and g.grade_number=12
  limit 1
), defs as (
  select *
  from jsonb_to_recordset((select data->'units' from tmp_om_g12_muunis_s2))
  as x(number int,title text,lessons jsonb)
), expanded as (
  select d.number unit_number,d.title unit_title,
    ordinality::int lesson_number,
    lesson #>> '{}' lesson_title
  from defs d
  cross join lateral jsonb_array_elements(d.lessons) with ordinality as e(lesson,ordinality)
), target_units as (
  select u.id,u.unit_number
  from public.units u join g on g.id=u.grade_id
)
insert into public.lessons(
  unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,content,
  learning_objectives,vocabulary,instructions,source_pdf_url,status,is_free,estimated_minutes
)
select tu.id,e.lesson_title,
  'om-official-g12-muunis-s2-u'||lpad(e.unit_number::text,2,'0')||'-l'||lpad(e.lesson_number::text,2,'0'),
  e.lesson_number,e.lesson_number,
  case when e.unit_number<=6 then 'reading'
       else 'writing' end,
  'درس مواءمة أصلي من ضاديوم للعنوان الرسمي «'||e.lesson_title||'» ضمن «'||e.unit_title||'».',
  'راجع كتاب المؤنس الرسمي أو نسخة مرخصة منه لدراسة النص أو المادة، ثم استخدم ضاديوم للفهم والتحليل والتطبيق دون إعادة نشر نص الكتاب.',
  jsonb_build_array(
    'أن يحدد المتعلم الفكرة أو المهارة المركزية في الدرس.',
    'أن يحلل المتعلم عنصرًا مناسبًا من الدرس بالاستناد إلى المصدر الرسمي.',
    'أن ينتج المتعلم تطبيقًا لغويًا أو أدبيًا أصيلًا مرتبطًا بالدرس.'
  ),
  jsonb_build_array(
    jsonb_build_object('word','الفكرة','meaning','المعنى أو القضية المركزية التي يعالجها الدرس.'),
    jsonb_build_object('word','الشاهد','meaning','موضع أو مثال يستند إليه التحليل.'),
    jsonb_build_object('word','التطبيق','meaning','مهمة أصلية توظف ما تعلمه المتعلم.')
  ),
  jsonb_build_array(
    'راجع عنوان الدرس ومادته في الكتاب الرسمي.',
    'حدد الفكرة أو المهارة الرئيسة.',
    'حلل مثالًا مناسبًا دون نسخ مطول من المصدر.',
    'نفذ تطبيقًا أصيلًا من صياغتك.'
  ),
  (select data->>'source' from tmp_om_g12_muunis_s2),
  'published',true,35
from expanded e
join target_units tu on tu.unit_number=e.unit_number
on conflict (unit_id,lesson_number)
do update set
  title=excluded.title,slug=excluded.slug,sort_order=excluded.sort_order,
  lesson_type=excluded.lesson_type,summary=excluded.summary,content=excluded.content,
  learning_objectives=excluded.learning_objectives,vocabulary=excluded.vocabulary,
  instructions=excluded.instructions,source_pdf_url=excluded.source_pdf_url,
  status='published',is_free=true,estimated_minutes=excluded.estimated_minutes,updated_at=now();

with target_lessons as (
  select l.id,l.title,u.title unit_title
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  join public.lessons l on l.unit_id=u.id
  where c.code='OM'
    and cu.name_ar='اللغة العربية — عُمان — الصف الثاني عشر — المؤنس — الفصل الثاني'
    and g.grade_number=12
)
insert into public.questions(
  lesson_id,question_order,question,question_type,options,correct_answer,explanation,points
)
select tl.id,q.n,
  case q.n
    when 1 then 'ما الخطوة الأولى الصحيحة لدراسة «'||tl.title||'»؟'
    when 2 then 'أي ممارسة تدل على فهمك لدرس «'||tl.title||'»؟'
    else 'ما علاقة ضاديوم بالكتاب الرسمي في هذا الدرس؟'
  end,
  'multiple_choice',
  case q.n
    when 1 then jsonb_build_array(
      jsonb_build_object('id','a','text','الرجوع إلى المادة الرسمية وتحديد الفكرة أو المهارة المركزية.'),
      jsonb_build_object('id','b','text','حفظ عنوان الدرس فقط.'),
      jsonb_build_object('id','c','text','تجاهل سياق الدرس.')
    )
    when 2 then jsonb_build_array(
      jsonb_build_object('id','a','text','تحليل المادة ثم إنتاج تطبيق أصيل مرتبط بها.'),
      jsonb_build_object('id','b','text','نسخ فقرة طويلة من الكتاب.'),
      jsonb_build_object('id','c','text','تكرار اسم المؤلف فقط.')
    )
    else jsonb_build_array(
      jsonb_build_object('id','a','text','يدعم الكتاب بشرح وتدريب أصليين مع بقاء الكتاب المرجع الرسمي.'),
      jsonb_build_object('id','b','text','يستبدل الكتاب الرسمي بالكامل.'),
      jsonb_build_object('id','c','text','يعيد نشر النصوص المحمية كاملة.')
    )
  end,
  'a',
  case q.n
    when 1 then 'تبدأ الدراسة من موضع الدرس في المصدر الرسمي وفهم فكرته أو مهارته.'
    when 2 then 'الفهم يظهر في التحليل والتطبيق الأصيل، لا في النسخ.'
    else 'ضاديوم طبقة دعم تعليمية أصلية ولا يستبدل المصدر الرسمي.'
  end,
  1
from target_lessons tl
cross join generate_series(1,3) q(n)
on conflict (lesson_id,question_order)
do update set question=excluded.question,question_type=excluded.question_type,
  options=excluded.options,correct_answer=excluded.correct_answer,
  explanation=excluded.explanation,points=excluded.points,updated_at=now();

with target_lessons as (
  select l.id,l.title
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  join public.lessons l on l.unit_id=u.id
  where c.code='OM'
    and cu.name_ar='اللغة العربية — عُمان — الصف الثاني عشر — المؤنس — الفصل الثاني'
    and g.grade_number=12
)
insert into public.lesson_activities(
  lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required
)
select tl.id,
  case a.n when 1 then 'استكشاف الدرس' when 2 then 'تحليل وتفسير' else 'إنتاج أصيل' end,
  case a.n when 1 then 'reading' when 2 then 'multiple_choice' else 'writing' end,
  case a.n
    when 1 then 'حدد الفكرة أو المهارة المركزية في «'||tl.title||'» بعد مراجعة المصدر الرسمي.'
    when 2 then 'اختر عنصرًا مناسبًا من الدرس واشرح دوره أو دلالته.'
    else 'أنجز تطبيقًا قصيرًا من صياغتك مرتبطًا بما تعلمته.'
  end,
  jsonb_build_object('origin','DADYOOM_OM_G12_MUUNIS_S2','officialTitle',tl.title),
  a.n,5,true,
  case a.n when 1 then 'understanding' when 2 then 'analysis' else 'production' end,
  null,'{}'::jsonb,true
from target_lessons tl
cross join generate_series(1,3) a(n)
where not exists (
  select 1 from public.lesson_activities x
  where x.lesson_id=tl.id
    and x.activity_order=a.n
    and x.title=case a.n when 1 then 'استكشاف الدرس' when 2 then 'تحليل وتفسير' else 'إنتاج أصيل' end
);
