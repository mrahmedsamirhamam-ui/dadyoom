-- One-pass restoration of absent, measurable lesson objectives.
-- Only for existing published original instruction with >=700 chars;
-- never modify lesson body, grade, title, status, source or drafted textbooks.
-- Exclude ambiguous OCR, ministry reference cards and unverified 2025 term plans.
WITH eligible AS (
  SELECT l.id, l.title, l.lesson_type, g.grade_number
  FROM public.lessons l
  JOIN public.units u ON u.id=l.unit_id
  JOIN public.grades g ON g.id=u.grade_id
  JOIN public.curricula cu ON cu.id=g.curriculum_id
  JOIN public.countries co ON co.id=cu.country_id
  WHERE co.code='BH' AND l.status='published'
  AND (l.learning_objectives IS NULL OR
    jsonb_array_length(CASE WHEN jsonb_typeof(l.learning_objectives)='array'
      THEN l.learning_objectives ELSE '[]'::jsonb END)=0)
  AND length(btrim(coalesce(l.content,'')))>=700
  AND l.content !~* '(هذا عنصر من كتاب|هوية الدرس|مدخل OCR غير محسوم|غير محسوم الفهرسة|قائمة الفصل الثاني 2025|خطة تاريخية|2025–2026|2025-2026|لم تثبت مطابقتها|المصدر الرسمي)'
  AND l.title !~ '(يقسّم|يقسم|الدرس الأول|الدرس الثاني)'
), built AS (
SELECT id,
  CASE lesson_type
    WHEN 'reading' THEN jsonb_build_array(
      format('أن يحدد المتعلم فكرة أو مهارة قراءة أساسية في موضوع «%s» وفق النص الداعم المعروض.',title),
      format('أن يقدم المتعلم شاهدًا من نص النشاط يوضح فهم «%s» بدل الاكتفاء بتخمين الإجابة.',title),
      'أن يصوغ المتعلم استجابة قرائية أو جملة من إنشائه ويصححها استنادًا إلى النص.'
    )
    WHEN 'grammar' THEN jsonb_build_array(
      format('أن يستخرج المتعلم القاعدة اللغوية المتعلقة بموضوع «%s» من المثال المعروض.',title),
      'أن يطبق المتعلم القاعدة على جملة جديدة من إنشائه مع بيان السبب.',
      'أن يكتشف المتعلم خطأ لغويًا مشابهًا ويقترح تصحيحًا مع التعليل.'
    )
    WHEN 'writing' THEN jsonb_build_array(
      format('أن يخطط المتعلم لمهمة كتابة أصلية حول «%s» بأفكار واضحة.',title),
      'أن ينتج المتعلم نصًا قصيرًا مترابطًا يناسب المرحلة الدراسية والغرض من الكتابة.',
      'أن يراجع المتعلم إملاءه وتراكيبه وترقيمه ويحرر نسخة أدق من نصه.'
    )
    WHEN 'listening' THEN jsonb_build_array(
      format('أن يلتقط المتعلم معلومة صريحة من النص المسموع حول «%s».',title),
      'أن يعيد المتعلم المعنى الذي سمعه بلغته الخاصة دون إضافة أحداث لم ترد.',
      'أن يشارك المتعلم في استجابة شفوية دقيقة ويستشهد بجملة مما سمع.'
    )
    WHEN 'speaking' THEN jsonb_build_array(
      format('أن يقدم المتعلم حديثًا مترابطًا قصيرًا عن «%s» بلغة عربية مفهومة.',title),
      'أن يرتب المتعلم أفكاره في بداية ووسط وخاتمة ويلتزم آداب الحوار.',
      'أن يستمع المتعلم إلى تغذية راجعة ويعيد صياغة عبارة لتحسين وضوحها.'
    )
    WHEN 'spelling' THEN jsonb_build_array(
      format('أن يحدد المتعلم الظاهرة الإملائية المتصلة بموضوع «%s» في أمثلة صحيحة.',title),
      'أن يكتب المتعلم كلمات أو جملًا جديدة ويطبق قاعدة الرسم الإملائي المناسبة.',
      'أن يراجع المتعلم الأخطاء الإملائية ويبرر الاختيار الصحيح.'
    )
    WHEN 'vocabulary' THEN jsonb_build_array(
      format('أن يحدد المتعلم معنى مفردات موضوع «%s» من سياق النشاط.',title),
      'أن يوظف المتعلم مفردتين مستهدفتين في جملتين من إنشائه.',
      'أن يراجع المتعلم ملاءمة المفردة للسياق ويصحح استخدامها.'
    )
    WHEN 'assessment' THEN jsonb_build_array(
      format('أن يحل المتعلم تدريبات تطبيقية مرتبطة بموضوع «%s» وفق نص النشاط المتاح.',title),
      'أن يبين المتعلم سبب اختياره الإجابة بالرجوع إلى القاعدة أو الشاهد.',
      'أن يصحح المتعلم خطأ واحدًا على الأقل ثم يعيد حل مثال موازٍ.'
    )
    ELSE NULL
  END AS objectives
FROM eligible
)
UPDATE public.lessons l SET learning_objectives=b.objectives
FROM built b
WHERE l.id=b.id AND b.objectives IS NOT NULL
RETURNING l.id,l.lesson_type;