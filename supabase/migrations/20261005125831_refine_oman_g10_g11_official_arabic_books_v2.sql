-- Oman 2026/2027 secondary Arabic: replace generic official skill bundles
-- with the exact current Ministry textbook nodes.
-- G10 editions guide: https://ict.moe.gov.om/flyers/PDF/2025/EditionsGuide_2025/files/basic-html/page38.html
-- G11 editions guide: https://ict.moe.gov.om/flyers/PDF/2025/EditionsGuide_2025/files/basic-html/page41.html
-- No internal lesson title is inferred.

create temp table if not exists tmp_om_secondary_books(
  grade_number int,
  lesson_number int,
  title text,
  slug text,
  source_url text
) on commit drop;

truncate tmp_om_secondary_books;

insert into tmp_om_secondary_books values
  (10,1,'لغتي الجميلة — الفصل الدراسي الأول','om-official-g10-lughati-jamila-p1','https://ict.moe.gov.om/book/PDF/10/lugati_jamila_g10p1_Classical/index.html'),
  (10,2,'لغتي الجميلة — الفصل الدراسي الثاني','om-official-g10-lughati-jamila-p2','https://ict.moe.gov.om/book/PDF/10/lugati_jamila_g10p2_Classical/index.html'),
  (11,1,'المؤنس — الفصل الدراسي الأول','om-official-g11-muunis-p1','https://ict.moe.gov.om/flyers/PDF/2025/EditionsGuide_2025/files/basic-html/page41.html'),
  (11,2,'المؤنس — الفصل الدراسي الثاني','om-official-g11-muunis-p2','https://ict.moe.gov.om/flyers/PDF/2025/EditionsGuide_2025/files/basic-html/page41.html'),
  (11,3,'المفيد','om-official-g11-mufid','https://ict.moe.gov.om/flyers/PDF/2025/EditionsGuide_2025/files/basic-html/page41.html');

with target_units as (
  select u.id
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  where c.code='OM'
    and cu.name_ar='اللغة العربية — المطابقة الرسمية العُمانية'
    and g.grade_number in (10,11)
    and u.unit_number=1
)
update public.units u
set title='كتب اللغة العربية الرسمية المعتمدة — 2026/2027',
    description='كتب اللغة العربية الحالية المثبتة بدليل طبعات وزارة التربية والتعليم العُمانية للعام الدراسي 2026/2027؛ لا تُستنتج عناوين داخلية غير منشورة.'
from target_units t
where u.id=t.id;

with targets as (
  select l.id,g.grade_number,l.lesson_number
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  join public.lessons l on l.unit_id=u.id
  where c.code='OM'
    and cu.name_ar='اللغة العربية — المطابقة الرسمية العُمانية'
    and g.grade_number in (10,11)
    and u.unit_number=1
)
update public.lessons l
set title=d.title,
    slug=d.slug,
    lesson_type='reading',
    summary='عقدة كتاب رسمي معتمد للصف '||d.grade_number||' في العام الدراسي 2026/2027: «'||d.title||'».',
    content='تستخدم ضاديوم اسم الكتاب والفصل المثبتين في مصادر وزارة التربية والتعليم العُمانية لإثبات المواءمة فقط. الشرح والأنشطة أصلية، ولا تُفترض عناوين الدروس الداخلية قبل توفر فهرس حكومي قابل للتدقيق.',
    learning_objectives=jsonb_build_array(
      'أن يتعرف المتعلم الكتاب الرسمي المقرر لهذا المستوى.',
      'أن يربط تعلمه في ضاديوم بالمصدر الوزاري الصحيح.',
      'أن يستخدم مهارات اللغة العربية في أنشطة أصلية داعمة للكتاب.'
    ),
    vocabulary=jsonb_build_array(
      jsonb_build_object('word','الكتاب المقرر','meaning','المصدر الدراسي المعتمد رسميًا لهذا الصف.'),
      jsonb_build_object('word','المواءمة','meaning','ربط تعلم ضاديوم بالمقرر الرسمي دون إعادة نشر محتواه.'),
      jsonb_build_object('word','المصدر الرسمي','meaning','مرجع صادر أو مستضاف من وزارة التربية والتعليم.')
    ),
    instructions=jsonb_build_array(
      'تحقق من اسم الكتاب والفصل الدراسي.',
      'استخدم أنشطة ضاديوم لتدريب المهارات المرتبطة بالمقرر.',
      'ارجع إلى كتاب الوزارة عند الحاجة إلى النص الأصلي.'
    ),
    source_pdf_url=d.source_url,
    status='published',
    is_free=true,
    estimated_minutes=40,
    updated_at=now()
from targets t
join tmp_om_secondary_books d
  on d.grade_number=t.grade_number
 and d.lesson_number=t.lesson_number
where l.id=t.id;

with target_lessons as (
  select l.id,g.grade_number,l.lesson_number
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  join public.lessons l on l.unit_id=u.id
  where c.code='OM'
    and cu.name_ar='اللغة العربية — المطابقة الرسمية العُمانية'
    and g.grade_number in (10,11)
    and u.unit_number=1
)
update public.lessons l
set status='draft',updated_at=now()
from target_lessons t
where l.id=t.id
  and ((t.grade_number=10 and t.lesson_number>2) or (t.grade_number=11 and t.lesson_number>3));

with books as (
  select l.id,l.title
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  join public.lessons l on l.unit_id=u.id
  where c.code='OM'
    and cu.name_ar='اللغة العربية — المطابقة الرسمية العُمانية'
    and g.grade_number in (10,11)
    and l.status='published'
)
insert into public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
select b.id,q.n,
 case q.n
  when 1 then 'ما الذي يثبت أن «'||b.title||'» عقدة مطابقة رسمية في ضاديوم؟'
  when 2 then 'ما الاستخدام الصحيح لهذه العقدة داخل ضاديوم؟'
  else 'كيف تتعامل ضاديوم مع نصوص الكتاب الرسمي؟' end,
 'multiple_choice',
 case q.n
  when 1 then jsonb_build_array(
   jsonb_build_object('id','a','text','وجود مصدر صادر أو مستضاف من وزارة التربية والتعليم يثبت الكتاب.'),
   jsonb_build_object('id','b','text','تخمين اسم الكتاب من مواقع غير رسمية.'),
   jsonb_build_object('id','c','text','نسخ محتوى كتاب آخر.'))
  when 2 then jsonb_build_array(
   jsonb_build_object('id','a','text','دعم المقرر بأنشطة وشرح أصليين مع الرجوع للمصدر الرسمي.'),
   jsonb_build_object('id','b','text','اعتبار ضاديوم بديلًا عن كل مصادر الوزارة.'),
   jsonb_build_object('id','c','text','اختلاق فهرس غير منشور.'))
  else jsonb_build_array(
   jsonb_build_object('id','a','text','تحافظ على حقوق المصدر وتنتج شرحًا وتدريبًا أصليًا.'),
   jsonb_build_object('id','b','text','تعيد نشر الكتاب كاملًا.'),
   jsonb_build_object('id','c','text','تنسب محتوى الكتاب إلى ضاديوم.')) end,
 'a',
 case q.n
  when 1 then 'المطابقة هنا مبنية على مصدر الوزارة الحالي.'
  when 2 then 'ضاديوم تدعم الكتاب الرسمي ولا تدّعي استبداله.'
  else 'المحتوى التعليمي في ضاديوم أصلي مع استخدام بيانات البنية والمصدر فقط.' end,
 1
from books b cross join generate_series(1,3) q(n)
on conflict (lesson_id,question_order)
do update set question=excluded.question,question_type=excluded.question_type,options=excluded.options,
 correct_answer=excluded.correct_answer,explanation=excluded.explanation,points=excluded.points,updated_at=now();

with books as (
  select l.id,l.title
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  join public.lessons l on l.unit_id=u.id
  where c.code='OM'
    and cu.name_ar='اللغة العربية — المطابقة الرسمية العُمانية'
    and g.grade_number in (10,11)
    and l.status='published'
)
insert into public.lesson_activities(
 lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required
)
select b.id,
 case a.n when 1 then 'تحديد الكتاب الرسمي' when 2 then 'ربط المهارة بالمقرر' else 'تطبيق أصلي' end,
 case a.n when 1 then 'reading' when 2 then 'multiple_choice' else 'writing' end,
 case a.n
  when 1 then 'حدد اسم الكتاب والفصل الدراسي من بيانات المصدر الرسمية.'
  when 2 then 'اختر مهارة لغوية مناسبة يمكن تدريبها دون نسخ نص الكتاب.'
  else 'اكتب استجابة قصيرة أصلية مرتبطة بمهارة من مهارات العربية.' end,
 jsonb_build_object('origin','DADYOOM_OM_2026_2027_OFFICIAL_BOOKS','officialBook',b.title),
 a.n,5,true,
 case a.n when 1 then 'orientation' when 2 then 'skills' else 'production' end,
 null,'{}'::jsonb,true
from books b cross join generate_series(1,3) a(n)
where not exists (
 select 1 from public.lesson_activities x
 where x.lesson_id=b.id and x.activity_order=a.n
 and x.title=case a.n when 1 then 'تحديد الكتاب الرسمي' when 2 then 'ربط المهارة بالمقرر' else 'تطبيق أصلي' end
);
