-- Align every published Dadyoom Core lesson with the five-question
-- assessment contract used by scripts/seed-dadyoom-core-22.mjs.
-- Safe/idempotent: only question orders 4 and 5 are upserted.

with core_curricula as (
  select id
  from public.curricula
  where name_ar='المسار العربي الأساسي لضاديوم'
    and academic_year='2026-2027'
),
core_lessons as (
  select
    l.id,
    l.title
  from public.lessons l
  join public.units u on u.id=l.unit_id
  join public.grades g on g.id=u.grade_id
  join core_curricula cc on cc.id=g.curriculum_id
  where l.status='published'
),
question_seed as (
  select
    id as lesson_id,
    4 as question_order,
    'ما الخطوة الأفضل بعد فهم مثال درس «'||title||'»؟'::text as question,
    jsonb_build_array(
      jsonb_build_object('id','a','text','أطبّق المهارة في مثال جديد من إنشائي'),
      jsonb_build_object('id','b','text','أحفظ المثال فقط دون تطبيق'),
      jsonb_build_object('id','c','text','أتجاوز المراجعة والتدريب')
    ) as options,
    'a'::text as correct_answer,
    'إنتاج مثال جديد يثبت أن المتعلم يستطيع نقل المهارة من المثال إلى تطبيق مستقل.'::text as explanation
  from core_lessons

  union all

  select
    id,
    5,
    'كيف تتحقق من إتقان المهارة الأساسية في هذا الدرس؟',
    jsonb_build_array(
      jsonb_build_object('id','a','text','أطبّق المهارة ثم أراجع النتيجة وأصحح الخطأ'),
      jsonb_build_object('id','b','text','أقرأ عنوان الدرس فقط'),
      jsonb_build_object('id','c','text','أنسخ إجابة جاهزة دون فهم')
    ),
    'a',
    'الإتقان يظهر في التطبيق المستقل ثم المراجعة والتصحيح، وليس في الحفظ أو النسخ.'
  from core_lessons
)
insert into public.questions(
  lesson_id,
  question_order,
  question,
  question_type,
  options,
  correct_answer,
  explanation,
  points
)
select
  lesson_id,
  question_order,
  question,
  'multiple_choice',
  options,
  correct_answer,
  explanation,
  1
from question_seed
on conflict (lesson_id,question_order)
do update set
  question=excluded.question,
  question_type=excluded.question_type,
  options=excluded.options,
  correct_answer=excluded.correct_answer,
  explanation=excluded.explanation,
  points=excluded.points,
  updated_at=now();
