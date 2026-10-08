-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only genuinely empty published lessons; add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"skill":"العصر العباسي الأول والثاني","passage":"مرت الثقافة العباسية بتحولات متنوعة في مراكز العلم والشعر والنثر، ولا يجوز فرض سمة واحدة على كل شاعر أو مجلس. عند المقارنة ينبغي تحديد فترة النص ومصدره ومكان إنتاجه بدل نقل سرد تاريخي غير مسند.","prompt":"ما الذي يضبط مقارنة المرحلتين العباسيتين؟","correct":"تحديد الحقبة والمكان والنص","w1":"الاكتفاء بالأسماء","w2":"اختلاق خطبة","w3":"إهمال المصادر","practice":"اصنع جدولًا يربط نصين أدبيين محققين بمرحلتين تاريخيتين مع تفسير سمة لكل نص."},{"n":2,"skill":"ازدهار النثر الفني العباسي","passage":"من فنون النثر الفني الرسالة والمناظرة والمقامة في سياقات متفاوتة، ويمكن تحليل الصنعة والأسلوب بالحجة واللغة والإيقاع. مثال ضاديوم المستقل خطاب قصير يدعو إلى التعاون ولا ينسب إلى كاتب عباسي.","prompt":"أي منهج يثبت ازدهار فن نثري؟","correct":"مقارنة نصوص مؤرخة وتحليل بنائها","w1":"القول إنه ازدهر بلا مثال","w2":"اختراع نص","w3":"عد المقاطع فقط","practice":"قارن نمطين من النثر العباسي بنصين موثقين وحدد الأسلوب والمخاطب والغرض."},{"n":3,"skill":"حركة الترجمة والنهضة العلمية","passage":"ارتبطت حركة الترجمة تاريخيًا بتبادل المعارف واللغات في سياقات العباسيين، لكن نسبة كتاب مترجم أو تاريخ إلى شخص بعينه تحتاج مرجعًا. تدريب مستقل يناقش كيف يراجع فريق ترجمة المصطلحات ويدقق الفرق بين نص أصلي وتعليقه.","prompt":"ما الضابط الأهم لنسبة ترجمة تاريخية؟","correct":"التحقق من اسم الكتاب والمترجم والمصدر","w1":"الاعتماد على تشابه لفظ","w2":"تخمين العصر","w3":"حذف المراجع","practice":"أعد بطاقة لكتاب مترجم في العصر العباسي من مصدر علمي موثوق مع لغة الأصل والمترجم إن ثبت."},{"n":4,"skill":"المثل الحيواني والحجة السردية","passage":"«الحمامة والثعلب ومالك الحزين» عنوان حكاية يحتاج النسخة الأصلية لتحديد الشخصيات وأفعالها وعبرتها، ولا تؤلف تفاصيل ثم تنسب إلى التراث. قصة تدريبية مستقلة تصور عصفورًا يستشير صديقًا قبل بناء عشه، وتفيد في استخراج سبب ونتيجة دون مماثلة النص.","prompt":"ما المهارة التحليلية في حكايات الحيوان؟","correct":"الربط بين الفعل والنتيجة والعبرة","w1":"حفظ العنوان فقط","w2":"اختراع أسماء المؤلفين","w3":"حذف العقدة","practice":"استخرج من الحكاية الأصلية حدثًا وشاهدًا يدل على مغزاه ثم قارنه بحكاية أصيلة."},{"n":5,"skill":"الشعر الحماسي عند أبي تمام","passage":"«زحف عربي ظافر» لأبي تمام يتطلب الأبيات الصحيحة وسياقها قبل تحديد الأساليب والخصوم أو نسبة رواية، ويمكن تحليل الحماسة عبر الأفعال والصور إذا ثبتت في النص. تدريب مستقل يصف فريقًا يثابر حتى ينجز مهمة صعبة، لا يمثل القصيدة.","prompt":"ما أفضل دليل على الحماسة في قصيدة موثقة؟","correct":"أفعال وصور تدل على الحركة والانفعال","w1":"الاسم وحده","w2":"قصيدة من تأليفنا","w3":"حكم على الشاعر بلا نص","practice":"اختر بيتًا أصليًا من القصيدة، واستخرج أسلوبًا حماسيًا ووضح أثره على المتلقي."},{"n":6,"skill":"العروض: بحر الوافر","passage":"الصورة التامة للوافر تقوم على «مفاعلتن مفاعلتن فعولن» في كل شطر وفق الصورة المدروسة. قد تدخل زحافات مثل العصب على «مفاعلتن»، لذلك ينبغي مراجعة الشطر الصحيح قبل القطع والحكم.","prompt":"ما تفعيلة الوافر الأولى في صورته التامة؟","correct":"مفاعلتن","w1":"فاعلاتن","w2":"مستفعلن","w3":"متفاعلن","practice":"اختر بيتًا على الوافر من مصدر عروض موثق وقطعه ثم راجع موضع الزحاف إن وجد."},{"n":7,"skill":"خصائص شعر العباسيين وترجمة الجاحظ","passage":"يظهر تنوع أغراض الشعر العباسي بحسب الزمن والشاعر، بينما الجاحظ من أعلام النثر وله آثار ينبغي توثيقها من مصادر محققة. لا تُختلق له أقوال أو شذرات توصف بأنها من كتبه؛ وتُفصل ترجمة الكاتب عن تحليل الشعر.","prompt":"ما الذي يميز عمل الجاحظ المذكور في التدريب؟","correct":"دراسة النثر بآثار موثقة","w1":"اعتبار كل شعر عباسي له","w2":"اختلاق قول منسوب","w3":"إلغاء التاريخ","practice":"قدّم بطاقة ترجمة للجاحظ وخصيصتين لشعر عباسي من نص آخر مع مصادر واضحة."},{"n":8,"skill":"الخطبة ودلالات الجهاد في النص التاريخي","passage":"قراءة «في الجهاد» لابن نباتة الفارقي تحتاج متنها الصحيح وتحديد سياق الخطبة قبل الحكم على مواقفها أو اقتباس عبارة. يركز تدريب ضاديوم على مهارة تحليل بنية الخطاب التاريخي من مقدمة وحجة وخاتمة، دون توليد دعوات قتالية.","prompt":"ما أول شرط لتحليل خطبة تاريخية؟","correct":"التحقق من النص والسياق والمخاطب","w1":"اختلاق عبارات","w2":"حذف الفترة التاريخية","w3":"الاعتماد على عنوان فقط","practice":"حدد غرض الخطبة المقررة وشاهدًا بلاغيًا صحيحًا مع تحليل سياقه التاريخي دون نسب غير موثق."},{"n":9,"skill":"العروض: البحر الرمل","passage":"يتكرر في الرمل التام «فاعلاتن فاعلاتن فاعلاتن» في كل شطر في صورته الأصلية، مع تغيرات عروضية معروفة. يحتاج التقطيع الانتباه إلى النطق والحروف المشددة والوقف وحركات الإعراب.","prompt":"ما التفعيلة الأساسية للرمل؟","correct":"فاعلاتن","w1":"فعولن","w2":"متفاعلن","w3":"مفاعلتن","practice":"اختر بيتًا صحيح النسبة على بحر الرمل وطبّق عليه التقطيع والحكم على الزحافات."},{"n":10,"skill":"المديح في شعر المتنبي","passage":"نص «مدح وإشادة بسيف الدولة» للمتنبي يحتاج الأبيات المدرسية لتحديد الصورة والمخاطب والحجة وموضع المبالغة. مثال مستقل: «يشيد زميل بدقة قائد الفريق في حل المشكلة» لا يمثل بيتًا من المتنبي.","prompt":"ما الذي يثبت المدح في بيت من القصيدة؟","correct":"لفظ أو صورة موثقة من البيت","w1":"العنوان وحده","w2":"حكاية متخيلة","w3":"اسم الشاعر فقط","practice":"استخرج بيتًا صحيحًا يدل على المديح، وحدد الصورة البلاغية وأثرها والمبالغة إن وجدت."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=11
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027' AND cu.id='4611ec73-1e1a-4571-9c51-05d7c901c83f'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='أدب 211 — الأدب والنصوص والعروض' AND u.semester=1 AND l.sort_order=r.n AND l.status='published'
    FOR UPDATE OF l;
    IF char_length(coalesce(target_content,''))<350 THEN
      UPDATE public.lessons SET
        content='ضاديوم — إثراء مستقل أصلي للصف الحادي عشر، الفصل الأول. لا يمثل النص الوزاري الأصلي ولا يثبت مطابقة العنوان للمصدر.'||E'\n\n'||
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
    IF EXISTS (SELECT 1 FROM public.lessons WHERE id=target_id AND content LIKE 'ضاديوم — إثراء مستقل أصلي للصف الحادي عشر%') THEN
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'فهم النص الإثرائي','multiple_choice','assessment',r.prompt,
        jsonb_build_object('origin','DADYOOM_BH_RELIGIOUS_G11_T1_ADAB211_ORIGINAL_20261008','notOfficialBook',true,'ocrReview','pending','options',CASE (r.n % 4) WHEN 0 THEN jsonb_build_array(r.correct,r.w1,r.w2,r.w3) WHEN 1 THEN jsonb_build_array(r.w1,r.correct,r.w2,r.w3) WHEN 2 THEN jsonb_build_array(r.w1,r.w2,r.correct,r.w3) ELSE jsonb_build_array(r.w1,r.w2,r.w3,r.correct) END),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_RELIGIOUS_G11_T1_ADAB211_ORIGINAL_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_RELIGIOUS_G11_T1_ADAB211_ORIGINAL_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_RELIGIOUS_G11_T1_ADAB211_ORIGINAL_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;