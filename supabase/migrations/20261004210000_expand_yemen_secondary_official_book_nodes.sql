-- Yemen secondary Arabic: verified official book-level nodes from the Ministry e-learning grade indexes.
-- Only titles visibly indexed by the official portal are added. No lesson-level TOC is inferred.
with defs(grade_number, lesson_number, title, source_url) as (
  values
  (10,2,'النحو والصرف','https://e-learning-moe.edu.ye/ClassTen.php?id=10'),
  (10,3,'الأدب والنصوص والبلاغة','https://e-learning-moe.edu.ye/ClassTen.php?id=10'),
  (11,2,'الأدب والنصوص والبلاغة','https://e-learning-moe.edu.ye/ClassEleven.php'),
  (12,2,'النحو والصرف','https://e-learning-moe.edu.ye/ClassTwelve.php'),
  (12,3,'الأدب والنصوص والبلاغة','https://e-learning-moe.edu.ye/ClassTwelve.php'),
  (12,4,'القراءة','https://e-learning-moe.edu.ye/ClassTwelve.php')
),
target as (
  select g.grade_number,u.id unit_id
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  where c.code='YE'
    and cu.name_ar='اللغة العربية — المطابقة الرسمية اليمنية'
    and g.grade_number between 10 and 12
    and u.title='اللغة العربية — حزمة الكتب الرسمية'
)
insert into public.lessons(
  unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,content,
  learning_objectives,vocabulary,instructions,source_pdf_url,status,is_free,estimated_minutes
)
select t.unit_id,d.title,
       'ye-official-g'||d.grade_number::text||'-book-'||lpad(d.lesson_number::text,2,'0'),
       d.lesson_number,d.lesson_number,'reading',
       'عقدة مواءمة لكتاب «'||d.title||'» الظاهر في فهرس الصف الرسمي اليمني.',
       'استخدم الكتاب الرسمي أو النسخة المرخصة مرجعًا، ويقدم ضاديوم شرحًا وتدريبًا أصليين دون إعادة نشر محتوى الكتاب.',
       jsonb_build_array(
         'أن يحدد المتعلم مجال الكتاب ومهاراته الرئيسة.',
         'أن يربط تعلمه بالمصدر الرسمي.',
         'أن يطبق مهارات اللغة العربية في تدريب أصلي.'
       ),
       jsonb_build_array(
         jsonb_build_object('word','المصدر الرسمي','meaning','فهرس أو كتاب صادر عن الجهة التعليمية الرسمية.'),
         jsonb_build_object('word','المواءمة','meaning','ربط محتوى ضاديوم بالنطاق الرسمي دون نسخه.')
       ),
       jsonb_build_array('ارجع إلى الكتاب الرسمي.','اختر المهارة المستهدفة.','أنجز تدريب ضاديوم الأصلي المرتبط بها.'),
       d.source_url,'published',true,30
from defs d join target t using(grade_number)
on conflict (unit_id,lesson_number) do update
set title=excluded.title,slug=excluded.slug,sort_order=excluded.sort_order,
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
  where c.code='YE' and cu.name_ar='اللغة العربية — المطابقة الرسمية اليمنية'
    and g.grade_number between 10 and 12 and l.slug like 'ye-official-g%-book-%'
)
insert into public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
select tl.id,q.n,
 case q.n when 1 then 'ما المرجع الأساسي لدراسة «'||tl.title||'»؟'
          when 2 then 'ما وظيفة ضاديوم إلى جانب الكتاب الرسمي؟'
          else 'أي ممارسة تحافظ على سلامة المواءمة؟' end,
 'multiple_choice',
 case q.n
   when 1 then jsonb_build_array(jsonb_build_object('id','a','text','الكتاب أو الفهرس الرسمي.'),jsonb_build_object('id','b','text','عنوان غير موثق.'),jsonb_build_object('id','c','text','مصدر مجهول.'))
   when 2 then jsonb_build_array(jsonb_build_object('id','a','text','شرح وتدريب أصليان.'),jsonb_build_object('id','b','text','نسخ الكتاب.'),jsonb_build_object('id','c','text','استبدال المنهج الرسمي.'))
   else jsonb_build_array(jsonb_build_object('id','a','text','الرجوع للمصدر الرسمي مع إنتاج استجابات أصلية.'),jsonb_build_object('id','b','text','اختلاق عناوين دروس.'),jsonb_build_object('id','c','text','إهمال المصدر.')) end,
 'a','المواءمة الصحيحة تبقي الكتاب الرسمي مرجعًا وتضيف شرحًا وتدريبًا أصليين.',1
from tl cross join generate_series(1,3) q(n)
on conflict (lesson_id,question_order) do update
set question=excluded.question,question_type=excluded.question_type,options=excluded.options,
    correct_answer=excluded.correct_answer,explanation=excluded.explanation,points=excluded.points,updated_at=now();

with tl as (
  select l.id,l.title
  from public.countries c
  join public.curricula cu on cu.country_id=c.id
  join public.grades g on g.curriculum_id=cu.id
  join public.units u on u.grade_id=g.id
  join public.lessons l on l.unit_id=u.id
  where c.code='YE' and cu.name_ar='اللغة العربية — المطابقة الرسمية اليمنية'
    and g.grade_number between 10 and 12 and l.slug like 'ye-official-g%-book-%'
)
insert into public.lesson_activities(lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required)
select tl.id,
 case a.n when 1 then 'تحديد المهارة' when 2 then 'تطبيق قصير' else 'انعكاس تعلم' end,
 case a.n when 1 then 'reading' when 2 then 'writing' else 'writing' end,
 case a.n when 1 then 'حدد المجال أو المهارة التي يعمل عليها كتاب «'||tl.title||'».'
          when 2 then 'أنجز تطبيقًا أصليًا قصيرًا مستندًا إلى المهارة التي تدرسها.'
          else 'اكتب ما تعلمته وما تحتاج إلى مراجعته في المصدر الرسمي.' end,
 jsonb_build_object('origin','DADYOOM_YE_SECONDARY_OFFICIAL_BOOK_NODE','officialBook',tl.title),
 a.n,5,true,case a.n when 1 then 'understanding' when 2 then 'application' else 'reflection' end,
 null,'{}'::jsonb,true
from tl cross join generate_series(1,3) a(n)
where not exists (
 select 1 from public.lesson_activities x
 where x.lesson_id=tl.id and x.activity_order=a.n
   and x.title=case a.n when 1 then 'تحديد المهارة' when 2 then 'تطبيق قصير' else 'انعكاس تعلم' end
);