-- Production counterpart: close_legacy_questions_and_vocabulary_gaps.
-- Adds original Dadyoom practice questions to partial EG/JO/LY/PS packs and
-- baseline skill vocabulary to Bahrain grades 2-9 where the external
-- lesson_vocabulary table was empty. It does not alter curriculum titles/order
-- and does not copy protected textbook prose.

with target as (
  select l.id,l.title,l.lesson_type
  from public.lessons l
  join public.units u on u.id=l.unit_id
  join public.grades g on g.id=u.grade_id
  join public.curricula cu on cu.id=g.curriculum_id
  join public.countries c on c.id=cu.country_id
  where l.status='published'
    and c.code in ('EG','JO','LY','PS')
    and (select count(*) from public.questions q where q.lesson_id=l.id)<3
),
q as (
  select id lesson_id,1 question_order,
    'ما أفضل بداية لدراسة «'||title||'»؟' question,
    jsonb_build_array(
      jsonb_build_object('id','a','text',
        case lesson_type
          when 'reading' then 'أقرأ المادة بتركيز وأحدد فكرتها والكلمات أو الشواهد المهمة.'
          when 'writing' then 'أحدد الغرض والفكرة ثم أضع مخططًا قبل الكتابة.'
          when 'grammar' then 'ألاحظ أمثلة وأستنتج القاعدة ووظيفة عناصر الجملة.'
          when 'spelling' then 'أقارن أمثلة صحيحة وألاحظ نمط الكتابة قبل التطبيق.'
          when 'vocabulary' then 'أفهم الكلمة في سياقها ثم أستخدمها في جملة جديدة.'
          when 'listening' then 'أستمع مرة للفكرة العامة ثم أعيد الاستماع للتفاصيل.'
          when 'speaking' then 'أحدد الفكرة ثم أتدرب على نطقها وتقديمها بوضوح.'
          else 'أفهم المطلوب أولًا ثم أطبقه على مثال جديد.'
        end),
      jsonb_build_object('id','b','text','أحفظ إجابة جاهزة دون فهم الدرس.'),
      jsonb_build_object('id','c','text','أتجاوز الشرح وأختار إجابة عشوائية.')
    ) options,
    'a' correct_answer,
    'الفهم والملاحظة أو التخطيط يسبقان الإجابة النهائية.' explanation
  from target
  union all
  select id,2,
    'ما الدليل الأقوى على أنك أتقنت هذا الدرس؟',
    jsonb_build_array(
      jsonb_build_object('id','a','text',
        case lesson_type
          when 'reading' then 'أشرح الفكرة بلغتي وأستدل من المادة التي أدرسها.'
          when 'writing' then 'أنتج نصًا منظمًا ثم أراجعه وأحسنه.'
          when 'grammar' then 'أطبق القاعدة على جملة جديدة وأفسر اختياري.'
          when 'spelling' then 'أكتب كلمات جديدة وفق النمط وأفسر سبب الكتابة.'
          when 'vocabulary' then 'أستخدم المفردة استخدامًا صحيحًا في سياق جديد.'
          when 'listening' then 'أستخرج الفكرة والتفاصيل بعد الاستماع.'
          when 'speaking' then 'أتحدث بجمل واضحة ومترابطة وأراجع نطقي.'
          else 'أطبق ما تعلمته في مهمة جديدة وأشرح سبب إجابتي.'
        end),
      jsonb_build_object('id','b','text','أكرر عنوان الدرس فقط.'),
      jsonb_build_object('id','c','text','أنسخ حلًا لا أفهمه.')
    ),
    'a',
    'الإتقان يظهر في التطبيق والتفسير، لا في الحفظ المجرد.'
  from target
  union all
  select id,3,
    'كيف تستخدم ضاد بطريقة تساعدك على التعلم في «'||title||'»؟',
    jsonb_build_array(
      jsonb_build_object('id','a','text','أحاول أولًا ثم أطلب تلميحًا أو مراجعة وأصحح إجابتي بنفسي.'),
      jsonb_build_object('id','b','text','أطلب الحل النهائي قبل قراءة الدرس.'),
      jsonb_build_object('id','c','text','أنسخ الرد دون مراجعته أو فهمه.')
    ),
    'a',
    'ضاد يساعد على الفهم والتلميح والمراجعة، ولا يلغي محاولة المتعلم.'
  from target
)
insert into public.questions(
  lesson_id,question_order,question,question_type,options,correct_answer,explanation,points
)
select lesson_id,question_order,question,'multiple_choice',options,correct_answer,explanation,1
from q
on conflict (lesson_id,question_order) do nothing;

with target as (
  select l.id,l.lesson_type
  from public.lessons l
  join public.units u on u.id=l.unit_id
  join public.grades g on g.id=u.grade_id
  join public.curricula cu on cu.id=g.curriculum_id
  join public.countries c on c.id=cu.country_id
  where l.status='published'
    and c.code='BH'
    and cu.name_ar='اللغة العربية'
    and g.grade_number between 2 and 9
    and (select count(*) from public.lesson_vocabulary v where v.lesson_id=l.id)<3
),
vocab as (
  select id lesson_id,
    case lesson_type when 'reading' then 'فكرة رئيسة' when 'writing' then 'مسودة' when 'grammar' then 'قاعدة' when 'spelling' then 'إملاء' when 'vocabulary' then 'معنى' when 'listening' then 'استماع' when 'speaking' then 'طلاقة' else 'مراجعة' end word,
    case lesson_type when 'reading' then 'المعنى المركزي الذي يدور حوله النص أو الفقرة.' when 'writing' then 'النسخة الأولى من النص قبل المراجعة والتحرير.' when 'grammar' then 'نظام يصف طريقة بناء اللغة أو استعمالها استعمالًا صحيحًا.' when 'spelling' then 'كتابة الكلمات والحروف وفق القاعدة الصحيحة.' when 'vocabulary' then 'الدلالة التي تؤديها الكلمة في السياق.' when 'listening' then 'الإنصات بقصد فهم الكلام ومعانيه.' when 'speaking' then 'القدرة على التعبير بسلاسة ووضوح.' else 'إعادة النظر في التعلم لتثبيته وتحسينه.' end meaning,
    1 display_order
  from target
  union all
  select id,
    case lesson_type when 'reading' then 'تفصيل' when 'writing' then 'ترابط' when 'grammar' then 'تركيب' when 'spelling' then 'نمط' when 'vocabulary' then 'سياق' when 'listening' then 'تفصيل' when 'speaking' then 'نطق' else 'مهارة' end,
    case lesson_type when 'reading' then 'معلومة جزئية تدعم الفكرة الرئيسة أو توضحها.' when 'writing' then 'اتصال الجمل والأفكار بطريقة واضحة ومنطقية.' when 'grammar' then 'طريقة انتظام الكلمات وعلاقاتها داخل الجملة.' when 'spelling' then 'صورة متكررة تساعد على معرفة طريقة الكتابة.' when 'vocabulary' then 'الكلام المحيط بالكلمة الذي يساعد على تحديد معناها.' when 'listening' then 'معلومة جزئية يلتقطها المستمع من الكلام المسموع.' when 'speaking' then 'إخراج أصوات الكلمات بصورة واضحة وصحيحة.' else 'قدرة تتطور بالتدريب والممارسة.' end,
    2
  from target
  union all
  select id,
    case lesson_type when 'reading' then 'سياق' when 'writing' then 'تحرير' when 'grammar' then 'وظيفة' when 'spelling' then 'مراجعة' when 'vocabulary' then 'مرادف' when 'listening' then 'استجابة' when 'speaking' then 'حوار' else 'إتقان' end,
    case lesson_type when 'reading' then 'الكلام والظروف المحيطة بالعبارة التي تساعد على فهمها.' when 'writing' then 'مراجعة النص وصقله لغويًا وتنظيميًا.' when 'grammar' then 'الدور الذي يؤديه العنصر اللغوي في الجملة.' when 'spelling' then 'فحص الكتابة بعد إنجازها لاكتشاف الخطأ وتصحيحه.' when 'vocabulary' then 'كلمة تقارب كلمة أخرى في المعنى.' when 'listening' then 'ما يقوله أو يفعله المتعلم بعد فهم المسموع.' when 'speaking' then 'تبادل منظم للكلام بين طرفين أو أكثر.' else 'أداء المهارة بدرجة صحيحة ومستقرة.' end,
    3
  from target
)
insert into public.lesson_vocabulary(
  lesson_id,word,meaning,example,display_order
)
select lesson_id,word,meaning,null,display_order
from vocab
on conflict (lesson_id,word)
do update set
  meaning=excluded.meaning,
  display_order=excluded.display_order,
  updated_at=now();
