-- Yemen secondary Arabic official book nodes.
-- Direct files are hosted by the Ministry's General Directorate of E-Learning.
-- This migration models verified textbook/book-part nodes only; it does not invent internal lesson titles.

-- Hide the old catch-all bundle placeholders from published catalog output.
update public.lessons l
set status='draft', updated_at=now()
from public.units u
join public.grades g on g.id=u.grade_id
join public.curricula cu on cu.id=g.curriculum_id
join public.countries c on c.id=cu.country_id
where l.unit_id=u.id
  and c.code='YE'
  and cu.name_ar='اللغة العربية — المطابقة الرسمية اليمنية'
  and g.grade_number in (11,12)
  and l.title in (
    'اللغة العربية — الصف 2 الثانوي — حزمة الكتب الرسمية',
    'اللغة العربية — الصف 3 الثانوي — حزمة الكتب الرسمية'
  );

-- Normalize the existing G11 literature node to part 1 and direct official PDF.
update public.lessons l
set title='الأدب والنصوص والبلاغة — الجزء الأول',
    slug='ye-official-g11-nosos-part1',
    lesson_number=2,
    sort_order=2,
    lesson_type='reading',
    source_pdf_url='https://e-learning-moe.edu.ye/adel/android_1/book_11/nosos_part1_11th.pdf',
    summary='عقدة مواءمة لكتاب الأدب والنصوص والبلاغة — الجزء الأول للصف الثاني الثانوي، كما هو منشور على بوابة التعليم الإلكتروني الرسمية اليمنية.',
    content='استخدم الكتاب الرسمي أو نسخة مرخصة منه مرجعًا، بينما تقدم ضاديوم شرحًا وتدريبًا أصليين دون إعادة نشر النص المحمي.',
    status='published',
    updated_at=now()
from public.units u
join public.grades g on g.id=u.grade_id
join public.curricula cu on cu.id=g.curriculum_id
join public.countries c on c.id=cu.country_id
where l.unit_id=u.id
  and c.code='YE'
  and cu.name_ar='اللغة العربية — المطابقة الرسمية اليمنية'
  and g.grade_number=11
  and l.title='الأدب والنصوص والبلاغة';

with target_unit as (
  select u.id
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  where c.code='YE'
    and cu.name_ar='اللغة العربية — المطابقة الرسمية اليمنية'
    and g.grade_number=11
  order by u.unit_number
  limit 1
), defs(title,slug,n,lesson_type,url) as (
  values
    ('الأدب والنصوص والبلاغة — الجزء الثاني','ye-official-g11-nosos-part2',3,'reading','https://e-learning-moe.edu.ye/adel/android_1/book_11/nosos_part2_11th.pdf'),
    ('القراءة — الجزء الأول','ye-official-g11-reading-part1',4,'reading','https://e-learning-moe.edu.ye/adel/android_1/book_11/reading_part1_11th.pdf'),
    ('القراءة — الجزء الثاني','ye-official-g11-reading-part2',5,'reading','https://e-learning-moe.edu.ye/adel/android_1/book_11/reading_part2_11th.pdf'),
    ('النحو والصرف — الجزء الأول','ye-official-g11-nahw-part1',6,'grammar','https://e-learning-moe.edu.ye/adel/android_1/book_11/nahw_part1_11th.pdf')
)
insert into public.lessons(
  unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,content,
  learning_objectives,vocabulary,instructions,source_pdf_url,status,is_free,estimated_minutes
)
select tu.id,d.title,d.slug,d.n,d.n,d.lesson_type,
  'عقدة مواءمة للكتاب الرسمي «'||d.title||'» للصف الثاني الثانوي في اليمن.',
  'راجع الكتاب الرسمي أو نسخة مرخصة منه، ثم استخدم أنشطة ضاديوم الأصلية للفهم والتطبيق دون إعادة نشر محتوى الكتاب.',
  jsonb_build_array(
    'أن يحدد المتعلم مجال الكتاب ووظيفته ضمن مقرر اللغة العربية.',
    'أن يستخدم المتعلم الكتاب الرسمي مرجعًا للمادة المقررة.',
    'أن يطبق المتعلم مهارة مناسبة من خلال تدريب أصلي في ضاديوم.'
  ),
  jsonb_build_array(
    jsonb_build_object('word','المرجع الرسمي','meaning','الكتاب المدرسي المنشور من الجهة التعليمية الرسمية.'),
    jsonb_build_object('word','المواءمة','meaning','ربط تدريب ضاديوم بالمادة الرسمية دون نسخها.')
  ),
  jsonb_build_array(
    'افتح الكتاب الرسمي أو نسخته المرخصة.',
    'حدد الدرس المطلوب داخل الكتاب وفق توجيه المعلم.',
    'أنجز تدريب ضاديوم الأصلي المرتبط بالمهارة.'
  ),
  d.url,'published',true,35
from target_unit tu cross join defs d
on conflict (unit_id,lesson_number)
do update set
  title=excluded.title,slug=excluded.slug,sort_order=excluded.sort_order,
  lesson_type=excluded.lesson_type,summary=excluded.summary,content=excluded.content,
  learning_objectives=excluded.learning_objectives,vocabulary=excluded.vocabulary,
  instructions=excluded.instructions,source_pdf_url=excluded.source_pdf_url,
  status='published',is_free=true,estimated_minutes=excluded.estimated_minutes,updated_at=now();

-- Attach the three already-verified G12 nodes to their direct official files and correct lesson type.
update public.lessons l
set source_pdf_url=case l.title
      when 'الأدب والنصوص والبلاغة' then 'https://e-learning-moe.edu.ye/adel/android_1/book_12/nosos_12th.pdf'
      when 'القراءة' then 'https://e-learning-moe.edu.ye/adel/android_1/book_12/reading_12th.pdf'
      when 'النحو والصرف' then 'https://e-learning-moe.edu.ye/adel/android_1/book_12/nahw_12th.pdf'
      else l.source_pdf_url
    end,
    lesson_type=case when l.title='النحو والصرف' then 'grammar' else 'reading' end,
    updated_at=now()
from public.units u
join public.grades g on g.id=u.grade_id
join public.curricula cu on cu.id=g.curriculum_id
join public.countries c on c.id=cu.country_id
where l.unit_id=u.id
  and c.code='YE'
  and cu.name_ar='اللغة العربية — المطابقة الرسمية اليمنية'
  and g.grade_number=12
  and l.title in ('الأدب والنصوص والبلاغة','القراءة','النحو والصرف');

-- Create three original questions and activities for any newly inserted G11 book nodes.
with target_lessons as (
  select l.id,l.title
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  join public.lessons l on l.unit_id=u.id
  where c.code='YE'
    and cu.name_ar='اللغة العربية — المطابقة الرسمية اليمنية'
    and g.grade_number=11
    and l.status='published'
)
insert into public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
select tl.id,q.n,
  case q.n
    when 1 then 'ما المرجع الأساسي لدراسة «'||tl.title||'»؟'
    when 2 then 'ما الاستخدام الصحيح لضاديوم مع هذا الكتاب؟'
    else 'لماذا لا تعيد ضاديوم نشر نص الكتاب كاملًا؟'
  end,
  'multiple_choice',
  case q.n
    when 1 then jsonb_build_array(
      jsonb_build_object('id','a','text','الكتاب الرسمي أو نسخته المرخصة.'),
      jsonb_build_object('id','b','text','عنوان الكتاب فقط دون الرجوع إليه.'),
      jsonb_build_object('id','c','text','أي نص غير موثق من الإنترنت.')
    )
    when 2 then jsonb_build_array(
      jsonb_build_object('id','a','text','استخدام شرح وتدريب أصليين لدعم المادة الرسمية.'),
      jsonb_build_object('id','b','text','استبدال الكتاب الرسمي بالكامل.'),
      jsonb_build_object('id','c','text','نسخ صفحات الكتاب إلى المنصة.')
    )
    else jsonb_build_array(
      jsonb_build_object('id','a','text','للحفاظ على حقوق المحتوى مع تقديم تعلم أصلي.'),
      jsonb_build_object('id','b','text','لأن الكتاب غير مهم.'),
      jsonb_build_object('id','c','text','لأن عنوان الكتاب غير معروف.')
    )
  end,
  'a',
  case q.n
    when 1 then 'المرجع هو الكتاب الرسمي المنشور من الجهة التعليمية.'
    when 2 then 'ضاديوم تدعم المقرر بشرح وتدريب أصليين دون أن تحل محل الكتاب.'
    else 'تحتفظ المنصة بالعناوين والبنية وتنتج المحتوى التدريبي بنفسها.'
  end,
  1
from target_lessons tl
cross join generate_series(1,3) q(n)
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
  where c.code='YE'
    and cu.name_ar='اللغة العربية — المطابقة الرسمية اليمنية'
    and g.grade_number=11
    and l.status='published'
)
insert into public.lesson_activities(
  lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required
)
select tl.id,
  case a.n when 1 then 'تحديد موضع الدراسة' when 2 then 'فهم المهارة' else 'تطبيق أصيل' end,
  case a.n when 3 then 'writing' else 'reading' end,
  case a.n
    when 1 then 'حدد الوحدة أو الدرس المطلوب داخل «'||tl.title||'» وفق الكتاب الرسمي.'
    when 2 then 'لخص المهارة أو الفكرة المطلوبة بكلماتك بعد الرجوع إلى المصدر الرسمي.'
    else 'أنجز مثالًا أو استجابة قصيرة من صياغتك تطبق ما تعلمته.'
  end,
  jsonb_build_object('origin','DADYOOM_YE_G11_OFFICIAL_BOOKS','officialBook',tl.title),
  a.n,5,true,
  case a.n when 1 then 'orientation' when 2 then 'understanding' else 'production' end,
  null,'{}'::jsonb,true
from target_lessons tl
cross join generate_series(1,3) a(n)
where not exists (
  select 1 from public.lesson_activities x
  where x.lesson_id=tl.id and x.activity_order=a.n
    and x.title=case a.n when 1 then 'تحديد موضع الدراسة' when 2 then 'فهم المهارة' else 'تطبيق أصيل' end
);
