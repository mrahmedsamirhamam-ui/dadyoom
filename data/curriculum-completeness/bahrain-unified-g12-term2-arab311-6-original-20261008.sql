-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only genuinely empty published lessons; add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"skill":"الدراسة المقارنة والتأثر الأدبي","passage":"تبحث المقارنة بين «كليلة ودمنة» وخرافات لافونتين في بنية الحكاية الحيوانية والعبرة وأساليب السرد، لكنها تحتاج قراءة نسخ موثوقة قبل إثبات اقتباس حكاية بعينها أو اتجاه التأثير. تدريب أصلي: «تناقش حيوانات الغابة توزيع الماء، ثم تدرك أهمية الإنصاف»؛ ليس نصًا لأي من المؤلفين.","prompt":"ما الدليل اللازم لادعاء تأثر حكاية بأخرى؟","correct":"مقارنة نصين موثقين مع سياق الانتقال","w1":"تشابه عنوان فقط","w2":"انطباع شخصي","w3":"صورة لغلاف كتاب","practice":"أعد جدول مقارنة بين حكايتين موثقتين من التراثين يدرس الشخصيات والعبرة والسرد دون اختلاق اقتباسات."},{"n":2,"skill":"مقال عن انتقال الأشكال الأدبية","passage":"قد ينتقل شكل قصصي أو فكرة عبر الترجمة والرحلات والقراءة، لكن إثبات التأثير التاريخي يحتاج ترتيبًا زمنيًا ومراجع. نموذج مستقل: يقارن طالب حكايتين تتناولان أثر الصدق، ويذكر التشابه والاختلاف ثم يسأل هل تكفي المقارنة وحدها للحكم على التأثير؟","prompt":"ما الذي لا تكفي له أوجه التشابه وحدها؟","correct":"الجزم بعلاقة تأثير تاريخية","w1":"رصد الموضوع المشترك","w2":"وصف الشخصيات","w3":"ترتيب الأحداث","practice":"اكتب مخطط مقال أدبي عن أثر التراث العربي في نص عالمي مع سؤال بحث وشاهدين ومراجعين موثوقين."},{"n":3,"skill":"المقامة والأدب البيكاريسكي","passage":"تستدعي مقارنة المقامة العربية والأدب البيكاريسكي البحث في الراوي والتشرد والمغامرة والسخرية وأشكال السرد، مع الحذر من مساواة التقليدين أو افتراض صلة مباشرة دون وثائق. في حكاية تدريبية يتنقل راوٍ بين ثلاث مدن ويتعلم من مفارقات اللقاءات.","prompt":"ما القضية التي تحتاج توثيقًا تاريخيًا خاصًا؟","correct":"إثبات التأثير المباشر بين التقليدين","w1":"مقارنة نوع الراوي","w2":"ملاحظة التنقل","w3":"تحليل عنصر السخرية","practice":"قارن مقطعًا موثقًا من مقامة بمقطع مأذون من رواية بيكاريسكية في ثلاث خصائص، ثم ناقش حدود الاستنتاج."},{"n":4,"skill":"منهج مقارنة قصيدتين","passage":"تحتاج مقارنة «الأرض الخراب» و«أنشودة المطر» إلى النصوص الأصلية أو ترجمات معتمدة لتحديد الصورة والبنية والموقف من الزمن والمدينة، ولا يصح نسبة تشبيه أو عبارة دون مصدر. مثال مستقل: «مطر يطرق باب المدينة بينما يتذكر الراوي موسم الجفاف»؛ ليس من أي القصيدتين.","prompt":"ما شرط تحليل صورة شعرية من القصيدتين؟","correct":"توثيق العبارة من النص الصحيح","w1":"اختلاق بيت مناسب","w2":"الاعتماد على العنوان فقط","w3":"إهمال اختلاف اللغة","practice":"أنشئ مصفوفة مقارنة بين صورة موثقة من كل قصيدة وعلاقتها بالإيقاع والعاطفة والسياق، مع ذكر الترجمة عند الحاجة."},{"n":5,"skill":"قراءة مرثية في سياقها الصحيح","passage":"تحليل النص المنسوب إلى إيديث سيتول يتطلب التحقق من العنوان والترجمة والطبعة قبل مناقشة صوت المتكلم والرموز. تدريب مستقل: «توقفت المدينة عند فجر هادئ لتتذكر من فقدتهم». هذا مثال للجو الرثائي وليس ترجمة أو اقتباسًا من المرثية.","prompt":"ما الذي يجب توثيقه قبل الاقتباس من شعر مترجم؟","correct":"النص والترجمة والطبعة","w1":"اسم المدينة فقط","w2":"طول السطر","w3":"موعد القراءة","practice":"اكتب قراءة قصيرة لمرثية بعد التحقق من نصها، مع شاهد موثق وتفسير للصورة دون اختلاق أبيات."},{"n":6,"skill":"مقال عن قضية إنسانية مشتركة","passage":"يمكن أن يناقش مقال عالمي حق التعليم أو حماية البيئة أو المسؤولية عن الكوارث، لكن الرأي يحتاج دليلًا متحققًا وتصورًا لوجهة نظر مختلفة. في مثال مستقل اقترحت طالبة تبادل كتب مجانية في الحي، وسألت عن ضمان الوصول العادل للطلاب.","prompt":"ما الذي يجعل القضية إنسانية واسعة؟","correct":"اتصالها باحتياجات الناس وحقوقهم عبر مجتمعات مختلفة","w1":"كونها تخص فردًا واحدًا فقط","w2":"غياب الدليل","w3":"عدم وجود متأثرين","practice":"اكتب مقالًا أدبيًا في قضية إنسانية كونية يتضمن قصة افتتاحية وحجتين وتحفظًا وخاتمة عملية."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=12
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027' AND cu.id='31c82c79-72de-4e4b-a5dc-6f9e598b3533'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='عرب 311 — من الأدب العالمي (اختياري)' AND u.semester=2 AND l.sort_order=r.n AND l.status='published'
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
        jsonb_build_object('origin','DADYOOM_BH_UNIFIED_G12_T2_ARAB311_ORIGINAL_20261008','notOfficialBook',true,'ocrReview','pending','options',CASE (r.n % 4) WHEN 0 THEN jsonb_build_array(r.correct,r.w1,r.w2,r.w3) WHEN 1 THEN jsonb_build_array(r.w1,r.correct,r.w2,r.w3) WHEN 2 THEN jsonb_build_array(r.w1,r.w2,r.correct,r.w3) ELSE jsonb_build_array(r.w1,r.w2,r.w3,r.correct) END),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_UNIFIED_G12_T2_ARAB311_ORIGINAL_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_UNIFIED_G12_T2_ARAB311_ORIGINAL_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_UNIFIED_G12_T2_ARAB311_ORIGINAL_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;