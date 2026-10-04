-- Detailed official scientific-track Arabic progression for Algeria Grades 11 and 12.
-- Only official axis/unit titles are stored; Dadyoom teaching content is original.

-- اللغة العربية — الجزائر — السنة الثانية ثانوي — الشعب العلمية المشتركة
create temp table if not exists tmp_dz_science(data jsonb) on commit drop;
truncate tmp_dz_science;
insert into tmp_dz_science(data) values ($json$[{"number":1,"title":"أدب العصر العباسي الأول","lessons":["النزعة العقلية في الشعر","الدعوة إلى التجديد والقضاء على القديم","شعر الزهد","التقليد والتجديد في النتاج الشعري العباسي","نشاط النثر"]},{"number":2,"title":"العصر العباسي الثاني","lessons":["الحكمة والفلسفة في الشعر","الشكوى واضطراب أحوال المجتمع"]},{"number":3,"title":"الحركة الشعرية في المغرب العربي","lessons":["من قضايا الشعر في عهد الدولة الرستمية","الشعر في ظل الصراعات الداخلية على السلطة"]},{"number":4,"title":"الأدب الأندلسي","lessons":["وصف الطبيعة الجميلة","رثاء الممالك","الموشحات"]}]$json$::jsonb);

with c as (select id from public.countries where code='DZ' limit 1)
insert into public.curricula(country_id,name_ar,name_en,academic_year,description,is_active)
select id,$$اللغة العربية — الجزائر — السنة الثانية ثانوي — الشعب العلمية المشتركة$$,$$Arabic — Algeria Grade 11 — Scientific Common Branches$$,'2026-2027',
  'مسار تفصيلي للشعب العلمية المشتركة مبني على المناهج والتدرجات السنوية لوزارة التربية الوطنية الجزائرية. تحفظ ضاديوم أسماء المحاور والوحدات، وتقدم شرحًا وأسئلة وأنشطة أصلية دون إعادة نشر نصوص الكتاب.',
  true
from c
on conflict (country_id,name_ar,academic_year)
do update set name_en=excluded.name_en,description=excluded.description,is_active=true;

with cu as (
  select cu.id from public.countries c
  join public.curricula cu on cu.country_id=c.id
  where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الثانية ثانوي — الشعب العلمية المشتركة$$ and cu.academic_year='2026-2027'
  limit 1
)
insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
select id,$$السنة الثانية ثانوي — الشعب العلمية المشتركة$$,$$Grade 11 — Scientific Common Branches$$,11,11,true from cu
on conflict (curriculum_id,name_ar)
do update set grade_number=11,sort_order=11,is_active=true;

with g as (
  select g.id from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الثانية ثانوي — الشعب العلمية المشتركة$$ and g.grade_number=11
  limit 1
), defs as (
  select * from jsonb_to_recordset((select data from tmp_dz_science))
  as x(number int,title text,lessons jsonb)
)
insert into public.units(grade_id,title,description,unit_number,sort_order)
select g.id,d.title,'محور موثق ضمن التدرجات السنوية للشعب العلمية المشتركة.',d.number,d.number
from g cross join defs d
on conflict (grade_id,unit_number)
do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order;

with g as (
  select g.id from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الثانية ثانوي — الشعب العلمية المشتركة$$ and g.grade_number=11
  limit 1
), defs as (
  select * from jsonb_to_recordset((select data from tmp_dz_science))
  as x(number int,title text,lessons jsonb)
), expanded as (
  select d.number unit_number,d.title unit_title,
    row_number() over(partition by d.number order by ordinality)::int lesson_number,
    lesson #>> '{}' lesson_title
  from defs d
  cross join lateral jsonb_array_elements(d.lessons) with ordinality as e(lesson,ordinality)
), tu as (
  select u.id,u.unit_number from public.units u join g on g.id=u.grade_id
)
insert into public.lessons(
  unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,content,
  learning_objectives,vocabulary,instructions,source_pdf_url,status,is_free,estimated_minutes
)
select tu.id,e.lesson_title,
  'dz-official-g11-science-u'||lpad(e.unit_number::text,2,'0')||'-l'||lpad(e.lesson_number::text,2,'0'),
  e.lesson_number,e.lesson_number,'reading',
  'وحدة تعلمية موثقة ضمن التدرجات السنوية للشعب العلمية: «'||e.lesson_title||'» في محور «'||e.unit_title||'».',
  'يقدم ضاديوم شرحًا وتدريبًا أصليين لهذه الوحدة. يستخدم المتعلم الكتاب أو النص الرسمي المتاح لديه، ثم يعمل داخل ضاديوم على الفهم والتحليل والتطبيق والإنتاج دون إعادة نشر النص المدرسي.',
  jsonb_build_array(
    'أن يحدد المتعلم خصائص الوحدة ومحورها الأدبي.',
    'أن يحلل المتعلم مثالًا أو شاهدًا جديدًا مرتبطًا بالوحدة.',
    'أن ينتج المتعلم تفسيرًا أو حكمًا معللًا من صياغته الخاصة.'
  ),
  jsonb_build_array(
    jsonb_build_object('word','المحور','meaning','الإطار الأدبي أو الفكري المنظم للوحدة.'),
    jsonb_build_object('word','التحليل','meaning','تفكيك المعنى والبناء وربطهما بالسياق.'),
    jsonb_build_object('word','الدليل','meaning','شاهد أو مثال يدعم الاستنتاج.')
  ),
  jsonb_build_array('حدّد الفكرة الأساسية للوحدة.','اربطها بالسياق الأدبي أو التاريخي.','طبّقها على مثال أو نص جديد.','اكتب خلاصة قصيرة من صياغتك.'),
  $$https://education.gov.dz/wp-content/uploads/2015/04/Arabe-2AS-Sces-Maths-TM-gestion.pdf$$,'published',true,35
from expanded e
join tu on tu.unit_number=e.unit_number
on conflict (unit_id,lesson_number)
do update set title=excluded.title,slug=excluded.slug,sort_order=excluded.sort_order,
  summary=excluded.summary,content=excluded.content,learning_objectives=excluded.learning_objectives,
  vocabulary=excluded.vocabulary,instructions=excluded.instructions,source_pdf_url=excluded.source_pdf_url,
  status='published',is_free=true,estimated_minutes=excluded.estimated_minutes,updated_at=now();

with tl as (
  select l.id,l.title
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  join public.lessons l on l.unit_id=u.id
  where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الثانية ثانوي — الشعب العلمية المشتركة$$ and g.grade_number=11
)
insert into public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
select tl.id,q.n,
  case q.n when 1 then 'ما البداية الأنسب لدراسة «'||tl.title||'»؟'
               when 2 then 'ما الذي يدل على فهم الوحدة «'||tl.title||'»؟'
               else 'كيف يظهر المتعلم إتقانه لهذه الوحدة؟' end,
  'multiple_choice',
  case q.n
    when 1 then jsonb_build_array(jsonb_build_object('id','a','text','فهم المحور والسياق قبل حفظ التفاصيل.'),jsonb_build_object('id','b','text','حفظ العنوان فقط.'),jsonb_build_object('id','c','text','تجاهل السياق.'))
    when 2 then jsonb_build_array(jsonb_build_object('id','a','text','ربط الفكرة بدليل أو مثال مع تفسير.'),jsonb_build_object('id','b','text','نسخ إجابة جاهزة.'),jsonb_build_object('id','c','text','إعادة العنوان فقط.'))
    else jsonb_build_array(jsonb_build_object('id','a','text','تطبيق مستقل وإنتاج معلل.'),jsonb_build_object('id','b','text','التكرار دون فهم.'),jsonb_build_object('id','c','text','ترك النشاط.'))
  end,
  'a',
  case q.n when 1 then 'فهم السياق يسبق حفظ الجزئيات.'
               when 2 then 'الدليل مع التفسير يكشف الفهم الحقيقي.'
               else 'التطبيق والإنتاج المستقل معياران للإتقان.' end,
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
  where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الثانية ثانوي — الشعب العلمية المشتركة$$ and g.grade_number=11
)
insert into public.lesson_activities(
  lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required
)
select tl.id,
  case a.n when 1 then 'فهم الوحدة' when 2 then 'تحليل وتطبيق' else 'إنتاج مستقل' end,
  case a.n when 1 then 'reading' when 2 then 'multiple_choice' else 'writing' end,
  case a.n when 1 then 'حدد الفكرة أو الظاهرة الأساسية في الوحدة.'
               when 2 then 'اربط الوحدة بمثال أو شاهد واشرح العلاقة.'
               else 'اكتب فقرة قصيرة تطبق فيها ما تعلمته.' end,
  jsonb_build_object('origin','DADYOOM_DZ_SCIENCE_OFFICIAL_DETAIL','officialTitle',tl.title),
  a.n,5,true,
  case a.n when 1 then 'understanding' when 2 then 'analysis' else 'production' end,
  null,'{}'::jsonb,true
from tl cross join generate_series(1,3) a(n)
where not exists (
  select 1 from public.lesson_activities x
  where x.lesson_id=tl.id and x.activity_order=a.n
    and x.title=case a.n when 1 then 'فهم الوحدة' when 2 then 'تحليل وتطبيق' else 'إنتاج مستقل' end
);


-- اللغة العربية — الجزائر — السنة الثالثة ثانوي — الشعب العلمية المشتركة
create temp table if not exists tmp_dz_science(data jsonb) on commit drop;
truncate tmp_dz_science;
insert into tmp_dz_science(data) values ($json$[{"number":1,"title":"أدب عصر الضعف","lessons":["الشعر التعليمي في عصر الضعف","النثر العلمي في عصر الضعف"]},{"number":2,"title":"الأدب الحديث والمعاصر","lessons":["النزعة الإنسانية في الشعر المهجري","شعر النهضة وموقفه من حضارة الغرب","الشعر الملتزم وقضايا التحرر","نكبة فلسطين في الشعر العربي","الثورة التحريرية الجزائرية في الشعر العربي","الشعر الاجتماعي في العصر الحديث","مظاهر ازدهار الكتابة الفنية - المقال","القصة القصيرة في الجزائر","الفن المسرحي في المشرق","الأدب المسرحي الجزائري"]}]$json$::jsonb);

with c as (select id from public.countries where code='DZ' limit 1)
insert into public.curricula(country_id,name_ar,name_en,academic_year,description,is_active)
select id,$$اللغة العربية — الجزائر — السنة الثالثة ثانوي — الشعب العلمية المشتركة$$,$$Arabic — Algeria Grade 12 — Scientific Common Branches$$,'2026-2027',
  'مسار تفصيلي للشعب العلمية المشتركة مبني على المناهج والتدرجات السنوية لوزارة التربية الوطنية الجزائرية. تحفظ ضاديوم أسماء المحاور والوحدات، وتقدم شرحًا وأسئلة وأنشطة أصلية دون إعادة نشر نصوص الكتاب.',
  true
from c
on conflict (country_id,name_ar,academic_year)
do update set name_en=excluded.name_en,description=excluded.description,is_active=true;

with cu as (
  select cu.id from public.countries c
  join public.curricula cu on cu.country_id=c.id
  where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الثالثة ثانوي — الشعب العلمية المشتركة$$ and cu.academic_year='2026-2027'
  limit 1
)
insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
select id,$$السنة الثالثة ثانوي — الشعب العلمية المشتركة$$,$$Grade 12 — Scientific Common Branches$$,12,12,true from cu
on conflict (curriculum_id,name_ar)
do update set grade_number=12,sort_order=12,is_active=true;

with g as (
  select g.id from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الثالثة ثانوي — الشعب العلمية المشتركة$$ and g.grade_number=12
  limit 1
), defs as (
  select * from jsonb_to_recordset((select data from tmp_dz_science))
  as x(number int,title text,lessons jsonb)
)
insert into public.units(grade_id,title,description,unit_number,sort_order)
select g.id,d.title,'محور موثق ضمن التدرجات السنوية للشعب العلمية المشتركة.',d.number,d.number
from g cross join defs d
on conflict (grade_id,unit_number)
do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order;

with g as (
  select g.id from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الثالثة ثانوي — الشعب العلمية المشتركة$$ and g.grade_number=12
  limit 1
), defs as (
  select * from jsonb_to_recordset((select data from tmp_dz_science))
  as x(number int,title text,lessons jsonb)
), expanded as (
  select d.number unit_number,d.title unit_title,
    row_number() over(partition by d.number order by ordinality)::int lesson_number,
    lesson #>> '{}' lesson_title
  from defs d
  cross join lateral jsonb_array_elements(d.lessons) with ordinality as e(lesson,ordinality)
), tu as (
  select u.id,u.unit_number from public.units u join g on g.id=u.grade_id
)
insert into public.lessons(
  unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,content,
  learning_objectives,vocabulary,instructions,source_pdf_url,status,is_free,estimated_minutes
)
select tu.id,e.lesson_title,
  'dz-official-g12-science-u'||lpad(e.unit_number::text,2,'0')||'-l'||lpad(e.lesson_number::text,2,'0'),
  e.lesson_number,e.lesson_number,'reading',
  'وحدة تعلمية موثقة ضمن التدرجات السنوية للشعب العلمية: «'||e.lesson_title||'» في محور «'||e.unit_title||'».',
  'يقدم ضاديوم شرحًا وتدريبًا أصليين لهذه الوحدة. يستخدم المتعلم الكتاب أو النص الرسمي المتاح لديه، ثم يعمل داخل ضاديوم على الفهم والتحليل والتطبيق والإنتاج دون إعادة نشر النص المدرسي.',
  jsonb_build_array(
    'أن يحدد المتعلم خصائص الوحدة ومحورها الأدبي.',
    'أن يحلل المتعلم مثالًا أو شاهدًا جديدًا مرتبطًا بالوحدة.',
    'أن ينتج المتعلم تفسيرًا أو حكمًا معللًا من صياغته الخاصة.'
  ),
  jsonb_build_array(
    jsonb_build_object('word','المحور','meaning','الإطار الأدبي أو الفكري المنظم للوحدة.'),
    jsonb_build_object('word','التحليل','meaning','تفكيك المعنى والبناء وربطهما بالسياق.'),
    jsonb_build_object('word','الدليل','meaning','شاهد أو مثال يدعم الاستنتاج.')
  ),
  jsonb_build_array('حدّد الفكرة الأساسية للوحدة.','اربطها بالسياق الأدبي أو التاريخي.','طبّقها على مثال أو نص جديد.','اكتب خلاصة قصيرة من صياغتك.'),
  $$https://education.gov.dz/wp-content/uploads/2015/04/3-AS-LE-arabe.pdf$$,'published',true,35
from expanded e
join tu on tu.unit_number=e.unit_number
on conflict (unit_id,lesson_number)
do update set title=excluded.title,slug=excluded.slug,sort_order=excluded.sort_order,
  summary=excluded.summary,content=excluded.content,learning_objectives=excluded.learning_objectives,
  vocabulary=excluded.vocabulary,instructions=excluded.instructions,source_pdf_url=excluded.source_pdf_url,
  status='published',is_free=true,estimated_minutes=excluded.estimated_minutes,updated_at=now();

with tl as (
  select l.id,l.title
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  join public.lessons l on l.unit_id=u.id
  where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الثالثة ثانوي — الشعب العلمية المشتركة$$ and g.grade_number=12
)
insert into public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
select tl.id,q.n,
  case q.n when 1 then 'ما البداية الأنسب لدراسة «'||tl.title||'»؟'
               when 2 then 'ما الذي يدل على فهم الوحدة «'||tl.title||'»؟'
               else 'كيف يظهر المتعلم إتقانه لهذه الوحدة؟' end,
  'multiple_choice',
  case q.n
    when 1 then jsonb_build_array(jsonb_build_object('id','a','text','فهم المحور والسياق قبل حفظ التفاصيل.'),jsonb_build_object('id','b','text','حفظ العنوان فقط.'),jsonb_build_object('id','c','text','تجاهل السياق.'))
    when 2 then jsonb_build_array(jsonb_build_object('id','a','text','ربط الفكرة بدليل أو مثال مع تفسير.'),jsonb_build_object('id','b','text','نسخ إجابة جاهزة.'),jsonb_build_object('id','c','text','إعادة العنوان فقط.'))
    else jsonb_build_array(jsonb_build_object('id','a','text','تطبيق مستقل وإنتاج معلل.'),jsonb_build_object('id','b','text','التكرار دون فهم.'),jsonb_build_object('id','c','text','ترك النشاط.'))
  end,
  'a',
  case q.n when 1 then 'فهم السياق يسبق حفظ الجزئيات.'
               when 2 then 'الدليل مع التفسير يكشف الفهم الحقيقي.'
               else 'التطبيق والإنتاج المستقل معياران للإتقان.' end,
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
  where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الثالثة ثانوي — الشعب العلمية المشتركة$$ and g.grade_number=12
)
insert into public.lesson_activities(
  lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required
)
select tl.id,
  case a.n when 1 then 'فهم الوحدة' when 2 then 'تحليل وتطبيق' else 'إنتاج مستقل' end,
  case a.n when 1 then 'reading' when 2 then 'multiple_choice' else 'writing' end,
  case a.n when 1 then 'حدد الفكرة أو الظاهرة الأساسية في الوحدة.'
               when 2 then 'اربط الوحدة بمثال أو شاهد واشرح العلاقة.'
               else 'اكتب فقرة قصيرة تطبق فيها ما تعلمته.' end,
  jsonb_build_object('origin','DADYOOM_DZ_SCIENCE_OFFICIAL_DETAIL','officialTitle',tl.title),
  a.n,5,true,
  case a.n when 1 then 'understanding' when 2 then 'analysis' else 'production' end,
  null,'{}'::jsonb,true
from tl cross join generate_series(1,3) a(n)
where not exists (
  select 1 from public.lesson_activities x
  where x.lesson_id=tl.id and x.activity_order=a.n
    and x.title=case a.n when 1 then 'فهم الوحدة' when 2 then 'تحليل وتطبيق' else 'إنتاج مستقل' end
);

