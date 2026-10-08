-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only genuinely empty published lessons; add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"skill":"تفكيك السؤال الحجاجي إلى موقف وحجة ودليل","passage":"السؤال «هل ينبغي تخصيص وقت يومي للقراءة؟» يحتاج تحديد موقف واضح، وحجة تفسره، ودليل أو مثال، ثم النظر في اعتراض محتمل. لا تكفي عبارة «القراءة مفيدة» دون بيان كيف ومتى وما الذي يتغير بها.","prompt":"ما الجزء الذي يدعم الرأي بحادثة أو بيانات؟","correct":"الدليل","w1":"العنوان وحده","w2":"التوقيع","w3":"التحية","practice":"فكك موضوعًا عن استخدام التقنية إلى رأي وحجتين ودليلين واعتراض وجواب دون نسبة أرقام غير موثقة."},{"n":2,"skill":"رسم خطة موضوع حجاجي متوازن","passage":"خطة مستقلة لموضوع «الأنشطة الرياضية في المدرسة»: مقدمة تحدد الرأي، عرض فيه حجة عن الصحة وأخرى عن التعاون، اعتراض بشأن الوقت مع جواب تنظيمي، خاتمة تربط النتائج بالموقف. يسبق التخطيط الكتابة ليمنع التكرار.","prompt":"لماذا نضع الاعتراض وجوابه في الخطة؟","correct":"لإظهار فهم الرأي الآخر والرد عليه","w1":"لتغيير الموضوع","w2":"لحذف الحجج","w3":"لإطالة النص فقط","practice":"اكتب مخططًا من خمسة أجزاء لموضوع خلافي مناسب للمدرسة، واستخدم دليلًا يمكن التحقق منه."},{"n":3,"skill":"صياغة حجة صحيحة وتجنب التعميم","passage":"الرأي: «التعلم الجماعي مفيد في بعض المهام». الحجة: يسمح بتبادل الأفكار. المثال: يصحح زميل خطأً في حل مسألة بعد النقاش. قول «جميع الطلاب ينجحون دائمًا بالمجموعات» تعميم بلا دليل؛ تصاغ الدعوى بدقة.","prompt":"أي دعوى أكثر انضباطًا؟","correct":"قد يساعد التعاون بعض الطلاب على فهم الفكرة","w1":"كل تعاون يضمن التفوق دائمًا","w2":"لا فائدة من أي نقاش","w3":"أي طالب لا يوافق مخطئ","practice":"اكتب فقرتين تؤيد فيهما رأيًا ثم تعرض اعتراضًا محترمًا وترد عليه بحجة واضحة."},{"n":4,"skill":"الحجاج الحواري واحترام المخالف","passage":"قالت ريم: «أفضل المكتبة الورقية لأنني أركز فيها». أجاب فهد: «الكتاب الرقمي يسهل البحث والنقل». اتفقا على اختيار الوسيط المناسب للمهمة. يميّز الحوار الرأي والدليل ويحافظ على تبادل الأدوار دون تجريح.","prompt":"ما السمة الإيجابية للحوار في المثال؟","correct":"عرض سبب لكل رأي واحترام الاختلاف","w1":"إسكات الطرف الآخر","w2":"تغيير الموضوع","w3":"استخدام الإهانة","practice":"اكتب حوارًا من ثماني مداخلات عن قضية مدرسية، يذكر كل طرف حجة ودليلًا ويرد على الآخر."},{"n":5,"skill":"دمج الحوار في السرد بطريقة وظيفية","passage":"نموذج: «بحثت سارة عن مفتاح المكتبة. قالت لحارس المدرسة: هل رأيته؟ أجاب: رأيته قرب النافذة. أسرعت سارة إلى المكان». يكشف الحوار معلومة تغير الحدث؛ لا يوضع كلام طويل لا يؤدي وظيفة.","prompt":"ما دور الحوار في القصة؟","correct":"تقديم معلومة تحرك البحث عن المفتاح","w1":"إيقاف القصة بلا سبب","w2":"تكرار الوصف نفسه","w3":"تغيير زمن الحكاية","practice":"اكتب مشهدًا قصصيًا قصيرًا يتضمن تبادلًا من أربعة أسطر يؤدي إلى قرار أو حل."},{"n":6,"skill":"رسالة نصح بلغة مودة","passage":"نص مستقل: «صديقي العزيز، لاحظت أنك تسهر قبل الاختبارات. أقترح أن تبدأ المراجعة مبكرًا وتأخذ قسطًا مناسبًا من النوم، فأنا أهتم براحتك. صديقك أحمد». تقدم الرسالة نصحًا محددًا دون إصدار أحكام على الشخص.","prompt":"ما العبارة التي تجعل النصح عمليًا؟","correct":"ابدأ المراجعة مبكرًا","w1":"صديقي العزيز فقط","w2":"صديقك أحمد فقط","w3":"أنا أهتم بك فقط","practice":"اكتب رسالة نصح لشخص قريب بها تحية ومشكلة محددة وخطوتان واقعيتان وخاتمة مشجعة."},{"n":7,"skill":"مراجعة رسالة النصح والتحقق من النبرة","passage":"صياغة أولى: «أنت مهمل ويجب أن تتغير». صياغة أفضل: «قد يساعدك تقسيم المهام إلى أجزاء صغيرة، ويمكننا وضع جدول معًا». تخفف المراجعة الأحكام الجارحة وتعطي المتلقي اختيارًا وخطة.","prompt":"لماذا الثانية أنسب؟","correct":"لأنها تقدم اقتراحًا محددًا بلطف","w1":"لأنها تسخر من المتلقي","w2":"لأنها تخفي الهدف","w3":"لأنها تخلو من فعل","practice":"حرر رسالة نصح كتبتها، وحدد كلمتين استبدلتهما لتحسين الاحترام والدقة."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=9
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='الجزء الثاني — الإنتاج الكتابي' AND u.semester=2 AND l.sort_order=r.n AND l.status='published'
    FOR UPDATE OF l;
    IF char_length(coalesce(target_content,''))<350 THEN
      UPDATE public.lessons SET
        content='ضاديوم — إثراء مستقل أصلي للصف الثامن، الفصل الأول. لا يمثل النص الوزاري الأصلي ولا يثبت مطابقة العنوان للمصدر.'||E'\n\n'||
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
    IF EXISTS (SELECT 1 FROM public.lessons WHERE id=target_id AND content LIKE 'ضاديوم — إثراء مستقل أصلي للصف الثامن%') THEN
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'فهم النص الإثرائي','multiple_choice','assessment',r.prompt,
        jsonb_build_object('origin','DADYOOM_BH_G9_T2_WRITING_7_20261008','notOfficialBook',true,'ocrReview','pending','options',jsonb_build_array(r.correct,r.w1,r.w2,r.w3)),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_G9_T2_WRITING_7_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_G9_T2_WRITING_7_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_G9_T2_WRITING_7_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;