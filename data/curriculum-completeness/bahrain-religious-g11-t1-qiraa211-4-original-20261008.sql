-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only genuinely empty published lessons; add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"skill":"الحكاية المثلية وعمل الجماعة","passage":"تحليل «الحمامة المطوقة والجرذ» يستلزم النص الأصلي الموثق قبل وصف الخطوات أو الأقوال، ولو عرف القارئ نسخًا شعبية من الحكاية. مثال مستقل: تعاونت طيور في الابتعاد عن خطر ثم طلبت مساعدة صديق، لتدريب تحليل علاقة السبب والنتيجة فقط.","prompt":"ما المهارة التي توضحها الحكاية التدريبية؟","correct":"تعاون الشخصيات لتجاوز مشكلة","w1":"غياب الحدث","w2":"تكرار العنوان","w3":"وصف المكان وحده","practice":"ارجع إلى النسخة المقررة واستخرج موقفًا وحجة سردية وشاهدًا موثقًا مع مقارنة المثال المستقل."},{"n":2,"skill":"الخطبة بين الراعي والرعية","passage":"عنوان «خطبة الراعي والرعية» لا يثبت صاحبها أو متنها دون المصدر. نموذج ضاديوم المستقل: يناقش قائد طلابي مسؤولية تنظيم العمل وحق الأعضاء في سماع أسباب القرارات. هدفه تحليل عناصر الإقناع لا تقليد خطبة تاريخية.","prompt":"ما الذي يزيد مصداقية خطاب المسؤول؟","correct":"بيان المسؤوليات والأسباب أمام المخاطبين","w1":"إخفاء القرارات","w2":"التعميم بلا دليل","w3":"نسبة حديث مختلق","practice":"استخرج من الخطبة المدرسية مطالبة أو تعليلًا صحيحًا مع شاهد موثق، ثم اكتب خطابًا معاصرًا مستقلًا."},{"n":3,"skill":"رسائل الجاحظ ومنهج الاستدلال","passage":"لتحليل «الكتاب» في رسائل الجاحظ ينبغي مراجعة النص المحقق، لأن العنوان قد يشير إلى موضوعات متعددة. مثال مستقل: يبين طالب فوائد تسجيل الأفكار بالكتابة ثم يعرض اعتراضًا على الاعتماد على الملاحظات وحدها، وهو تدريب حجاجي غير منسوب للجاحظ.","prompt":"ما عنصر الحجاج في المثال المستقل؟","correct":"عرض حجة واعتراض","w1":"ذكر اسم الكاتب","w2":"غياب الفكرة","w3":"تكرار عنوان الرسالة","practice":"بعد قراءة رسالة الجاحظ المقررة، استخرج دعوى ودليلًا أو مثالًا صحيحين، ثم قارنهما بمثال حديث."},{"n":4,"skill":"قضية اجتماعية في نص حضاري","passage":"«المرأة العربية وتحديات الواقع» عنوان يناقش قضية يحتاج تناولها إلى بيانات وسياقات متنوعة وأصوات ذات صلة، لا تعميم تجربة واحدة. في حوار مستقل تعرض طالبتان عائقًا في الوصول إلى نشاط علمي وتقترحان دعمًا واضحًا ومعيارًا للتحقق من الأثر.","prompt":"ما المنهج المنصف لتحليل قضية اجتماعية؟","correct":"عرض الوقائع والأدلة والسياقات المختلفة","w1":"إلغاء اختلاف التجارب","w2":"اختلاق الإحصاءات","w3":"ذكر العنوان فقط","practice":"اقرأ النص المقرر واستخرج حجة وشاهدًا، ثم ناقش مقترحًا عمليًا بمقياس نجاح دون تعميم."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=11
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027' AND cu.id='4611ec73-1e1a-4571-9c51-05d7c901c83f'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='قرأ 211 — القراءة في النص الحجاجي' AND u.semester=1 AND l.sort_order=r.n AND l.status='published'
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
        jsonb_build_object('origin','DADYOOM_BH_RELIGIOUS_G11_T1_QIRAA211_ORIGINAL_20261008','notOfficialBook',true,'ocrReview','pending','options',CASE (r.n % 4) WHEN 0 THEN jsonb_build_array(r.correct,r.w1,r.w2,r.w3) WHEN 1 THEN jsonb_build_array(r.w1,r.correct,r.w2,r.w3) WHEN 2 THEN jsonb_build_array(r.w1,r.w2,r.correct,r.w3) ELSE jsonb_build_array(r.w1,r.w2,r.w3,r.correct) END),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_RELIGIOUS_G11_T1_QIRAA211_ORIGINAL_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_RELIGIOUS_G11_T1_QIRAA211_ORIGINAL_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_RELIGIOUS_G11_T1_QIRAA211_ORIGINAL_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;