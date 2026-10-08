-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only genuinely empty published lessons; add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"skill":"التعرف إلى الأساليب البلاغية في الشعر","passage":"تتطلب قصيدة «قوة الأوطان في وحدتها» نصًا موثقًا لتحديد الشواهد. تدريب مستقل: «يا أبناء الوطن، تعاونوا ولا تتفرقوا؛ أليس الاتحاد قوة؟». «يا» نداء، و«تعاونوا» أمر، و«لا تتفرقوا» نهي، والاستفهام قد يفيد التقرير في السياق. المثال ليس بيتًا من القصيدة.","prompt":"ما نوع الأسلوب في «لا تتفرقوا»؟","correct":"نهي","w1":"نداء","w2":"تعجب","w3":"خبر مثبت","practice":"استخرج من القصيدة الأصلية أسلوبًا بلاغيًا موثقًا واشرح غرضه من السياق، ثم أنشئ مثالًا أصليًا على نوع مختلف."},{"n":2,"skill":"خصائص التعبير الوجداني الرومانسي","passage":"يعنى التعبير الوجداني بإبراز التجربة الذاتية والصور الطبيعية والعاطفة، لكن نسبة ذلك إلى نص «أغنيات عشق للبحرين» تحتاج قراءة أبياته. نموذج مستقل: «يرسل البحر إلى قلبي صوت المساء، فأستعيد ذكرى بيتنا قرب الساحل». يربط المشهد الحسي بالحنين ولا يمثل الشعر المقرر.","prompt":"ما العاطفة التي يدل عليها استعادة ذكرى البيت؟","correct":"الحنين","w1":"اللامبالاة","w2":"الإنكار","w3":"الغضب وحده","practice":"اكتب فقرة وجدانية تتضمن صورة طبيعية ومشاعر صادقة، ثم قارِن شاهدًا من النص الأصلي بعد توثيقه."},{"n":3,"skill":"رفع ونصب وجزم المضارع","passage":"في «ينجزُ المتدربُ عملَه» «ينجزُ» مضارع مرفوع. وفي «لن يؤجلَ عملَه» مضارع منصوب بـ«لن». وفي «لم يؤجلْ عملَه» مضارع مجزوم بـ«لم». تختلف الحركة الأخيرة بحسب العامل، فلا تكفي دلالة الزمن وحدها للإعراب.","prompt":"ما علامة إعراب «يؤجلْ» بعد «لم»؟","correct":"السكون علامة الجزم","w1":"الضمة علامة الرفع","w2":"الفتحة علامة النصب","w3":"الكسرة علامة الجر","practice":"صغ ثلاث جمل عن تنظيم الوقت توظف المضارع في حالات الرفع والنصب والجزم، ثم أعرب الفعل في كل جملة."},{"n":4,"skill":"الطباق والمقابلة والجناس دون اختلاق الاقتباس","passage":"التضاد في «الليل والنهار» مثال للطباق، وتقابل مجموعتين من المعاني قد يشكّل مقابلة، أما الجناس فتشابه لفظين واختلاف معناهما مثل «ساعة» (وقت) و«ساعة» (آلة قياس الزمن) في سياق مناسب. يلزم نص «في طريق الحياة» الأصلي قبل نسبة أي شاهد للمؤلف.","prompt":"أي زوج يمثل طباقًا واضحًا؟","correct":"الليل والنهار","w1":"الليل والظلام","w2":"قراءة وكتاب","w3":"قلم ودفتر","practice":"أنشئ مثالًا للطباق وآخر للمقابلة وثالثًا للجناس مع شرح الأثر، ثم وثّق شاهدًا من نص المازني بعد قراءته."},{"n":5,"skill":"دلالة المكان في السرد القصصي","passage":"تدريب مستقل: «اقتربت هدى من الدكان الضيق، فتوقفت عند الباب حين انطفأ الضوء، وسمعت صوت البائع من الداخل». يوجه المكان حركة الشخصية ويزيد التشويق. لا يصف المثال أحداث قصة «الدكان» لأحمد المؤذن؛ تحليلها يحتاج النص الأصلي.","prompt":"ما التفصيل المكاني الذي زاد التوتر في الموقف؟","correct":"انطفاء الضوء في الدكان الضيق","w1":"اسم الشخصية","w2":"عدد ألوان الرفوف","w3":"موعد المدرسة","practice":"اكتب مشهدًا قصصيًا يؤثر فيه المكان في قرار الشخصية، ثم حدد شاهدًا من قصة «الدكان» بعد الرجوع إلى نصها."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=12
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027' AND cu.id='9a42a857-58d7-428b-80f7-c02a52e69f6b'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='عرب 801 — اللغة العربية للتعليم الفني والمهني' AND u.semester=1 AND l.sort_order=r.n AND l.status='published'
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
        jsonb_build_object('origin','DADYOOM_BH_TECH_G12_T1_ORIGINAL_20261008','notOfficialBook',true,'ocrReview','pending','options',jsonb_build_array(r.correct,r.w1,r.w2,r.w3)),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_TECH_G12_T1_ORIGINAL_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_TECH_G12_T1_ORIGINAL_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_TECH_G12_T1_ORIGINAL_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;