-- Bahrain National Arabic 2026-2027: original Dadyoom activities for official lessons.
-- This does NOT reproduce textbook prose. It adds interactive skill practice
-- around the audited national lesson hierarchy and Dadyoom-authored objectives.
-- Idempotent by lesson/order/origin marker.

with bh_curriculum as (
  select cu.id
  from public.curricula cu
  join public.countries co on co.id = cu.country_id
  where co.code = 'BH'
    and cu.name_ar = 'اللغة العربية'
    and cu.academic_year = '2026-2027'
),
bh_lessons as (
  select
    l.id as lesson_id,
    l.title as lesson_title,
    l.lesson_type,
    coalesce(
      nullif(trim(l.learning_objectives->>0), ''),
      'فهم المهارة الرئيسة في درس «' || l.title || '»'
    ) as concept,
    case
      when l.lesson_type = 'grammar'
        then 'أطبق القاعدة في جملة جديدة من إنشائي وأراجع صحة التركيب.'
      when l.lesson_type = 'writing'
        then 'أكتب نموذجًا قصيرًا جديدًا يحقق غرض الدرس ثم أراجعه وأحسنه.'
      when l.lesson_type = 'reading'
        then 'أقرأ نصًا مناسبًا آخر وأستخرج منه دليلًا يوضح المهارة المستهدفة.'
      when l.lesson_type = 'spelling'
        then 'أكتب كلمات وجملًا جديدة تطبق القاعدة الإملائية وأراجعها.'
      when l.lesson_type = 'listening'
        then 'أستمع إلى مثال جديد ثم ألخص الفكرة التي فهمتها بأسلوبي.'
      when l.lesson_type = 'speaking'
        then 'أقدم مثالًا شفهيًا جديدًا يطبق المهارة بوضوح وترتيب.'
      when l.lesson_type = 'assessment'
        then 'أراجع المهارات المطلوبة وأحل مثالًا جديدًا لكل مهارة.'
      else 'أطبق مهارة الدرس في مثال جديد من إنشائي وأشرح سبب صحة تطبيقي.'
    end as application_example
  from public.lessons l
  join public.units u on u.id = l.unit_id
  join public.grades g on g.id = u.grade_id
  join bh_curriculum bc on bc.id = g.curriculum_id
  where l.status = 'published'
),
activity_seed as (
  select
    lesson_id,
    1 as activity_order,
    'تحقق من هدف الدرس'::text as title,
    'multiple_choice'::text as activity_type,
    'اختر العبارة التي تعبّر بدقة عن الهدف الذي نتدرّب عليه.'::text as instructions,
    jsonb_build_object(
      'origin','DADYOOM_BH_OFFICIAL_ACTIVITY_V1',
      'options',jsonb_build_array(
        concept,
        'حفظ إجابة جاهزة دون فهم أو تطبيق',
        'تجاوز النشاط من غير محاولة',
        'اختيار إجابة عشوائية بلا دليل'
      )
    ) as content,
    5 as points,
    true as is_published,
    'assessment'::text as section,
    'ما الهدف الأقرب لدرس «' || lesson_title || '»؟'::text as prompt,
    jsonb_build_object('correct', concept) as answer,
    true as is_required
  from bh_lessons

  union all

  select
    lesson_id,
    2,
    'اختر التطبيق الأنسب',
    'multiple_choice',
    'اختر التصرف الذي يطبق مهارة الدرس بصورة صحيحة.',
    jsonb_build_object(
      'origin','DADYOOM_BH_OFFICIAL_ACTIVITY_V1',
      'options',jsonb_build_array(
        application_example,
        'أنسخ المثال كما هو من غير أن أفهمه',
        'أتجاهل القاعدة أو الفكرة التي تناولها الدرس',
        'أجيب قبل قراءة المطلوب'
      )
    ),
    5,
    true,
    'practice',
    'أي اختيار يمثل تطبيقًا أفضل لما تعلمته؟',
    jsonb_build_object('correct', application_example),
    true
  from bh_lessons

  union all

  select
    lesson_id,
    3,
    'طبّق بأسلوبك',
    case
      when lesson_type = 'speaking' then 'speaking'
      when lesson_type = 'listening' then 'listening'
      when lesson_type = 'reading' then 'reading'
      else 'writing'
    end,
    application_example,
    jsonb_build_object(
      'origin','DADYOOM_BH_OFFICIAL_ACTIVITY_V1',
      'text','أنشئ تطبيقًا جديدًا من عندك مرتبطًا بهدف الدرس.',
      'concept',concept
    ),
    5,
    true,
    'practice',
    'طبّق هدف الدرس في مثال جديد من إنشائك.',
    jsonb_build_object(
      'grading_mode','completion_only_reference',
      'model_answer',application_example
    ),
    true
  from bh_lessons
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
  where a.lesson_id = s.lesson_id
    and a.activity_order = s.activity_order
    and a.content->>'origin' = 'DADYOOM_BH_OFFICIAL_ACTIVITY_V1'
);
