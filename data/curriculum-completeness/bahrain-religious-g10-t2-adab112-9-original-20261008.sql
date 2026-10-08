-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only genuinely empty published lessons; add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"skill":"الأدب في بدايات العصر الإسلامي","passage":"انتقل المجتمع العربي إلى سياقات جديدة أثّرت في أغراض الشعر والنثر وطريقة الخطاب، لكن دراسة الأدب الإسلامي الأول تتطلب النصوص المؤرخة والمصادر الموثقة. تدريب مستقل: قارن بين رسالة تطلب التعاضد وخطاب يركز على الفخر القبلي من حيث الغرض والأسلوب، من دون نسبتهما إلى شخصية تاريخية.","prompt":"ما الدليل الأساسي لدراسة خصائص الفترة الأولى؟","correct":"نصوص موثقة في سياقها التاريخي","w1":"حكاية مختلقة","w2":"عنوان الدرس وحده","w3":"تشابه القافية فقط","practice":"أنشئ جدولًا لمظهرين أدبيين في الفترة الأولى مع شاهد أدبي موثق لكل مظهر."},{"n":2,"skill":"تطور الخطاب الأدبي في الفترة الثانية","passage":"يمكن مقارنة نصين صحيحَي النسبة من فترتين في العصر الإسلامي في الغرض وبناء الحجة، مع الانتباه إلى اختلاف البيئات والأجناس الأدبية. نموذج ضاديوم المستقل يعرض خطيبًا يحث فريقه على الأمانة ويدعم دعوته بمثال، ولا يمثل خطبة تاريخية.","prompt":"ما شرط المقارنة المنصفة بين فترتين أدبيتين؟","correct":"تحديد الفترة والمصدر والنوع الأدبي","w1":"تجاهل التواريخ","w2":"نسبة خطاب متخيل","w3":"المقارنة بالعنوان وحده","practice":"بعد مراجعة مقرر الأدب، قارن نصين مؤرخين من فترتين مع تحليل موضوع وجمهور وأساليب."},{"n":3,"skill":"تحليل الكرم في النص الشعري","passage":"لا يصح تلخيص «قصة كرم» للحطيئة أو نسبة أبيات إليه دون نصها المدرسي. في حكاية مستقلة استقبلت أسرة ضيفًا وتأملت كيف توفّق بين إكرامه وحاجات أهل المنزل. يساعد المثال على تحديد قيمة الكرم والحجة المتصلة بها، ولا يمثل أحداث القصيدة.","prompt":"ما التوازن الذي تعرضه القصة المستقلة؟","correct":"إكرام الضيف مع مراعاة حاجات الأسرة","w1":"ترك الضيف بلا مساعدة","w2":"إلغاء مسؤولية الأسرة","w3":"تكرار قصة غير موثقة","practice":"استخرج من النص الأصلي بيتًا صحيحًا يدل على الكرم، وناقش الصورة والموقف بمعيار نقدي."},{"n":4,"skill":"العروض: تفعيلات البحر الكامل","passage":"الوزن التام المشهور للبحر الكامل يقوم على «متفاعلن متفاعلن متفاعلن» في كل شطر أصلي قبل النظر في الزحافات والعلل. يتطلب التقطيع كتابةً عروضية تراعي المنطوق من الحروف المتحركة والساكنة لا الرسم الإملائي وحده.","prompt":"ما التفعيلة الأساسية للبحر الكامل؟","correct":"متفاعلن","w1":"فعولن","w2":"مستفعلن وحدها","w3":"فاعلن وحدها","practice":"اكتب بيتًا من مصدر عروض موثوق وقطعه إلى مقاطع، ثم حدد التفعيلات والتغيرات دون اختلاق نسبته."},{"n":5,"skill":"الهدي النبوي وضرورة صحة المصدر","passage":"يشير عنوان «من الهدي النبوي» إلى مادة لا يجوز اختلاق متنها أو الحديث عن درجتها دون مصدر معتمد. يمكن تدريب مهارة القراءة على حوار أصلي يدعو إلى الصدق في تقرير العمل، ثم يطلب من المتعلم التمييز بين رأيه والنص الحديثي الذي سيقرأه من الكتاب.","prompt":"ما الذي يجب التحقق منه قبل نقل حديث نبوي؟","correct":"المتن والمصدر ودرجة الثبوت عبر مرجع معتمد","w1":"تشابه معنى الحوار","w2":"وجود قافية","w3":"شيوع العبارة بلا توثيق","practice":"راجع الحديث المقرر مع المعلم من مصدر موثوق، ثم استخرج قيمة لغوية مع ذكر النص الصحيح والتخريج."},{"n":6,"skill":"منهج قراءة سيرة الإمام علي","passage":"تستلزم ترجمة الإمام علي بن أبي طالب رضي الله عنه الاعتماد على مصادر سِيَر معتبرة والتحقق من الأخبار المنسوبة إليه، وتفريق الأحداث المتفق عليها من الروايات المختلف فيها. التدريب الأصلي لا يروي واقعة عنه، بل يبين خطة توثيق التاريخ وتقييم الإسناد والسياق.","prompt":"ما الخطوة اللازمة قبل نسبة قول تاريخي إلى الإمام علي؟","correct":"الرجوع إلى مرجع موثوق والتحقق من الرواية","w1":"الاعتماد على مقطع مجهول","w2":"صياغة قول مناسب","w3":"اختراع تاريخ الواقعة","practice":"أعد بطاقة سيرة بوقائع موثقة ومراجع محددة، وميّز معلومة تاريخية من حكمك الشخصي."},{"n":7,"skill":"الوعيد في الشعر والمخاطب","passage":"تحليل قصيدة «تهديد ووعيد» لحسان بن ثابت يحتاج الأبيات المقررة للتعرف إلى المخاطب والغرض والسياق، ولا تُنشأ أبيات منسوبة إليه. تدريب مستقل: «حذّر القائد المتهاون من تكرار الإهمال»، وهو قول نثري يوضح أثر صيغة التحذير وليس من القصيدة.","prompt":"ما الذي يساعد على تحديد غرض الوعيد في القصيدة؟","correct":"شاهد من الأبيات وسياق المخاطب","w1":"الاعتماد على العنوان وحده","w2":"إضافة أبيات مجهولة","w3":"حذف اسم الشاعر","practice":"استخرج أسلوب وعيد حقيقيًا من النص المدرسي الموثق وفسر وظيفته وعلاقته بالسياق."},{"n":8,"skill":"العروض: تفعيلة البحر المتقارب","passage":"البحر المتقارب التام في صورته الأصلية يقوم على تكرار «فعولن» أربع مرات في كل شطر قبل الزحافات والعلل. يعتمد التقطيع الصحيح على النطق وضبط الحركات والمدود، وقد تحتاج بعض الأبيات معرفة أحكام الوقف.","prompt":"ما تفعيلة المتقارب الأساسية؟","correct":"فعولن","w1":"متفاعلن","w2":"فاعلاتن","w3":"مفاعلتن","practice":"اختر بيتًا معروف المصدر على المتقارب وقطعه كتابة عروضية، مع مراجعة التفعيلات مع المعلم."},{"n":9,"skill":"التحقق من حكاية المساءلة التاريخية","passage":"عنوان «من أين لك هذا؟» المرتبط بعمر بن الخطاب رضي الله عنه لا يثبت بذاته رواية تفصيلية أو إسنادًا؛ ينبغي الرجوع إلى المصدر المحقق قبل عرضها. في موقف مستقل سأل مسؤول عضو فريق عن مصدر معدات جديدة وطلب فواتيرها. يمثل تدريبًا على المساءلة لا نقلًا لواقعة تاريخية.","prompt":"ما الإجراء العملي الذي استخدمه المسؤول في المثال؟","correct":"طلب المستندات الدالة على مصدر المعدات","w1":"اتهام بلا دليل","w2":"إخفاء الأرقام","w3":"نقل إشاعة","practice":"تحقق مع المعلم من أصل الرواية، ثم اكتب مناقشة تميّز الدليل من الاتهام دون نسبة تفاصيل غير مثبتة."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=10
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027' AND cu.id='79a8732d-6a86-46cd-8cad-31673af20a0c'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='أدب 112 — الأدب والنصوص' AND u.semester=2 AND l.sort_order=r.n AND l.status='published'
    FOR UPDATE OF l;
    IF char_length(coalesce(target_content,''))<350 THEN
      UPDATE public.lessons SET
        content='ضاديوم — إثراء مستقل أصلي للصف العاشر، الفصل الثاني. لا يمثل النص الوزاري الأصلي ولا يثبت مطابقة العنوان للمصدر.'||E'\n\n'||
          'المهارة: '||r.skill||E'\n\n'||
          'النموذج التعليمي والشرح: '||r.passage||E'\n\n'||
          'أهداف التعلم: يحدد المتعلم شاهدًا صحيحًا ويشرح دلالته، ويميّز بين الفكرة والدليل، ثم ينتج كتابة مناسبة للمهارة.'||E'\n\n'||
          'سؤال الفهم: '||r.prompt||E'\n\n'||
          'التطبيق الكتابي: '||r.practice||E'\n\n'||
          'التمايز: المبتدئ يحصل على كلمات مفتاحية وبداية جملة؛ المتوسط يجيب بدليل مستقل؛ المتقدم يقارن بين صياغتين ويبرر تحسيناته.'||E'\n\n'||
          'مراجعة المعلم: تحقق من صحة الاستدلال والإملاء وعلامات الترقيم والترابط. لا تُمنح درجة جودة تلقائية لمجرد تسليم المهمة.'||E'\n\n'||
          'تنبيه المصدر: راجع العنوان المستورد والكتاب الرسمي قبل وصف هذا التدريب بأنه مطابق للمنهج.'||E'\n\n'||'المدخل السابق المحفوظ: '||coalesce(target_content,''),
        updated_at=now()
      WHERE id=target_id;
    END IF;
    IF EXISTS (SELECT 1 FROM public.lessons WHERE id=target_id AND content LIKE 'ضاديوم — إثراء مستقل أصلي للصف العاشر%') THEN
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'فهم النص الإثرائي','multiple_choice','assessment',r.prompt,
        jsonb_build_object('origin','DADYOOM_BH_RELIGIOUS_G10_T2_ADAB112_ORIGINAL_20261008','notOfficialBook',true,'ocrReview','pending','options',CASE (r.n % 4) WHEN 0 THEN jsonb_build_array(r.correct,r.w1,r.w2,r.w3) WHEN 1 THEN jsonb_build_array(r.w1,r.correct,r.w2,r.w3) WHEN 2 THEN jsonb_build_array(r.w1,r.w2,r.correct,r.w3) ELSE jsonb_build_array(r.w1,r.w2,r.w3,r.correct) END),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_RELIGIOUS_G10_T2_ADAB112_ORIGINAL_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_RELIGIOUS_G10_T2_ADAB112_ORIGINAL_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_RELIGIOUS_G10_T2_ADAB112_ORIGINAL_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;