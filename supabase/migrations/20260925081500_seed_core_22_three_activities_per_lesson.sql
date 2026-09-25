-- Dadyoom Core 22: three original activities per published core lesson.
-- Adds two auto-gradable checks plus one required application activity.
-- Idempotent by lesson/order/origin marker.

with core_curricula as (
  select cu.id, cu.country_id
  from public.curricula cu
  where cu.name_ar='المسار العربي الأساسي لضاديوم'
    and cu.academic_year='2026-2027'
),
core_lessons as (
  select
    l.id as lesson_id,
    l.title as lesson_title,
    l.lesson_type,
    g.grade_number,
    u.unit_number,
    l.lesson_number,
    t.concept,
    t.example
  from public.lessons l
  join public.units u on u.id=l.unit_id
  join public.grades g on g.id=u.grade_id
  join core_curricula cc on cc.id=g.curriculum_id
  join public.dadyoom_core_arabic_templates t
    on t.unit_no=u.unit_number
   and ((t.global_no-1)%6)+1=l.lesson_number
   and t.band=case
      when g.grade_number<=3 then 1
      when g.grade_number<=6 then 2
      when g.grade_number<=9 then 3
      else 4
   end
  where l.status='published'
),
activity_seed as (
  select
    lesson_id,
    1 as activity_order,
    'تحقق من هدف الدرس'::text as title,
    'multiple_choice'::text as activity_type,
    'اختر العبارة التي تعبّر بدقة عن المهارة التي نتدرّب عليها في هذا الدرس.'::text as instructions,
    jsonb_build_object(
      'origin','DADYOOM_CORE_22_ACTIVITY_V1',
      'options',jsonb_build_array(
        concept,
        'حفظ كلمات متفرقة دون فهم معناها أو استعمالها',
        'تجاوز المثال وعدم تنفيذ أي تطبيق',
        'نسخ الإجابة الجاهزة دون قراءة الدرس'
      )
    ) as content,
    5 as points,
    true as is_published,
    'assessment'::text as section,
    'ما المهارة الرئيسة التي نتدرّب عليها في درس «'||lesson_title||'»؟'::text as prompt,
    jsonb_build_object('correct',concept) as answer,
    true as is_required
  from core_lessons

  union all

  select
    lesson_id,
    2,
    'اختر التطبيق الأنسب',
    'multiple_choice',
    'اختر المثال أو التطبيق الذي ينسجم مع هدف الدرس.',
    jsonb_build_object(
      'origin','DADYOOM_CORE_22_ACTIVITY_V1',
      'options',jsonb_build_array(
        example,
        'أترك النشاط قبل أن أحاول فهمه',
        'أختار إجابة عشوائية بلا دليل',
        'أتجاهل القاعدة أو الفكرة التي شرحها الدرس'
      )
    ),
    5,
    true,
    'practice',
    'أي اختيار يطبّق ما تعلمته في هذا الدرس بصورة أفضل؟',
    jsonb_build_object('correct',example),
    true
  from core_lessons

  union all

  select
    lesson_id,
    3,
    'طبّق بأسلوبك',
    case
      when lesson_type='speaking' then 'speaking'
      when lesson_type='listening' then 'listening'
      when lesson_type='reading' then 'reading'
      else 'writing'
    end,
    case
      when lesson_type='speaking'
        then 'قل مثالًا جديدًا بصوت واضح يطبق مهارة الدرس، ثم راجع وضوح النطق والمعنى.'
      when lesson_type='listening'
        then 'استمع إلى شرح الدرس أو اقرأ المثال بصوت مسموع، ثم اكتب الفكرة التي فهمتها بأسلوبك.'
      when lesson_type='reading'
        then 'اقرأ المثال ثم اكتب جملة قصيرة تشرح كيف طبقت مهارة الدرس.'
      else 'اكتب مثالًا جديدًا من إنشائك يطبق مهارة الدرس، ثم راجعه وصحح ما يحتاج إلى تحسين.'
    end,
    jsonb_build_object(
      'origin','DADYOOM_CORE_22_ACTIVITY_V1',
      'text','أنشئ تطبيقًا جديدًا من عندك مرتبطًا بهدف الدرس.',
      'referenceExample',example,
      'concept',concept
    ),
    5,
    true,
    'practice',
    'طبّق «'||concept||'» في مثال جديد من إنشائك.',
    jsonb_build_object(
      'grading_mode','completion_only_reference',
      'model_answer',example
    ),
    true
  from core_lessons
)
insert into public.lesson_activities(
  lesson_id,title,activity_type,instructions,content,
  activity_order,points,is_published,section,prompt,answer,is_required
)
select
  s.lesson_id,s.title,s.activity_type,s.instructions,s.content,
  s.activity_order,s.points,s.is_published,s.section,s.prompt,s.answer,s.is_required
from activity_seed s
where not exists (
  select 1
  from public.lesson_activities a
  where a.lesson_id=s.lesson_id
    and a.activity_order=s.activity_order
    and a.content->>'origin'='DADYOOM_CORE_22_ACTIVITY_V1'
);
