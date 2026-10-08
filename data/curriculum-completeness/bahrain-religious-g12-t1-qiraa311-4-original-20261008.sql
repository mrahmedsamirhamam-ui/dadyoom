-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only genuinely empty published lessons; add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"skill":"قراءة حكاية حيوانية مقارنة","passage":"حكاية «الصفرد والأرنب والسنور» في «كليلة ودمنة» تحتاج النسخة المدرسية للتحقق من أسماء الشخصيات وأحداث الحكاية والعبرة. نص مستقل: «تنازع حيوانان على مأوى، فتدخّل ثالث بحجة غير مقنعة» تدريب على تمييز الحجة من المراوغة وليس من التراث المنقول.","prompt":"ما المهارة اللازمة لنقد كلام الشخصية الثالثة؟","correct":"فحص حجة المتدخل ودليله","w1":"الاعتماد على صوته فقط","w2":"إلغاء السبب","w3":"حفظ العنوان","practice":"اقرأ الحكاية الأصلية واستخرج حدثًا موثقًا وحجة شخصية ونتيجتها مع تفسير العبرة."},{"n":2,"skill":"الحكاية العجائبية ومنهج المصدر","passage":"«حكاية التاجر مع العفريت» من «ألف ليلة وليلة» لها نسخ وتفاصيل تتطلب الرجوع إلى المقرر قبل وصف العقدة والأقوال. مثال مستقل: «وجد مسافر رسالة غامضة فطلب تفسيرًا قبل اتخاذ قرار» يمثل بناء تشويق لا يكرر الحكاية التاريخية.","prompt":"ما العنصر الذي يثير التشويق في المثال؟","correct":"الرسالة الغامضة","w1":"عدد الصفحات","w2":"اسم الكاتب","w3":"علامة الرفع","practice":"قارن بين عقدة وحل موثقين في الحكاية الأصلية ونموذج عجائبي قصير من كتابتك."},{"n":3,"skill":"السندباد بين المغامرة والسرد","passage":"تتعدد رحلات السندباد البحري وتختلف تفاصيلها بين طبعات «ألف ليلة وليلة»، لذا ينبغي تحديد الرحلة التي يدرسها المتعلم ومصدرها قبل تلخيصها. نموذج مستقل: بحر هادئ تحول إلى عاصفة فاضطر طاقم سفينة إلى تغيير المسار، ولا يمثل رحلة من الكتاب.","prompt":"ما الحدث الذي غيّر مسار السفينة في المثال؟","correct":"العاصفة","w1":"هدوء البحر","w2":"عنوان الرحلة","w3":"عدد الطاقم","practice":"استخرج من رحلة السندباد المقررة عقدة وحلًا وشاهدًا صحيحًا، ثم ارسم خريطة أحداث."},{"n":4,"skill":"تحليل قصة محمود تيمور دون اختلاق","passage":"قصة «هدية العرس» لمحمود تيمور تحتاج النص المقرر لتحديد وجهة النظر والشخصيات والمفارقة. في قصة تدريبية مستقلة قدّم ضيف علبة ظن الجميع أنها هدية ثم تبين أنها أدوات إصلاح للمنزل، فاستغربوا قبل فهم القصد.","prompt":"ما سبب مفاجأة الضيوف في المثال المستقل؟","correct":"اختلاف محتوى العلبة عما توقعوه","w1":"وجود حفل فقط","w2":"اسم الضيف","w3":"عدد الحاضرين","practice":"بعد قراءة القصة الأصلية حدد مفارقة موثقة وكيف شكلت الحدث، ثم اكتب قصة ذات نهاية مختلفة من إنشائك."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=12
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027' AND cu.id='4611ec73-1e1a-4571-9c51-05d7c901c83f'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='قرأ 311 — القراءة والسرد' AND u.semester=1 AND l.sort_order=r.n AND l.status='published'
    FOR UPDATE OF l;
    IF char_length(coalesce(target_content,''))<350 THEN
      UPDATE public.lessons SET
        content='ضاديوم — إثراء مستقل أصلي للصف الثاني عشر، الفصل الأول. لا يمثل النص الوزاري الأصلي ولا يثبت مطابقة العنوان للمصدر.'||E'\n\n'||
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
    IF EXISTS (SELECT 1 FROM public.lessons WHERE id=target_id AND content LIKE 'ضاديوم — إثراء مستقل أصلي للصف الثاني عشر%') THEN
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'فهم النص الإثرائي','multiple_choice','assessment',r.prompt,
        jsonb_build_object('origin','DADYOOM_BH_RELIGIOUS_G12_T1_QIRAA311_ORIGINAL_20261008','notOfficialBook',true,'ocrReview','pending','options',CASE (r.n % 4) WHEN 0 THEN jsonb_build_array(r.correct,r.w1,r.w2,r.w3) WHEN 1 THEN jsonb_build_array(r.w1,r.correct,r.w2,r.w3) WHEN 2 THEN jsonb_build_array(r.w1,r.w2,r.correct,r.w3) ELSE jsonb_build_array(r.w1,r.w2,r.w3,r.correct) END),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_RELIGIOUS_G12_T1_QIRAA311_ORIGINAL_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_RELIGIOUS_G12_T1_QIRAA311_ORIGINAL_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_RELIGIOUS_G12_T1_QIRAA311_ORIGINAL_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;