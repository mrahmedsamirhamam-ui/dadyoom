-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only genuinely empty published lessons; add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"skill":"مناقشة الطبع والتطبع بدليل","passage":"يُراجع نص «الطبع والتطبع» لابن عبد ربه من مصدره قبل تلخيص موقف الكاتب أو نسبة عبارة إليه. في موقف مستقل كان متعلم يقاطع زملاءه، فبدأ تدوين ملاحظاته إلى أن ينتهي الآخر من كلامه، فتحسن نقاش الفريق. يدل المثال على تدريب سلوكي ولا يمثل نص الكاتب.","prompt":"ما السلوك الذي غيّره المتعلم؟","correct":"أصبح ينصت حتى ينتهي الآخر","w1":"استمر بالمقاطعة","w2":"ألغى الحوار","w3":"أخفى ملاحظاته","practice":"وثق فكرة من نص ابن عبد ربه المقرر ثم حللها في ضوء موقف من إنشائك مع بيان أوجه الاتفاق والاختلاف."},{"n":2,"skill":"الحجاج بالسرد ومصداقية الحكاية","passage":"الأطروحة «تقسيم الأدوار يساعد على نجاح التعاون» يمكن دعمها بحكاية مستقلة عن فريق حاول إنشاء لوحة دون توزيع العمل فتأخر، ثم نظم المهام فتقدم. تتضح الحجة من سبب التأخر والتحسن، مع تجنب اختلاق بيانات كمية.","prompt":"أي عنصر يقوي الحجة السردية؟","correct":"بيان سبب التأخر ونتيجة التنظيم","w1":"ذكر أسماء كثيرة","w2":"تكرار الرأي","w3":"حذف العقدة","practice":"اكتب نصًا حجاجيًا من 130 كلمة يتضمن قصة مصغرة ورأيًا معلقًا على دلالتها واعتراضًا معقولًا."},{"n":3,"skill":"المشورة في القرار الجماعي","passage":"النص «أهمية المشورة» المنسوب إلى الأبشيهي يحتاج قراءة موثقة قبل الاستشهاد. في مثال ضاديوم مستقل جمع مدير فريق ثلاثة اقتراحات، وقارن الموارد المطلوبة ومخاطر كل حل، ثم أوضح سبب الاختيار. يتجلى أثر المشورة في اختبار البدائل لا كثرة الآراء فقط.","prompt":"كيف اتخذ المدير قراره بعد المشورة؟","correct":"قارن الموارد والمخاطر ووضح السبب","w1":"اعتمد أول رأي","w2":"أخفى البدائل","w3":"رفض الأسئلة","practice":"استخرج حجة صحيحة من نص الأبشيهي ثم طبّقها على موقف دراسي بمسار قرار محدد."},{"n":4,"skill":"النقد المسؤول لقيمة الوطنية","passage":"لا ننسب قولًا أو حادثة إلى نص «الوطنية» لمحمد عبده دون قراءته الأصلي. موقف مستقل: ساعد طلاب في تنظيم كتب المكتبة العامة مع موافقة الإدارة، ثم سجلوا ما تحقق وما يحتاج متابعة. يجعل المثال حب الوطن قيمة خدمية قابلة للمراجعة.","prompt":"أي فعل يعبر عن وطنية عملية؟","correct":"تنظيم الكتب ومراجعة أثر العمل","w1":"الاكتفاء بلافتة","w2":"اختلاق إنجاز","w3":"تجاهل مسؤول المكتبة","practice":"وثق فقرة من النص المقرر وناقش علاقة الوطنية بالمسؤولية مستخدمًا مثالًا جديدًا."},{"n":5,"skill":"وصف المشكلة لدعم الرأي","passage":"في مقال تدريبي مستقِل يقترح متعلم توفير مكان هادئ للقراءة، فيصف الضوضاء التي تقطع التركيز ثم كيف يمكن إعادة ترتيب المقاعد. الوصف يقنع إذا أبرز تفاصيل ترتبط بالأطروحة، لا إذا تحول إلى حشو حسي.","prompt":"ما وظيفة وصف الضوضاء في النص؟","correct":"إبراز المشكلة التي تبرر الحل","w1":"إلغاء الأطروحة","w2":"تكرار اسم المكان","w3":"تغيير الموضوع","practice":"اكتب فقرة حجاجية مدعومة بوصفين متقابلين لمكان تعلم، مع رأي ودليل وتحفظ."},{"n":6,"skill":"قراءة الرسالة التاريخية بإنصاف","passage":"رسالة الأمين إلى المأمون المنقولة في كتب التاريخ، ومنها الطبري بحسب عنوان الدرس، يجب توثيق نصها قبل نسبة طلب أو تهديد أو موقف سياسي إليها. في مثال مستقل يكتب موظف إلى زميله طالبًا تفسير تأخر مهمة ويقترح موعدًا للتصحيح، دون تقليد الحدث التاريخي.","prompt":"ما وظيفة الرسالة المستقلة؟","correct":"طلب توضيح التأخير وخطة حل","w1":"قطع العلاقة بلا سبب","w2":"إلغاء المهمة","w3":"نقل حديث دون عنوان","practice":"اقرأ الرسالة التاريخية المقررة وحدد المخاطب والغرض وشاهدًا نصيًا صحيحًا، ثم قارن برسالة معاصرة أصلية."},{"n":7,"skill":"الأنانية والتعاون في الحجاج","passage":"لا يُنسب مثال مستقل إلى «الفردية سوس ينخر المجتمع» لخليل هنداوي دون مصدر أصلي. في مشروع مشترك احتفظ مشارك ببيانات يحتاجها الجميع، فتوقف العمل. حين شاركها استطاع الفريق إنهاء المهمة؛ يدعم التسلسل رأيًا عن أضرار الاحتكار المعلوماتي.","prompt":"ما سبب توقف المشروع؟","correct":"احتفاظ فرد بالمعلومات وعدم مشاركتها","w1":"التعاون","w2":"توزيع المسؤوليات","w3":"مراجعة النتائج","practice":"استخرج حجة من نص خليل هنداوي بشاهد موثق ثم اكتب ردًا حجاجيًا مع قصة قصيرة من إنشائك."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=11
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027' AND cu.id='79a8732d-6a86-46cd-8cad-31673af20a0c'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='قرأ 212 — عرب 202: الأدب والحياة' AND u.semester=2 AND l.sort_order=r.n AND l.status='published'
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
        jsonb_build_object('origin','DADYOOM_BH_RELIGIOUS_G11_T2_QIRAA212_ORIGINAL_20261008','notOfficialBook',true,'ocrReview','pending','options',CASE (r.n % 4) WHEN 0 THEN jsonb_build_array(r.correct,r.w1,r.w2,r.w3) WHEN 1 THEN jsonb_build_array(r.w1,r.correct,r.w2,r.w3) WHEN 2 THEN jsonb_build_array(r.w1,r.w2,r.correct,r.w3) ELSE jsonb_build_array(r.w1,r.w2,r.w3,r.correct) END),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_RELIGIOUS_G11_T2_QIRAA212_ORIGINAL_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_RELIGIOUS_G11_T2_QIRAA212_ORIGINAL_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_RELIGIOUS_G11_T2_QIRAA212_ORIGINAL_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;