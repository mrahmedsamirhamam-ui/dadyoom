-- Enrich Sudan Grade 10 Arabic with the official detailed 2026 syllabus topics.
-- Source: https://gmoe.gov.sd/wp-content/uploads/2026/01/%D9%85%D9%81%D8%B1%D8%AF%D8%A7%D8%AA-%D9%85%D9%82%D8%B1%D8%B1%D8%A7%D8%AA-%D8%A7%D9%84%D8%B5%D9%81-%D8%A7%D9%84%D8%A3%D9%88%D9%84-%D8%AB%D8%A7%D9%86%D9%88%D9%8A.pdf
-- Dadyoom stores official titles/structure only; lesson explanations/questions/activities are original.

create temp table if not exists tmp_sd_g10_detailed(data jsonb) on commit drop;
truncate tmp_sd_g10_detailed;
insert into tmp_sd_g10_detailed(data) values ('{"schemaVersion":1,"country":{"code":"SD","nameAr":"السودان"},"academicYear":"2026-2027","subject":"اللغة العربية","grade":{"number":10,"nameAr":"الصف الأول الثانوي"},"verificationStatus":"verified-official-detailed-syllabus","source":{"label":"وزارة التربية والتعليم - مفردات مقررات الصف الأول الثانوي المطور","url":"https://gmoe.gov.sd/wp-content/uploads/2026/01/%D9%85%D9%81%D8%B1%D8%AF%D8%A7%D8%AA-%D9%85%D9%82%D8%B1%D8%B1%D8%A7%D8%AA-%D8%A7%D9%84%D8%B5%D9%81-%D8%A7%D9%84%D8%A3%D9%88%D9%84-%D8%AB%D8%A7%D9%86%D9%88%D9%8A.pdf","publishedContext":"2026"},"units":[{"number":2,"title":"المطالعة والأدب — مفردات المقرر المطور 2026","lessons":["أهمية القراءة في حياتنا","معنى الإسلام","لمحة عن الأدب العربي","السودان أمي وأبي (قصيدة)","القراءة المفيدة","من مصادر المعرفة (المكتبة)","قيم وأخلاق (قصيدة)","الوقت هو الحياة","ما لم تنله زرقاء اليمامة (قصيدة)","الذكاء الاصطناعي","الاعتماد على الذات","القصة ومراحل تطورها","تبادلية (قصيدة)","التعامل مع الناس فن","عنترة في ذاكرة التاريخ","التمر","كيف يعود السودان أخضرًا","بطل من شرق بلادي (قصيدة)","حقوق الإنسان","الطلاب ومهارات المستقبل","معنى البطولة (قصيدة)","المسلمون وتحديات العصر","تعليم المرأة","لمحة عن المسرح السوداني","الحب الخالد قيس وليلى (قصيدة)","التنمية المستدامة","المرأة السودانية أيقونة الحياة"]},{"number":3,"title":"النحو والصرف — مفردات المقرر المطور 2026","lessons":["الجمل وأشباه الجمل التي لها محل من الإعراب","الإعراب التقديري للفعل المضارع","الجوازم","التوابع","المجرد والمزيد والبحث في المعاجم","الميزان الصرفي","صيغة النسب","النسب إلى المختوم بتاء التأنيث","النسب إلى المقصور","النسب إلى المنقوص","النسب إلى الممدود","النسب إلى ما فيه ياء مشددة","النسب إلى وزن فعيلة","النسب إلى الاسم الثلاثي مكسور العين","النسب إلى المركب","النسب إلى المثنى والجمع","لا التي تعمل عمل ليس","لا النافية للجنس","أنواع لا - مراجعة","همزتا القطع والوصل","اسم الفعل","العدد","بعض الأخطاء الشائعة"]},{"number":4,"title":"البلاغة والتعبير — مفردات المقرر المطور 2026","lessons":["مقدمة موجزة عن البلاغة","الفصاحة والبلاغة","الحقيقة والمجاز","الاستعارة","المجاز المرسل","الكناية","المحسنات اللفظية","الجناس","السجع","مختارات للاطلاع الذاتي"]}],"officialDetailedTopics":60,"copyrightPolicy":"تُخزن العناوين والبنية الرسمية فقط؛ الشرح والأسئلة والأنشطة داخل ضاديوم أصلية ولا تعيد نشر نصوص الكتاب."}'::jsonb);

with target as (
  select g.id grade_id
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  where c.code='SD'
    and cu.name_ar='اللغة العربية — المطابقة الرسمية السودانية'
    and g.grade_number=10
  limit 1
), defs as (
  select *
  from jsonb_to_recordset((select data->'units' from tmp_sd_g10_detailed))
  as x(number int,title text,lessons jsonb)
)
insert into public.units(grade_id,title,description,unit_number,sort_order)
select t.grade_id,d.title,'عناوين منشورة رسميًا ضمن مفردات مقرر العربية المطور للصف الأول الثانوي.',d.number,d.number
from target t cross join defs d
on conflict (grade_id,unit_number)
do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order;

with target as (
  select g.id grade_id
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  where c.code='SD'
    and cu.name_ar='اللغة العربية — المطابقة الرسمية السودانية'
    and g.grade_number=10
  limit 1
), defs as (
  select *
  from jsonb_to_recordset((select data->'units' from tmp_sd_g10_detailed))
  as x(number int,title text,lessons jsonb)
), expanded as (
  select d.number unit_number,d.title unit_title,
         row_number() over(partition by d.number order by ordinality)::int lesson_number,
         lesson #>> '{}' lesson_title
  from defs d
  cross join lateral jsonb_array_elements(d.lessons) with ordinality as e(lesson,ordinality)
), target_units as (
  select u.id,u.unit_number
  from public.units u join target t on t.grade_id=u.grade_id
  where u.unit_number in (2,3,4)
)
insert into public.lessons(
  unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,content,
  learning_objectives,vocabulary,instructions,source_pdf_url,status,is_free,estimated_minutes
)
select
  tu.id,e.lesson_title,
  'sd-official-g10-u'||lpad(e.unit_number::text,2,'0')||'-l'||lpad(e.lesson_number::text,2,'0'),
  e.lesson_number,e.lesson_number,
  case when e.unit_number=3 then 'grammar' else 'reading' end,
  'درس مواءمة أصلي من ضاديوم لموضوع «'||e.lesson_title||'» ضمن مفردات مقرر اللغة العربية المطور للصف الأول الثانوي في السودان.',
  case when e.unit_number=3
    then 'هذا الدرس لا يعيد نشر نص الكتاب المدرسي. يشرح ضاديوم موضوع «'||e.lesson_title||'» بأمثلة أصلية، ثم يدرّب المتعلم على اكتشاف القاعدة وتطبيقها وتصحيح الخطأ مع التعليل.'
    else 'هذا الدرس لا يعيد نشر النص المدرسي. استخدم كتابك الرسمي أو النسخة المرخصة للموضوع «'||e.lesson_title||'»، ثم حدّد الفكرة والمفردات والدلالة والبنية، واستخرج شاهدًا مناسبًا، واكتب استجابة من صياغتك.'
  end,
  jsonb_build_array(
    'أن يفهم المتعلم متطلبات موضوع «'||e.lesson_title||'».',
    'أن يطبق المتعلم المهارة المرتبطة بالموضوع في مثال جديد.',
    'أن يراجع المتعلم أداءه ويصحح الخطأ وفق معيار واضح.'
  ),
  case when e.unit_number=3 then
    jsonb_build_array(
      jsonb_build_object('word','قاعدة','meaning','نمط لغوي يفسر الاستعمال الصحيح.'),
      jsonb_build_object('word','تطبيق','meaning','استخدام القاعدة في مثال جديد.'),
      jsonb_build_object('word','مراجعة','meaning','فحص الإجابة وتصحيحها مع التعليل.')
    )
  else
    jsonb_build_array(
      jsonb_build_object('word','فكرة','meaning','المعنى المركزي للموضوع.'),
      jsonb_build_object('word','دلالة','meaning','المعنى الذي ينتجه السياق.'),
      jsonb_build_object('word','شاهد','meaning','دليل يدعم الفهم أو التفسير.')
    )
  end,
  jsonb_build_array('اقرأ العنوان وحدد المهارة المطلوبة.','طبّق المهارة على مثال أو نص أصلي.','راجع إجابتك وعدّلها قبل الإنهاء.'),
  (select data->'source'->>'url' from tmp_sd_g10_detailed),
  'published',true,30
from expanded e join target_units tu on tu.unit_number=e.unit_number
on conflict (unit_id,lesson_number)
do update set
 title=excluded.title,slug=excluded.slug,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
 summary=excluded.summary,content=excluded.content,learning_objectives=excluded.learning_objectives,
 vocabulary=excluded.vocabulary,instructions=excluded.instructions,source_pdf_url=excluded.source_pdf_url,
 status='published',is_free=true,estimated_minutes=excluded.estimated_minutes,updated_at=now();

with target_lessons as (
  select l.id,l.title
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  join public.lessons l on l.unit_id=u.id
  where c.code='SD' and cu.name_ar='اللغة العربية — المطابقة الرسمية السودانية'
    and g.grade_number=10 and u.unit_number in (2,3,4)
)
insert into public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
select tl.id,q.n,
 case q.n when 1 then 'ما أفضل بداية لدراسة «'||tl.title||'»؟'
              when 2 then 'ما الدليل الأقوى على إتقان «'||tl.title||'»؟'
              else 'ما دور ضاديوم في هذا الدرس؟' end,
 'multiple_choice',
 case q.n
   when 1 then jsonb_build_array(
     jsonb_build_object('id','a','text','أفهم المطلوب ثم أطبقه على مثال جديد.'),
     jsonb_build_object('id','b','text','أحفظ الإجابة دون فهم.'),
     jsonb_build_object('id','c','text','أتجاوز التدريب.'))
   when 2 then jsonb_build_array(
     jsonb_build_object('id','a','text','تطبيق مستقل مع تفسير ومراجعة.'),
     jsonb_build_object('id','b','text','تكرار العنوان فقط.'),
     jsonb_build_object('id','c','text','نسخ إجابة جاهزة.'))
   else jsonb_build_array(
     jsonb_build_object('id','a','text','الشرح والتدريب والمراجعة بمحتوى أصلي.'),
     jsonb_build_object('id','b','text','نسخ الكتاب المدرسي كاملًا.'),
     jsonb_build_object('id','c','text','إلغاء دور المتعلم.'))
 end,
 'a',
 case q.n when 1 then 'الفهم ثم التطبيق هو بداية التعلم الفعّال.'
          when 2 then 'التطبيق المستقل والمراجعة يثبتان الإتقان.'
          else 'ضاديوم يدعم التعلم بمحتوى أصلي ولا يعيد نشر الكتاب.' end,
 1
from target_lessons tl cross join generate_series(1,3) q(n)
on conflict (lesson_id,question_order)
do update set question=excluded.question,question_type=excluded.question_type,options=excluded.options,
 correct_answer=excluded.correct_answer,explanation=excluded.explanation,points=excluded.points,updated_at=now();

with target_lessons as (
  select l.id,l.title
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  join public.lessons l on l.unit_id=u.id
  where c.code='SD' and cu.name_ar='اللغة العربية — المطابقة الرسمية السودانية'
    and g.grade_number=10 and u.unit_number in (2,3,4)
)
insert into public.lesson_activities(
 lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required
)
select tl.id,
 case a.n when 1 then 'فهم موجّه' when 2 then 'تطبيق مستقل' else 'إنتاج ومراجعة' end,
 case a.n when 1 then 'multiple_choice' when 2 then 'reading' else 'writing' end,
 case a.n when 1 then 'حدد المهارة الرئيسة التي يحتاجها هذا الموضوع.'
          when 2 then 'طبّق المهارة على مثال أو نص جديد من صياغة ضاديوم أو كتابك الرسمي.'
          else 'اكتب استجابة قصيرة ثم راجعها وفق معيار النجاح.' end,
 jsonb_build_object('origin','DADYOOM_SD_G10_OFFICIAL_2026_V2','officialTitle',tl.title),
 a.n,5,true,
 case a.n when 1 then 'assessment' when 2 then 'practice' else 'production' end,
 null,'{}'::jsonb,true
from target_lessons tl cross join generate_series(1,3) a(n)
where not exists (
 select 1 from public.lesson_activities x
 where x.lesson_id=tl.id and x.activity_order=a.n
   and x.title=case a.n when 1 then 'فهم موجّه' when 2 then 'تطبيق مستقل' else 'إنتاج ومراجعة' end
);
