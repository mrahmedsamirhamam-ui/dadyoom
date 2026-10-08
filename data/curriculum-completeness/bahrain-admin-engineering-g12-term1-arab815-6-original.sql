-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only genuinely empty published lessons; add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"skill":"الأساليب البلاغية في الشعر الوطني","passage":"تحليل قصيدة «قوة الأوطان في وحدتها» لا يصح دون الأبيات الأصلية. تدريب مستقل: «يا أبناء الوطن، تعاونوا ولا تتفرقوا؛ أليس التعاون مصدر قوة؟». «يا» نداء، و«تعاونوا» أمر، و«لا تتفرقوا» نهي، والاستفهام قد يكون للتقرير بحسب السياق.","prompt":"ما نوع «لا تتفرقوا» في التدريب؟","correct":"أسلوب نهي","w1":"نداء","w2":"تعجب","w3":"خبر مثبت","practice":"بعد الرجوع إلى أبيات القصيدة، وثق أسلوبًا بلاغيًا واحدًا ثم اشرح غرضه دون اختلاق بيت."},{"n":2,"skill":"التعبير الوجداني في الرومنسية","passage":"تظهر في التعبير الرومانسي صور الطبيعة والتجربة الذاتية والحنين، لكن ربطها بنص «أغنيات عشق للبحرين» يحتاج الرجوع إلى أبياته. في وصف أصلي: «حين انحسر ضوء النهار على الساحل تذكرت صوت أبي في الميناء». العبارة ليست من القصيدة.","prompt":"ما الشعور الذي يوحي به المثال؟","correct":"الحنين إلى الذكرى","w1":"اللامبالاة","w2":"الرغبة في الانتقام","w3":"الاعتزاز بآلة فقط","practice":"أنشئ فقرة وجدانية من ست جمل، ثم قارن صورة فيها بصورة مثبتة من نص القصيدة."},{"n":3,"skill":"المضارع بين الرفع والنصب والجزم","passage":"«ينظمُ الطالبُ وقتَه» مضارع مرفوع، و«لن يؤجلَ مهمته» منصوب بـ«لن»، و«لم يؤجلْ مهمته» مجزوم بـ«لم». يعين تحديد الأداة والعلامة على الإعراب الصحيح بدل الاعتماد على دلالة المستقبل وحدها.","prompt":"ما علامة إعراب «يؤجلْ» بعد «لم»؟","correct":"السكون للجزم","w1":"الضمة للرفع","w2":"الفتحة للنصب","w3":"الكسرة للجر","practice":"أنشئ ست جمل في تنظيم الوقت، اثنتين لكل حالة إعرابية، ثم اضبط الأفعال وعلل."},{"n":4,"skill":"المحسنات البديعية من مثال أصلي","passage":"«الليل والنهار» زوج متضاد يمثل الطباق، وقد تجمع المقابلة عدة معان متضادة في ترتيب مقصود. أما الجناس فهو تشابه في اللفظ مع اختلاف المعنى وفق النوع. لا ننسب أمثلة مختلقة إلى نص «في طريق الحياة» للمازني دون مصدر.","prompt":"ما الزوج الذي يتضمن طباقًا؟","correct":"الليل والنهار","w1":"ليل وظلام","w2":"طريق وشارع","w3":"قلم ودفتر","practice":"اكتب مثالًا صحيحًا للطباق وآخر للمقابلة ثم ابحث في النص الأصلي عن شاهد موثق للمحسن البديعي."},{"n":5,"skill":"وظيفة المكان في قصة الحصار","passage":"عنوان «الحصار» لعبد القادر عقيل لا يكشف وحده الشخصيات أو الأحداث. في قصة تدريبية مستقلة وجدت شخصية نفسها داخل مبنى أغلق بابه بسبب عطل، فبحثت عن مخرج آمن واتصلت بالمشرف. يؤثر ضيق المكان في قرار الشخصية والتوتر دون تمثيل أحداث القصة المقررة.","prompt":"ما دور المكان في الموقف المستقل؟","correct":"إحداث عائق يؤثر في قرار الشخصية","w1":"ذكر عنوان فقط","w2":"إلغاء السبب","w3":"تغيير زمن الفعل","practice":"بعد قراءة القصة الأصلية، استخرج شاهدًا صحيحًا على أثر المكان في الحدث وقارنه بمشهد من تأليفك."},{"n":6,"skill":"المكان في السرد القصير","passage":"في مشهد من إنشاء ضاديوم دخلت ريم دكانًا قديمًا، ووقفت قرب نافذة صغيرة حين انقطع الضوء، فسمعت صوت صاحب الدكان يطلب مساعدتها في العثور على مصباح. شكل المكان المحدود حركة الشخصية. لا يمثل المشهد أحداث «الدكان» لأحمد المؤذن.","prompt":"ما التفصيل الذي أثّر في حركة ريم؟","correct":"انقطاع الضوء داخل الدكان","w1":"اسم ريم","w2":"وقت العطلة","w3":"لون المدرسة","practice":"اكتب مشهدًا قصصيًا يغير فيه المكان تصرف الشخصية، ثم استخرج شاهدًا موثقًا من النص الأصلي للمقارنة."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=12
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027' AND cu.id='44c1dfd0-27ec-41b6-bee7-a4576a582ad5'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='عرب 815 — اللغة العربية للمسار الإداري والتكنولوجي - الهندسي' AND u.semester=1 AND l.sort_order=r.n AND l.status='published'
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
        jsonb_build_object('origin','DADYOOM_BH_ADMIN_ENG_G12_T1_ARAB815_ORIGINAL_20261008','notOfficialBook',true,'ocrReview','pending','options',CASE (r.n % 4) WHEN 0 THEN jsonb_build_array(r.correct,r.w1,r.w2,r.w3) WHEN 1 THEN jsonb_build_array(r.w1,r.correct,r.w2,r.w3) WHEN 2 THEN jsonb_build_array(r.w1,r.w2,r.correct,r.w3) ELSE jsonb_build_array(r.w1,r.w2,r.w3,r.correct) END),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_ADMIN_ENG_G12_T1_ARAB815_ORIGINAL_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_ADMIN_ENG_G12_T1_ARAB815_ORIGINAL_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_ADMIN_ENG_G12_T1_ARAB815_ORIGINAL_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;