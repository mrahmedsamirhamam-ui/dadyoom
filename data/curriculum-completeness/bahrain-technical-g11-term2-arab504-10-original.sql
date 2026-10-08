-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only short published placeholders while retaining prior text and add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"skill":"حسن استثمار وقت الفراغ","passage":"أنهى متدرب واجباته ثم قسم وقته الحر بين القراءة والنشاط البدني وزيارة أقاربه. لم يملأ برنامجه إلى درجة الإجهاد وترك مساحة للراحة. مثال ضاديوم مستقل ولا يمثل نص «أوقات الفراغ» المقرر.","prompt":"ما علامة التوازن في خطة المتدرب؟","correct":"تخصيص وقت للراحة مع أنشطة متنوعة","w1":"ترك جميع الواجبات","w2":"عدم النوم","w3":"تجاهل العلاقات","practice":"أعد خطة أسبوعية لوقت فراغك تذكر هدفًا معرفيًا وبدنيًا واجتماعيًا ومقياسًا لتقييمها."},{"n":2,"skill":"إذا الشرطية وما الاستفهامية بعد الجر","passage":"في «إذا اجتهدتَ تحسّن أداؤك» تفيد «إذا» غالبًا الظرف لما يستقبل من الزمان متضمنة معنى الشرط. وفي «بِمَ تكتبُ؟» حُذفت ألف «ما» الاستفهامية بعد حرف الجر الباء. «بما كتبت» ليست بالضرورة استفهامًا؛ يتحدد ذلك من السياق.","prompt":"كيف نكتب السؤال عن أداة الكتابة بعد الباء؟","correct":"بِمَ تكتبُ؟","w1":"بما تكتب؟ بلا سياق","w2":"يا تكتب","w3":"هل بالقلم","practice":"كوّن أربع جمل بـ«إذا»، وأربع أسئلة بما الاستفهامية بعد حرف جر مع بيان القاعدة الإملائية."},{"n":3,"skill":"الخفافيش وتحديد المصادر العلمية","passage":"تستعمل الخفافيش أنواعًا من الاستشعار بالصدى اعتمادًا على الصوت لدى أنواع كثيرة، بينما يستخدم الرادار موجات كهرومغناطيسية. لا يصح القول إن العمليتين متطابقتان؛ يجمعهما استدلال من إشارة مرتدة ويختلف نوع الموجة. هذا شرح مستقل لا ينقل نص القراءة.","prompt":"ما الاختلاف الأساسي بين الاستشعار بالصدى والرادار؟","correct":"الصوت مقابل الموجات الكهرومغناطيسية","w1":"كلاهما يعتمد الضوء المرئي فقط","w2":"الرادار لا يرسل إشارات","w3":"جميع الخفافيش عمياء","practice":"اكتب مقارنة في جدول بين التقنية البيولوجية والرادار من مصدرين علميين موثوقين مع توثيق المراجع."},{"n":4,"skill":"الفاعل وتحويل بنية الجملة","passage":"في «أصلحَ الفنيُّ الجهازَ» «الفنيُّ» فاعل مرفوع، وتبدأ الجملة بفعل. وفي «الفنيُّ أصلحَ الجهازَ» تبدأ بمبتدأ ويكون الفاعل ضميرًا مستترًا في الفعل، والجملة الفعلية خبرًا. لا يكفي تبديل ترتيب الكلمات بلا إعادة تحليل الإعراب.","prompt":"من الفاعل في «أصلح الفني الجهاز»؟","correct":"الفنيُّ","w1":"الجهازَ","w2":"أصلحَ","w3":"حرف جر","practice":"حوّل أربع جمل فعلية إلى اسمية وأربع اسمية إلى فعلية، وحدد المبتدأ والخبر أو الفعل والفاعل."},{"n":5,"skill":"تنظيم كتابة نحو 120 كلمة","passage":"يبدأ النص القصير بموقف واضح ثم تفاصيل مرتبة ومثال ونتيجة وخاتمة. في موضوع «عمل الفريق»، تجنب إعادة فكرة التعاون بألفاظ متشابهة عشر مرات؛ استخدم موقفًا يدل عليها. عدد الكلمات ليس بديلًا عن حجة أو وصف مضبوط.","prompt":"ما الذي يمنع الحشو في النص؟","correct":"تنويع الأفكار مع أمثلة وظيفية","w1":"تكرار العبارة","w2":"حذف الخاتمة","w3":"تجاهل الموضوع","practice":"اكتب نصًا من عشرة أسطر ونحو 120 كلمة عن مشكلة وحل داخل فريق، ثم صحح التكرار والإملاء."},{"n":6,"skill":"الوصية وعلاقتها بالسلوك","passage":"يتطلب نص «من وصايا الآباء للأبناء» الرجوع إلى المصدر الأصلي قبل اقتباس الوصايا. في مثال تدريبي قالت أم لابنها: «احترم وقت غيرك واستأذن قبل استعارة أدواته، لأن الثقة تُبنى بالأفعال». هذه الوصية من إنشاء ضاديوم.","prompt":"ما السلوك العملي في الوصية؟","correct":"الاستئذان قبل استعارة أدوات الآخرين","w1":"الاستيلاء على الأدوات","w2":"تضييع المواعيد","w3":"الاعتذار دون إصلاح","practice":"استخرج وصية من النص المدرسي بشاهد موثق، ثم اكتب تطبيقًا لها في موقف من إنشائك."},{"n":7,"skill":"الأمر والنهي ولام الأمر","passage":"«أكملْ التقريرَ» أمر مباشر، و«لا تهملْ الفحصَ» نهي يجزم الفعل المضارع، و«لِيكتبْ كلُّ عضوٍ ملاحظاته» لام أمر جازمة تدخل على مضارع. همزة الوصل والقطع قضية رسم مستقلة تحتاج قاعدة الكلمة؛ لا تُخلط بالإعراب.","prompt":"ما وظيفة اللام في «ليكتبْ»؟","correct":"لام الأمر الجازمة","w1":"لام التعليل الناصبة","w2":"لام الملك","w3":"حرف جر","practice":"اكتب جملتي أمر ونهي وجملتين بلام الأمر، ثم أعرب المضارع واختر كلمات بهمزة وصل وقطع."},{"n":8,"skill":"التواضع في التعامل","passage":"أخطأ متدرب في تقدير طول قطعة، فاعترف بالخطأ وقبل اقتراح زميله بإعادة القياس. ساعده تواضعه على تحسين العمل دون التقليل من جهده. هذه حكاية أصلية منفصلة عن نص «التواضع» المقرر.","prompt":"أي تصرف يعبر عن التواضع في المثال؟","correct":"قبول التصحيح والاعتراف بالخطأ","w1":"رفض مراجعة القياس","w2":"لوم الآخرين","w3":"إخفاء النتيجة","practice":"اكتب موقفًا حواريًا من ثمانية أسطر يبيّن الفرق بين التواضع وضعف الثقة بالنفس."},{"n":9,"skill":"المفرد والجمع والهمزة","passage":"«مهندس» مفرد، و«مهندسون» جمع مذكر سالم في حالة الرفع، و«معدات» جمع مؤنث سالم لـ«معدة» في استعماله المناسب. همزة «أحمد» قطع وهمزة «استعمل» وصل في الماضي السداسي؛ لا تحدد همزة القطع من عدد حروف الكلمة فقط.","prompt":"ما نوع الهمزة في «استعمل»؟","correct":"همزة وصل","w1":"همزة قطع","w2":"همزة متوسطة","w3":"همزة متطرفة","practice":"اكتب خمسة أسماء مع جموعها، ثم صنّف عشر كلمات إلى همزة وصل أو قطع مع التعليل."},{"n":10,"skill":"تحرير فقرة رأي من 120 كلمة","passage":"في تدريب كتابي ثانٍ يناقش المتعلم «هل التدريب العملي وحده يكفي لتعلم مهنة؟». من الممكن أن يدافع عن الجمع بين النظرية والتطبيق بأمثلة ملموسة، مع الاعتراف باختلاف المهن. لا تُعد كلمة «رأي» دليلًا بحد ذاتها.","prompt":"أي عنصر يقوي الرأي المكتوب؟","correct":"حجة مع مثال واعتراض","w1":"التكرار","w2":"رفع الصوت","w3":"استبعاد الدليل","practice":"اكتب فقرة رأي من نحو 120 كلمة وعشرة أسطر، برأي محدد وحجتين ودليل واعتراض ورد."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=11
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027' AND cu.id='e15ed6fd-370c-4980-b724-d0c19ec2c029'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='عرب 504 — التدريب المهني / السنة الثانية' AND u.semester=2 AND l.sort_order=r.n AND l.status='published'
    FOR UPDATE OF l;
    IF char_length(coalesce(target_content,''))<350 THEN
      UPDATE public.lessons SET
        content='ضاديوم — إثراء مستقل أصلي للصف الثامن، الفصل الثاني. لا يمثل النص الوزاري الأصلي ولا يثبت مطابقة العنوان للمصدر.'||E'\n\n'||
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
        jsonb_build_object('origin','DADYOOM_BH_TECH_G11_T2_ARAB504_ORIGINAL_20261008','notOfficialBook',true,'ocrReview','pending','options',CASE (r.n % 4) WHEN 0 THEN jsonb_build_array(r.correct,r.w1,r.w2,r.w3) WHEN 1 THEN jsonb_build_array(r.w1,r.correct,r.w2,r.w3) WHEN 2 THEN jsonb_build_array(r.w1,r.w2,r.w3,r.correct) ELSE jsonb_build_array(r.w1,r.w2,r.correct,r.w3) END),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_TECH_G11_T2_ARAB504_ORIGINAL_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_TECH_G11_T2_ARAB504_ORIGINAL_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_TECH_G11_T2_ARAB504_ORIGINAL_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;