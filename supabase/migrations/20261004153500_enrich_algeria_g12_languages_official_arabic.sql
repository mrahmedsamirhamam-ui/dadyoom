-- Algeria Grade 12 Arabic - Foreign Languages track.
-- Source: https://education.gov.dz/wp-content/uploads/2015/04/3-AS-LE-arabe.pdf
-- Official titles/structure only; Dadyoom learning content is original.

create temp table if not exists tmp_dz_g12_languages(data jsonb) on commit drop;
truncate tmp_dz_g12_languages;
insert into tmp_dz_g12_languages(data) values ($json${"units":[{"number":1,"title":"شعر الزهد والمديح النبوي","lessons":["في مدح الرسول - البوصيري","في الزهد - ابن نباتة"]},{"number":2,"title":"النثر العلمي في العصر المملوكي","lessons":["خواص القمر وتأثيراته - القزويني","علم التاريخ - ابن خلدون"]},{"number":3,"title":"شعر المنفى لدى الشعراء الرواد","lessons":["آلام الاغتراب - البارودي","من وحي المنفى - أحمد شوقي"]},{"number":4,"title":"النزعة الإنسانية في الشعر المهجري","lessons":["أنا - إيليا أبو ماضي","هنا وهناك - القروي"]},{"number":5,"title":"فلسطين في الشعر العربي المعاصر","lessons":["منشورات فدائية - نزار قباني","حالة حصار - محمود درويش"]},{"number":6,"title":"الثورة التحريرية الجزائرية في الشعر العربي","lessons":["الإنسان الكبير - محمد صالح باوية","جميلة - شفيق الكمالي"]},{"number":7,"title":"الإحساس بالحزن والألم عند الشعراء المعاصرين","lessons":["أغنيات للألم - نازك الملائكة","أحزان الغربة"]},{"number":8,"title":"توظيف الرمز والأسطورة في الشعر العربي المعاصر","lessons":["أبو تمام - صلاح عبد الصبور","خطاب غير تاريخي - أمل دنقل"]},{"number":9,"title":"مظاهر ازدهار الكتابة الفنية - المقالة نموذجًا","lessons":["منزلة المثقفين في الأمة - محمد البشير الإبراهيمي","الصراع بين التقليد والتجديد في الأدب - طه حسين"]},{"number":10,"title":"القصة القصيرة في الجزائر","lessons":["الجرح والأمل - زليخة السعودي","الطريق إلى قرية الطوب - محمد شنوفي"]},{"number":11,"title":"الفن المسرحي في المشرق","lessons":["من مسرحية شهرزاد - توفيق الحكيم","كابوس في الظهيرة - حسين عبد الخضر"]},{"number":12,"title":"الأدب المسرحي في الجزائر","lessons":["لالة فاطمة نسومر المرأة الصقر - إدريس قرقوة","من مسرحية المغص - أحمد بو دشيشة"]}],"source":"https://education.gov.dz/wp-content/uploads/2015/04/3-AS-LE-arabe.pdf"}$json$::jsonb);

with c as (select id from public.countries where code='DZ' limit 1)
insert into public.curricula(country_id,name_ar,name_en,academic_year,description,is_active)
select id,
 'اللغة العربية — الجزائر — السنة الثالثة ثانوي — شعبة اللغات الأجنبية',
 'Arabic — Algeria Grade 12 — Foreign Languages Track',
 '2026-2027',
 'مسار رسمي مفصل مبني على التدرجات السنوية المنشورة من وزارة التربية الوطنية الجزائرية لشعبة اللغات الأجنبية. تحفظ ضاديوم العناوين والبنية فقط، وتقدم شرحًا وأنشطة أصلية.',
 true
from c
on conflict (country_id,name_ar,academic_year)
do update set description=excluded.description,is_active=true;

with cu as (
 select cu.id from public.countries c
 join public.curricula cu on cu.country_id=c.id
 where c.code='DZ'
   and cu.name_ar='اللغة العربية — الجزائر — السنة الثالثة ثانوي — شعبة اللغات الأجنبية'
   and cu.academic_year='2026-2027'
 limit 1
)
insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
select id,'السنة الثالثة ثانوي — شعبة اللغات الأجنبية','Grade 12 — Foreign Languages Track',12,12,true
from cu
on conflict (curriculum_id,name_ar)
do update set grade_number=12,sort_order=12,is_active=true;

with g as (
 select g.id from public.countries c
 join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id
 where c.code='DZ'
   and cu.name_ar='اللغة العربية — الجزائر — السنة الثالثة ثانوي — شعبة اللغات الأجنبية'
   and g.grade_number=12 limit 1
), defs as (
 select * from jsonb_to_recordset((select data->'units' from tmp_dz_g12_languages))
 as x(number int,title text,lessons jsonb)
)
insert into public.units(grade_id,title,description,unit_number,sort_order)
select g.id,d.title,'وحدة موثقة ضمن التدرجات السنوية الرسمية لشعبة اللغات الأجنبية في السنة الثالثة ثانوي.',d.number,d.number
from g cross join defs d
on conflict (grade_id,unit_number)
do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order;

with g as (
 select g.id from public.countries c
 join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id
 where c.code='DZ'
   and cu.name_ar='اللغة العربية — الجزائر — السنة الثالثة ثانوي — شعبة اللغات الأجنبية'
   and g.grade_number=12 limit 1
), defs as (
 select * from jsonb_to_recordset((select data->'units' from tmp_dz_g12_languages))
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
 'dz-official-g12-languages-u'||lpad(e.unit_number::text,2,'0')||'-l'||lpad(e.lesson_number::text,2,'0'),
 e.lesson_number,e.lesson_number,'reading',
 'درس مواءمة أصلي من ضاديوم للنص «'||e.lesson_title||'» ضمن وحدة «'||e.unit_title||'» في التدرجات الرسمية للسنة الثالثة ثانوي - شعبة اللغات الأجنبية.',
 'لا يعيد هذا الدرس نشر النص المدرسي. استخدم النص الرسمي أو النسخة المرخصة، ثم حلّل الفكرة والبناء والدلالة والأسلوب، وأنجز استجابة أصلية داخل ضاديوم.',
 jsonb_build_array(
  'أن يحدد المتعلم الفكرة والمحور الأدبي للنص.',
  'أن يحلل المتعلم خصائص النص ودلالاته اعتمادًا على شاهد مناسب.',
  'أن ينتج المتعلم استجابة نقدية أو تفسيرية من صياغته الخاصة.'
 ),
 jsonb_build_array(
  jsonb_build_object('word','المحور','meaning','المجال الأدبي أو الفكري الذي ينتظم فيه النص.'),
  jsonb_build_object('word','الدلالة','meaning','المعنى الذي ينتجه السياق والبناء الفني.'),
  jsonb_build_object('word','الشاهد','meaning','دليل قصير يدعم الفهم أو التحليل.')
 ),
 jsonb_build_array(
  'اقرأ النص الرسمي وحدد فكرته العامة.',
  'استخرج شاهدًا قصيرًا وفسّر دلالته.',
  'اربط النص بخصائص الوحدة الأدبية.',
  'اكتب استجابة قصيرة ثم راجعها.'
 ),
 (select data->>'source' from tmp_dz_g12_languages),
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
 where c.code='DZ'
   and cu.name_ar='اللغة العربية — الجزائر — السنة الثالثة ثانوي — شعبة اللغات الأجنبية'
   and g.grade_number=12
)
insert into public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
select tl.id,q.n,
 case q.n when 1 then 'ما البداية الأنسب لدراسة «'||tl.title||'»؟'
              when 2 then 'ما الذي يجعل التحليل مقنعًا في وحدة «'||tl.unit_title||'»؟'
              else 'ما دور ضاديوم في هذا الدرس؟' end,
 'multiple_choice',
 case q.n
  when 1 then jsonb_build_array(
   jsonb_build_object('id','a','text','قراءة النص الرسمي وتحديد فكرته ومحوره.'),
   jsonb_build_object('id','b','text','حفظ إجابة جاهزة دون فهم.'),
   jsonb_build_object('id','c','text','تجاهل سياق الوحدة.'))
  when 2 then jsonb_build_array(
   jsonb_build_object('id','a','text','شاهد مناسب مع تفسير ودلالة واضحة.'),
   jsonb_build_object('id','b','text','إعادة كتابة العنوان فقط.'),
   jsonb_build_object('id','c','text','نسخ إجابة جاهزة.'))
  else jsonb_build_array(
   jsonb_build_object('id','a','text','شرح وتدريب أصلي مع الرجوع للنص الرسمي.'),
   jsonb_build_object('id','b','text','نسخ الكتاب كاملًا.'),
   jsonb_build_object('id','c','text','إلغاء دور المتعلم.'))
 end,
 'a',
 case q.n when 1 then 'القراءة الواعية للنص الرسمي وتحديد المحور هي نقطة البداية.'
              when 2 then 'التحليل الجيد يجمع بين الشاهد والتفسير والدلالة.'
              else 'ضاديوم يدعم المنهج بمحتوى أصلي ولا يعيد نشر النص المدرسي.' end,
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
 where c.code='DZ'
   and cu.name_ar='اللغة العربية — الجزائر — السنة الثالثة ثانوي — شعبة اللغات الأجنبية'
   and g.grade_number=12
)
insert into public.lesson_activities(
 lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required
)
select tl.id,
 case a.n when 1 then 'فهم النص' when 2 then 'تحليل الشاهد' else 'إنتاج نقدي' end,
 case a.n when 1 then 'reading' when 2 then 'multiple_choice' else 'writing' end,
 case a.n when 1 then 'حدد الفكرة العامة والمحور الأدبي للنص.'
              when 2 then 'اختر شاهدًا مناسبًا من النص الرسمي وفسر دلالته.'
              else 'اكتب فقرة نقدية أو تفسيرية قصيرة من صياغتك.' end,
 jsonb_build_object('origin','DADYOOM_DZ_G12_LANGUAGES_OFFICIAL','officialTitle',tl.title),
 a.n,5,true,
 case a.n when 1 then 'understanding' when 2 then 'analysis' else 'production' end,
 null,'{}'::jsonb,true
from tl cross join generate_series(1,3) a(n)
where not exists (
 select 1 from public.lesson_activities x
 where x.lesson_id=tl.id and x.activity_order=a.n
   and x.title=case a.n when 1 then 'فهم النص' when 2 then 'تحليل الشاهد' else 'إنتاج نقدي' end
);
