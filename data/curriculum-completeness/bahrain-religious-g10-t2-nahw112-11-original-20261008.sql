-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only genuinely empty published lessons; add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"skill":"الابتداء بالنكرة ومسّوغاته","passage":"الأصل أن يكون المبتدأ معرفة، لكن يجوز الابتداء بالنكرة عند تحقق مسوغ معتبر. في «في المكتبةِ كتابٌ» تقدم شبه الجملة خبرًا، و«كتابٌ» مبتدأ مؤخر نكرة؛ أفاد التركيب الإخبار عن وجود كتاب في مكان معلوم.","prompt":"ما إعراب «كتابٌ» في «في المكتبة كتابٌ»؟","correct":"مبتدأ مؤخر مرفوع","w1":"مفعول به منصوب","w2":"حال","w3":"مضاف إليه","practice":"اكتب أربع جمل تبدأ بنكرة مع مسوغ صحيح، وأعرب المبتدأ والخبر وعلل جواز الابتداء."},{"n":2,"skill":"اسم الآلة ووزنه","passage":"اسم الآلة يدل على الأداة المستخدمة في الفعل، مثل «مِفتاح» من «فتح» على وزن «مِفعال». وقد تستعمل العربية أسماء آلات جامدة أو أوزانًا حديثة؛ لذا لا يُقاس كل اسم آلة على وزن واحد.","prompt":"ما وزن «مِفتاح» الصرفي؟","correct":"مِفعال","w1":"فاعل","w2":"مفعول","w3":"فعول","practice":"اجمع أسماء ثماني آلات مألوفة، وحدد المشتق والجامد ووزن أربعة أسماء مشتقة."},{"n":3,"skill":"صيغ المبالغة من الفعل","passage":"ترد صيغ المبالغة على أوزان شائعة مثل «فعّال» في «غفّار» و«فعول» في «صبور». قد تفيد كثرة الفعل أو قوته وفق السياق، فلا يعني وجود صيغة معينة أن كل استعمال وصف حقيقي لشخص ما.","prompt":"أي كلمة على وزن «فعول»؟","correct":"صبور","w1":"غفّار","w2":"كاتب","w3":"مكتوب","practice":"كوّن خمس جمل على أوزان صيغ المبالغة، ثم فسر الدلالة والوزن وسبب اختيار الكلمة."},{"n":4,"skill":"أفعال المقاربة واقتران الخبر بأن","passage":"في «كاد المطرُ يهطلُ» فعل «كاد» من أفعال المقاربة، اسمها مرفوع وخبرها جملة فعلية مضارعية، ويشيع تجرد خبرها من «أن». وفي «أوشك المطر أن يهطل» يغلب اقتران خبر «أوشك» بأن، مع مراعاة اختلاف أحكام الأفعال.","prompt":"أي فعل يشيع تجرد خبره من أن؟","correct":"كاد","w1":"أوشك في جميع أحوالها","w2":"إنّ","w3":"ليس من أفعال المقاربة","practice":"اكتب أربع جمل بكاد وأوشك وعسى، وحدد الاسم والخبر وموضع أن مع شرح الاختلاف."},{"n":5,"skill":"الاستعارة المكنية والتصريحية","passage":"في «ابتسم الصباح» شُبّه الصباح بإنسان وحُذف المشبه به وأُبقي لازم من لوازمه، فهي استعارة مكنية. وفي «رأيت أسدًا يقود الفريق» إذا أريد رجل شجاع فهي استعارة تصريحية، والقرينة تحدد المجاز.","prompt":"ما نوع الاستعارة في «ابتسم الصباح»؟","correct":"مكنية","w1":"تصريحية","w2":"طباق","w3":"مجاز مرسل","practice":"أنشئ مثالين لكل نوع من الاستعارة مع تحديد القرينة والوجه البلاغي دون اقتباسات من كتاب غير موثق."},{"n":6,"skill":"لا النافية للجنس وشروط عملها","passage":"في «لا طالبَ في الصف» تعمل «لا» النافية للجنس عمل إنّ إذا استوفت شروطها؛ «طالبَ» اسم لا المفرد المبني على الفتح في محل نصب، وشبه الجملة «في الصف» خبرها. ينبغي التفريق بينها وبين لا الناهية التي تجزم المضارع.","prompt":"ما نوع «لا» في «لا طالبَ في الصف»؟","correct":"نافية للجنس","w1":"ناهية","w2":"عاطفة","w3":"زائدة دائمًا","practice":"كوّن أربعة أمثلة صحيحة للا النافية للجنس، وميّز حال اسمها المفرد والمضاف والشبيه بالمضاف."},{"n":7,"skill":"اسما الزمان والمكان من الفعل","passage":"«مكتب» اسم مكان يدل على موضع الكتابة في استعماله المألوف، و«موعد» قد يدل على زمان اللقاء أو مكانه وفق السياق. تتقاطع بعض الصيغ الصرفية، فيعين السياق على تحديد المقصود.","prompt":"ما الذي يحدد استعمال «موعد» زمانًا أو مكانًا؟","correct":"السياق الذي ورد فيه","w1":"عدد حروفه فقط","w2":"كونه معرفة دائمًا","w3":"علامة التنوين فقط","practice":"اشتق أمثلة لاسم الزمان واسم المكان من أفعال مناسبة، ثم ضعها في جمل تبين الدلالة."},{"n":8,"skill":"التعجب بصيغتين","passage":"في «ما أجملَ الصدقَ!» تعجب قياسي على وزن «ما أفعَلَه»، و«أجمِلْ بالصدق!» على وزن «أفعِلْ به». للصياغة المباشرة شروط متعلقة بالفعل فلا يصاغ التعجب من كل فعل بالطريقة نفسها.","prompt":"ما صيغة «ما أجمل الصدق»؟","correct":"ما أفعله","w1":"أفعل تفضيل فقط","w2":"نفي","w3":"استفهام حقيقي","practice":"اكتب جملتي تعجب صحيحتين حول قيمة أخلاقية، ثم أعرب المتعجب منه وبيّن سبب صحة الصيغة."},{"n":9,"skill":"ظن وأخواتها والمفعولان","passage":"«ظننتُ الطالبَ مجتهدًا» فعل قلبي ينصب مفعولين أصلهما مبتدأ وخبر، «الطالبَ» مفعول أول و«مجتهدًا» مفعول ثان. لا تُفهم صيغة الظن على أنها حقيقة يقينية دون قرينة.","prompt":"ما إعراب «مجتهدًا» في المثال؟","correct":"مفعول به ثان منصوب","w1":"فاعل مرفوع","w2":"اسم مجرور","w3":"حال فقط","practice":"كوّن أربع جمل بظن وحسب وعلم في سياق مناسب، ثم حدد المفعولين وأصلهما قبل دخول الفعل."},{"n":10,"skill":"اسم التفضيل وضوابطه","passage":"«هذا الشرح أوضحُ من السابق» يتضمن اسم التفضيل «أوضح» للمقارنة بين مستويين في الوضوح، ويحتاج تحديد وجه المقارنة. من الصفات التي لا تصاغ مباشرة قد نعتمد تركيبًا مثل «أكثر انتظامًا» إذا استوفى السياق المعنى.","prompt":"ما اسم التفضيل في «الشرح أوضح من السابق»؟","correct":"أوضح","w1":"الشرح","w2":"السابق","w3":"من","practice":"اكتب ست جمل للمقارنة بين أمور معروفة، ثم ناقش متى تُصاغ أفعل مباشرة ومتى نستعمل أكثر مع مصدر."},{"n":11,"skill":"الكناية عن الصفة","passage":"«فلان نظيف اليد» قد تكون كناية عن النزاهة في سياق الحديث عن الأمانة، مع احتمال المعنى الحرفي بحسب المقام. تكمن قيمة الكناية في الإيحاء بالصفة دون تسميتها مباشرة.","prompt":"عن أي صفة تكني «نظيف اليد» في سياق الأمانة؟","correct":"النزاهة","w1":"السرعة","w2":"الطول","w3":"النسيان","practice":"اكتب خمسة تعبيرات كناية صحيحة عن صفات مختلفة، وفسر المعنى المقصود والقرينة."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=10
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027' AND cu.id='79a8732d-6a86-46cd-8cad-31673af20a0c'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='نحو 112 — شرح ابن عقيل والصرف الميسر وأسرار البيان' AND u.semester=2 AND l.sort_order=r.n AND l.status='published'
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
        jsonb_build_object('origin','DADYOOM_BH_RELIGIOUS_G10_T2_NAHW112_ORIGINAL_20261008','notOfficialBook',true,'ocrReview','pending','options',CASE (r.n % 4) WHEN 0 THEN jsonb_build_array(r.correct,r.w1,r.w2,r.w3) WHEN 1 THEN jsonb_build_array(r.w1,r.correct,r.w2,r.w3) WHEN 2 THEN jsonb_build_array(r.w1,r.w2,r.correct,r.w3) ELSE jsonb_build_array(r.w1,r.w2,r.w3,r.correct) END),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_RELIGIOUS_G10_T2_NAHW112_ORIGINAL_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_RELIGIOUS_G10_T2_NAHW112_ORIGINAL_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_RELIGIOUS_G10_T2_NAHW112_ORIGINAL_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;