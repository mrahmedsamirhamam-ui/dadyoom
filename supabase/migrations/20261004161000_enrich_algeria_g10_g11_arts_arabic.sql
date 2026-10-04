-- Detailed official secondary Arabic axes for Algeria Grades 10 and 11.
-- Official curriculum structure/titles only; Dadyoom explanations/questions/activities are original.

-- اللغة العربية — الجزائر — السنة الأولى ثانوي — جذع مشترك آداب
create temp table if not exists tmp_dz_track(data jsonb) on commit drop;
truncate tmp_dz_track;
insert into tmp_dz_track(data) values ($json$[{"number":1,"title":"الأدب الجاهلي","lessons":["التقاليد والأخلاق والمثل العليا","الصلح والسلم بين القبائل في العصر الجاهلي","الفروسية","آداب الفروسية والبطولة","وصف الطبيعة","الطبيعة من خلال الشعر الجاهلي","الحكم والأمثال","ترجمة الحكم والأمثال لعقلية الشعوب والأمم"]},{"number":2,"title":"أدب صدر الإسلام","lessons":["القيم الروحية والاجتماعية في الإسلام","قيم روحية وقيم اجتماعية واكبت ظهور الإسلام","النضال والصراع","وضع الشعر أثناء الدعوة الإسلامية","شعر الفتوحات الإسلامية","شعر الفتوح وآثاره النفسية على الفرد والأسرة","تأثير الإسلام في الشعر والشعراء","من آثار الإسلام على الفكر واللغة"]},{"number":3,"title":"الأدب الأموي","lessons":["الخلافة الإسلامية والمؤثرات الحزبية في الشعر","الأحزاب السياسية في عهد بني أمية","المواقف الوجدانية","التعبير الوجداني في شعر الغزل في العهد الأموي","التقليد والتجديد","مظاهر التقليد والتجديد في الشعر الأموي","نهضة الفنون النثرية","وضع النثر في العصر الأموي"]},{"number":4,"title":"مبادئ النقد الأدبي - جذع مشترك آداب","lessons":["تعريف النقد الأدبي","وظيفة النقد الأدبي","النقد بين الموضوعية والذاتية","عناصر الأدب","الصورة الأدبية","الشعر وأقسامه","التذوق الجمالي للنص","الوحدة العضوية والوحدة الموضوعية","التجربة الشعرية","اللفظ والمعنى"]},{"number":5,"title":"التعبير الفكري والكتابي","lessons":["أثر العمل في حياة الأمة والفرد","الوقت وأهميته في حياة الفرد والمجتمع","الدقة في المحافظة على المواعيد","رسالة المعلم وأثرها في رقي الأمم وازدهارها","مزايا التسامح في بناء المجتمعات الإنسانية ورقيها","أساليب استثمار وسائل الاتصال والإعلام في الحصول على العلم والمعرفة"]},{"number":6,"title":"التعبير الأدبي","lessons":["زهير بن أبي سلمى شاعر السلم والسلام","الخطابة في عصرها الذهبي: الأسباب والخصائص","مظاهر التجديد في شعر شعراء المدينة","خصائص الشعر السياسي في العصر الأموي"]}]$json$::jsonb);

with c as (select id from public.countries where code='DZ' limit 1)
insert into public.curricula(country_id,name_ar,name_en,academic_year,description,is_active)
select id,$$اللغة العربية — الجزائر — السنة الأولى ثانوي — جذع مشترك آداب$$,$$Arabic — Algeria Grade 10 — Common Core Arts$$,'2026-2027',$$مسار تفصيلي لمحاور اللغة العربية وآدابها الموثقة في منهاج وزارة التربية الوطنية للسنة الأولى ثانوي - جذع مشترك آداب. العناوين والبنية رسمية، والشرح والأنشطة داخل ضاديوم أصلية.$$,true
from c
on conflict (country_id,name_ar,academic_year)
do update set name_en=excluded.name_en,description=excluded.description,is_active=true;

with cu as (
 select cu.id from public.countries c
 join public.curricula cu on cu.country_id=c.id
 where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الأولى ثانوي — جذع مشترك آداب$$ and cu.academic_year='2026-2027'
 limit 1
)
insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
select id,$$السنة الأولى ثانوي — جذع مشترك آداب$$,$$Grade 10 — Common Core Arts$$,10,10,true from cu
on conflict (curriculum_id,name_ar)
do update set grade_number=10,sort_order=10,is_active=true;

with g as (
 select g.id from public.countries c
 join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id
 where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الأولى ثانوي — جذع مشترك آداب$$ and g.grade_number=10 limit 1
), defs as (
 select * from jsonb_to_recordset((select data from tmp_dz_track))
 as x(number int,title text,lessons jsonb)
)
insert into public.units(grade_id,title,description,unit_number,sort_order)
select g.id,d.title,'محور رسمي موثق ضمن منهاج وزارة التربية الوطنية الجزائرية.',d.number,d.number
from g cross join defs d
on conflict (grade_id,unit_number)
do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order;

with g as (
 select g.id from public.countries c
 join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id
 where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الأولى ثانوي — جذع مشترك آداب$$ and g.grade_number=10 limit 1
), defs as (
 select * from jsonb_to_recordset((select data from tmp_dz_track))
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
 'dz-official-g10-arts-u'||lpad(e.unit_number::text,2,'0')||'-l'||lpad(e.lesson_number::text,2,'0'),
 e.lesson_number,e.lesson_number,'reading',
 'محور موثق من منهاج وزارة التربية الوطنية الجزائرية: «'||e.lesson_title||'» ضمن «'||e.unit_title||'».',
 'يقدم ضاديوم شرحًا وتدريبًا أصليين حول هذا المحور دون إعادة نشر نصوص الكتاب المدرسي. يعمل المتعلم على الفهم والتحليل والاستدلال والتعبير المستقل.',
 jsonb_build_array(
  'أن يفهم المتعلم المحور «'||e.lesson_title||'» في سياقه.',
  'أن يحلل المتعلم مثالًا أو نصًا جديدًا مرتبطًا بالمحور.',
  'أن ينتج المتعلم استجابة مستقلة مدعومة بتعليل.'
 ),
 jsonb_build_array(
  jsonb_build_object('word','محور','meaning','موضوع رسمي منظم للتعلم.'),
  jsonb_build_object('word','تحليل','meaning','تفكيك العناصر وبيان العلاقات والدلالات.'),
  jsonb_build_object('word','تعليل','meaning','تقديم سبب أو دليل يدعم الحكم.')
 ),
 jsonb_build_array('اقرأ عنوان المحور وحدد ما تعرفه عنه.','طبّق الفكرة على مثال أو نص جديد.','اكتب خلاصة قصيرة من صياغتك وراجعها.'),
 $$https://education.gov.dz/wp-content/uploads/2015/04/%D8%A7%D9%84%D9%84%D8%BA%D9%80%D9%80%D8%A9-%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9-%D9%88%D8%A2%D8%AF%D8%A7%D8%A8%D9%87%D8%A7-%D8%A7%D9%84%D8%B3%D9%86%D8%A9-%D8%A7%D9%84%D8%A7%D9%88%D9%84%D9%89.pdf$$,'published',true,30
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
 where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الأولى ثانوي — جذع مشترك آداب$$ and g.grade_number=10
)
insert into public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
select tl.id,q.n,
 case q.n when 1 then 'ما الخطوة الأولى المناسبة لدراسة «'||tl.title||'»؟'
              when 2 then 'ما دليل الفهم الجيد لهذا المحور؟'
              else 'ما أفضل طريقة لإظهار الإتقان؟' end,
 'multiple_choice',
 case q.n
  when 1 then jsonb_build_array(jsonb_build_object('id','a','text','فهم المفهوم والسياق قبل الحفظ.'),jsonb_build_object('id','b','text','حفظ عنوان المحور فقط.'),jsonb_build_object('id','c','text','تجاهل الأمثلة.'))
  when 2 then jsonb_build_array(jsonb_build_object('id','a','text','ربط الفكرة بشاهد أو مثال وتفسيره.'),jsonb_build_object('id','b','text','نسخ إجابة جاهزة.'),jsonb_build_object('id','c','text','إعادة العنوان دون تحليل.'))
  else jsonb_build_array(jsonb_build_object('id','a','text','تطبيق مستقل وخلاصة معللة.'),jsonb_build_object('id','b','text','التكرار دون فهم.'),jsonb_build_object('id','c','text','ترك التدريب.'))
 end,
 'a',
 case q.n when 1 then 'الفهم والسياق يسبقان الحفظ.'
              when 2 then 'الدليل والتفسير يكشفان الفهم.'
              else 'التطبيق المستقل والتعليل هما معيار الإتقان.' end,
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
 where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الأولى ثانوي — جذع مشترك آداب$$ and g.grade_number=10
)
insert into public.lesson_activities(
 lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required
)
select tl.id,
 case a.n when 1 then 'فهم المحور' when 2 then 'تحليل وتطبيق' else 'إنتاج مستقل' end,
 case a.n when 1 then 'reading' when 2 then 'multiple_choice' else 'writing' end,
 case a.n when 1 then 'حدد المفهوم أو الظاهرة الأساسية في المحور.'
              when 2 then 'اربط المحور بمثال أو شاهد واشرح العلاقة.'
              else 'اكتب فقرة قصيرة توظف ما تعلمته في سياق جديد.' end,
 jsonb_build_object('origin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL','officialTitle',tl.title),
 a.n,5,true,
 case a.n when 1 then 'understanding' when 2 then 'analysis' else 'production' end,
 null,'{}'::jsonb,true
from tl cross join generate_series(1,3) a(n)
where not exists (
 select 1 from public.lesson_activities x
 where x.lesson_id=tl.id and x.activity_order=a.n
  and x.title=case a.n when 1 then 'فهم المحور' when 2 then 'تحليل وتطبيق' else 'إنتاج مستقل' end
);


-- اللغة العربية — الجزائر — السنة الثانية ثانوي — آداب/فلسفة/لغات
create temp table if not exists tmp_dz_track(data jsonb) on commit drop;
truncate tmp_dz_track;
insert into tmp_dz_track(data) values ($json$[{"number":1,"title":"العصر العباسي الأول","lessons":["النزعة العقلية في الشعر","أثر النزعة العقلية في القصيدة العربية","الشعوبية وأثرها في الأدب","الشعوبية وصراع الحضارات","المجون والزندقة","حياة اللهو والمجون","شعر الزهد","الدعوة إلى الإصلاح والميل إلى الزهد","نشاط النثر","الحركة العلمية وأثرها في الفكر والأدب"]},{"number":2,"title":"العصر العباسي الثاني","lessons":["الحكمة والفلسفة في الشعر","الحركة العقلية والفلسفية في الحواضر العربية","الشكوى واضطراب أحوال المجتمع","الحياة الاجتماعية ومظاهر الظلم"]},{"number":3,"title":"الحركة الشعرية في المغرب العربي","lessons":["من قضايا الشعر في عهد الدولة الرستمية","نهضة الأدب في عهد الدولة الرستمية","الشعر في ظل الصراعات الداخلية على السلطة","استقلال بلاد المغرب عن الخلافة وانعكاساته في الصراع على السلطة"]},{"number":4,"title":"العصر الأندلسي","lessons":["الطبيعة والمدائن الجميلة","خصائص شعر الطبيعة","رثاء الممالك والمدن","الفتنة البربرية وآثارها في الشعر والأدب"]},{"number":5,"title":"التعبير التدريبي","lessons":["تلخيص نصوص متنوعة","شرح نصوص متنوعة","كتابة قصص قصيرة وحكايات"]},{"number":6,"title":"التعبير الفكري","lessons":["حقيقة الصداقة والصديق","تبدأ حرية الفرد حين تنتهي حرية الآخرين","التمييز العنصري وسبل الخلاص منه","مظاهر ثقافة الإنسان المعاصر"]},{"number":7,"title":"التعبير الأدبي","lessons":["أبو تمام والمتنبي حكيمان وأما الشاعر فالبحتري","مظاهر التجديد في الشعر العباسي: الموضوعات والأوزان والقوافي"]}]$json$::jsonb);

with c as (select id from public.countries where code='DZ' limit 1)
insert into public.curricula(country_id,name_ar,name_en,academic_year,description,is_active)
select id,$$اللغة العربية — الجزائر — السنة الثانية ثانوي — آداب/فلسفة/لغات$$,$$Arabic — Algeria Grade 11 — Literature/Philosophy/Languages$$,'2026-2027',$$مسار تفصيلي لمحاور اللغة العربية وآدابها الموثقة في منهاج وزارة التربية الوطنية للسنة الثانية من التعليم الثانوي للشعب الأدبية واللغات.$$,true
from c
on conflict (country_id,name_ar,academic_year)
do update set name_en=excluded.name_en,description=excluded.description,is_active=true;

with cu as (
 select cu.id from public.countries c
 join public.curricula cu on cu.country_id=c.id
 where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الثانية ثانوي — آداب/فلسفة/لغات$$ and cu.academic_year='2026-2027'
 limit 1
)
insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
select id,$$السنة الثانية ثانوي — آداب/فلسفة/لغات$$,$$Grade 11 — Literature/Philosophy/Languages$$,11,11,true from cu
on conflict (curriculum_id,name_ar)
do update set grade_number=11,sort_order=11,is_active=true;

with g as (
 select g.id from public.countries c
 join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id
 where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الثانية ثانوي — آداب/فلسفة/لغات$$ and g.grade_number=11 limit 1
), defs as (
 select * from jsonb_to_recordset((select data from tmp_dz_track))
 as x(number int,title text,lessons jsonb)
)
insert into public.units(grade_id,title,description,unit_number,sort_order)
select g.id,d.title,'محور رسمي موثق ضمن منهاج وزارة التربية الوطنية الجزائرية.',d.number,d.number
from g cross join defs d
on conflict (grade_id,unit_number)
do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order;

with g as (
 select g.id from public.countries c
 join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id
 where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الثانية ثانوي — آداب/فلسفة/لغات$$ and g.grade_number=11 limit 1
), defs as (
 select * from jsonb_to_recordset((select data from tmp_dz_track))
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
 'dz-official-g11-letters-u'||lpad(e.unit_number::text,2,'0')||'-l'||lpad(e.lesson_number::text,2,'0'),
 e.lesson_number,e.lesson_number,'reading',
 'محور موثق من منهاج وزارة التربية الوطنية الجزائرية: «'||e.lesson_title||'» ضمن «'||e.unit_title||'».',
 'يقدم ضاديوم شرحًا وتدريبًا أصليين حول هذا المحور دون إعادة نشر نصوص الكتاب المدرسي. يعمل المتعلم على الفهم والتحليل والاستدلال والتعبير المستقل.',
 jsonb_build_array(
  'أن يفهم المتعلم المحور «'||e.lesson_title||'» في سياقه.',
  'أن يحلل المتعلم مثالًا أو نصًا جديدًا مرتبطًا بالمحور.',
  'أن ينتج المتعلم استجابة مستقلة مدعومة بتعليل.'
 ),
 jsonb_build_array(
  jsonb_build_object('word','محور','meaning','موضوع رسمي منظم للتعلم.'),
  jsonb_build_object('word','تحليل','meaning','تفكيك العناصر وبيان العلاقات والدلالات.'),
  jsonb_build_object('word','تعليل','meaning','تقديم سبب أو دليل يدعم الحكم.')
 ),
 jsonb_build_array('اقرأ عنوان المحور وحدد ما تعرفه عنه.','طبّق الفكرة على مثال أو نص جديد.','اكتب خلاصة قصيرة من صياغتك وراجعها.'),
 $$https://education.gov.dz/wp-content/uploads/2015/04/Arabe-2AS-Letres-et-Philo-Langues-1-Copie.pdf$$,'published',true,35
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
 where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الثانية ثانوي — آداب/فلسفة/لغات$$ and g.grade_number=11
)
insert into public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
select tl.id,q.n,
 case q.n when 1 then 'ما الخطوة الأولى المناسبة لدراسة «'||tl.title||'»؟'
              when 2 then 'ما دليل الفهم الجيد لهذا المحور؟'
              else 'ما أفضل طريقة لإظهار الإتقان؟' end,
 'multiple_choice',
 case q.n
  when 1 then jsonb_build_array(jsonb_build_object('id','a','text','فهم المفهوم والسياق قبل الحفظ.'),jsonb_build_object('id','b','text','حفظ عنوان المحور فقط.'),jsonb_build_object('id','c','text','تجاهل الأمثلة.'))
  when 2 then jsonb_build_array(jsonb_build_object('id','a','text','ربط الفكرة بشاهد أو مثال وتفسيره.'),jsonb_build_object('id','b','text','نسخ إجابة جاهزة.'),jsonb_build_object('id','c','text','إعادة العنوان دون تحليل.'))
  else jsonb_build_array(jsonb_build_object('id','a','text','تطبيق مستقل وخلاصة معللة.'),jsonb_build_object('id','b','text','التكرار دون فهم.'),jsonb_build_object('id','c','text','ترك التدريب.'))
 end,
 'a',
 case q.n when 1 then 'الفهم والسياق يسبقان الحفظ.'
              when 2 then 'الدليل والتفسير يكشفان الفهم.'
              else 'التطبيق المستقل والتعليل هما معيار الإتقان.' end,
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
 where c.code='DZ' and cu.name_ar=$$اللغة العربية — الجزائر — السنة الثانية ثانوي — آداب/فلسفة/لغات$$ and g.grade_number=11
)
insert into public.lesson_activities(
 lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required
)
select tl.id,
 case a.n when 1 then 'فهم المحور' when 2 then 'تحليل وتطبيق' else 'إنتاج مستقل' end,
 case a.n when 1 then 'reading' when 2 then 'multiple_choice' else 'writing' end,
 case a.n when 1 then 'حدد المفهوم أو الظاهرة الأساسية في المحور.'
              when 2 then 'اربط المحور بمثال أو شاهد واشرح العلاقة.'
              else 'اكتب فقرة قصيرة توظف ما تعلمته في سياق جديد.' end,
 jsonb_build_object('origin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL','officialTitle',tl.title),
 a.n,5,true,
 case a.n when 1 then 'understanding' when 2 then 'analysis' else 'production' end,
 null,'{}'::jsonb,true
from tl cross join generate_series(1,3) a(n)
where not exists (
 select 1 from public.lesson_activities x
 where x.lesson_id=tl.id and x.activity_order=a.n
  and x.title=case a.n when 1 then 'فهم المحور' when 2 then 'تحليل وتطبيق' else 'إنتاج مستقل' end
);

