-- Backfill original Dadyoom orientation QA for the remaining Tunisia Grade 13
-- official-book nodes. No textbook text or internal lesson title is reproduced.

with targets as (
  select l.id,l.title
  from public.lessons l
  where l.slug in (
    'tn-official-g13-arabic-201421',
    'tn-official-g13-arabic-201422',
    'tn-official-g13-arabic-201481'
  )
  and l.status='published'
)
insert into public.questions(
  lesson_id,question_order,question,question_type,options,correct_answer,explanation,points
)
select t.id,q.n,
  case q.n
    when 1 then 'ما الاستخدام الصحيح لعقدة الكتاب الرسمي «'||t.title||'» داخل ضاديوم؟'
    when 2 then 'ما المرجع المعتمد عند الحاجة إلى النص الأصلي للكتاب؟'
    else 'كيف تدعم ضاديوم هذا الكتاب دون إعادة نشر محتواه؟'
  end,
  'multiple_choice',
  case q.n
    when 1 then jsonb_build_array(
      jsonb_build_object('id','a','text','ربط التعلم بالمصدر الرسمي مع أنشطة ضاديوم الأصلية.'),
      jsonb_build_object('id','b','text','اعتبار عنوان الكتاب عنوانًا لكل درس داخله.'),
      jsonb_build_object('id','c','text','اختلاق فهرس غير منشور.'))
    when 2 then jsonb_build_array(
      jsonb_build_object('id','a','text','المصدر الرسمي للمركز الوطني البيداغوجي CNP.'),
      jsonb_build_object('id','b','text','أي موقع غير رسمي.'),
      jsonb_build_object('id','c','text','إجابة مولدة بلا مصدر.'))
    else jsonb_build_array(
      jsonb_build_object('id','a','text','بشرح وتدريب أصليين على المهارات مع الإحالة إلى الكتاب الرسمي.'),
      jsonb_build_object('id','b','text','بنسخ نصوص الكتاب كاملة.'),
      jsonb_build_object('id','c','text','بتغيير اسم الكتاب الرسمي.'))
  end,
  'a',
  case q.n
    when 1 then 'العقدة توثق مواءمة ضاديوم مع الكتاب الرسمي ولا تستبدل فهرسه.'
    when 2 then 'المصدر المرجعي هو CNP التونسي الرسمي.'
    else 'ضاديوم تضيف محتوى تدريبيًا أصليًا وتحافظ على حقوق المصدر.'
  end,
  1
from targets t
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

with targets as (
  select l.id,l.title
  from public.lessons l
  where l.slug in (
    'tn-official-g13-arabic-201421',
    'tn-official-g13-arabic-201422',
    'tn-official-g13-arabic-201481'
  )
  and l.status='published'
)
insert into public.lesson_activities(
  lesson_id,title,activity_type,instructions,content,activity_order,
  points,is_published,section,prompt,answer,is_required
)
select t.id,
  case a.n
    when 1 then 'التعرف إلى الكتاب الرسمي'
    when 2 then 'ربط الكتاب بمهارة'
    else 'تطبيق أصلي'
  end,
  case a.n
    when 1 then 'reading'
    when 2 then 'multiple_choice'
    else 'writing'
  end,
  case a.n
    when 1 then 'حدد اسم الكتاب ومستواه، ثم تحقق من المصدر الرسمي المرتبط به.'
    when 2 then 'اختر مهارة لغوية مناسبة يمكن تدريبها أثناء دراسة هذا الكتاب دون نسخ نصه.'
    else 'اكتب استجابة قصيرة أصلية تطبق فيها مهارة لغوية مرتبطة بتعلمك.'
  end,
  jsonb_build_object('origin','DADYOOM_TN_OFFICIAL_BOOK_ORIENTATION','officialBook',t.title),
  a.n,5,true,
  case a.n when 1 then 'orientation' when 2 then 'skills' else 'production' end,
  null,'{}'::jsonb,true
from targets t
cross join generate_series(1,3) a(n)
where not exists (
  select 1 from public.lesson_activities x
  where x.lesson_id=t.id
    and x.activity_order=a.n
    and x.title=case a.n
      when 1 then 'التعرف إلى الكتاب الرسمي'
      when 2 then 'ربط الكتاب بمهارة'
      else 'تطبيق أصلي'
    end
);
