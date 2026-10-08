-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only short published placeholders while retaining prior text and add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":901,"skill":"الحلم والخطوات الصغيرة","passage":"حلم طالب بتطوير أداة تسهل ترتيب الكتب، فبدأ برسم نموذج ثم طلب رأي معلمه وغيّر التصميم بعد تجربة أولية. يوضح النص من ضاديوم الفرق بين الرغبة والخطة والخبرة المتراكمة، ولا ينقل أحداث نص «حلم» المدرسي.","prompt":"ما أول إجراء جعل الحلم قابلاً للتنفيذ؟","correct":"رسم نموذج أولي","w1":"ترك الفكرة","w2":"منع الملاحظات","w3":"إلغاء التجربة","practice":"اكتب قصة قصيرة لحلم يتحول إلى مشروع بخمس مراحل وتحدٍّ واقعي ومراجعة."},{"n":902,"skill":"الفعل المجرد والفعل المزيد","passage":"«كتب» فعل ثلاثي مجرد، و«كاتب» فعل مزيد بالألف على وزن «فاعل»، و«استكتب» مزيد بأحرف «استـ» على وزن «استفعل». تغيّر الزيادة البنية الصرفية وقد يغيّر الدلالة، ولا يكون كل حرف موجود في الكلمة حرف زيادة.","prompt":"ما نوع الفعل «كتب»؟","correct":"ثلاثي مجرد","w1":"خماسي مزيد","w2":"رباعي مجرد","w3":"سداسي مزيد","practice":"صنف عشرة أفعال إلى مجرد ومزيد، وحدد حروف الزيادة والوزن في أربعة أمثلة."},{"n":903,"skill":"أثر المكان في هوية الإنسان","passage":"روى متدرب أنه يعود إلى مكتبة الحي التي تعلم فيها القراءة، فكانت الرفوف القديمة تثير ذكريات معلّمه الأول. يظهر المكان مؤثرًا في الذاكرة والانتماء، لكن المثال ليس من النص الرسمي «علاقة الإنسان بالمكان».","prompt":"ماذا أثارت المكتبة في المتدرب؟","correct":"ذكريات تعلمه الأولى","w1":"نسيان دراسته","w2":"رغبته في الهجرة فورًا","w3":"عدم اهتمامه بالكتب","practice":"أعد حوارًا من ست مداخلات بين شخصين عن مكان ترك أثرًا في هويتهما مع سببين مختلفين."},{"n":904,"skill":"تحليل النادرة الأدبية بأمانة","passage":"تحتاج أخبار أبي دلامة إلى مصدر أصلي قبل نسبة طرفة أو قول للشاعر. في نادرة مستقلة قال متعلم لصاحبه: «كتبت عنوان التقرير فقط، وقد انتهيت من الصفحة الأولى!» فكان موضع الفكاهة خلط عنوان الصفحة بإتمام العمل. لا يُنسب هذا الموقف إلى أبي دلامة.","prompt":"ما المفارقة في النادرة المستقلة؟","correct":"عدّ العنوان إنجازًا للصفحة كاملة","w1":"وجود تقرير","w2":"كتابة الاسم","w3":"حضور الصديق","practice":"استخرج نادرة صحيحة من مصدر أدبي موثوق، وحدد عنصر المفارقة دون اختلاق ألفاظ تاريخية."},{"n":905,"skill":"كم الاستفهامية وكم الخبرية","passage":"«كم كتابًا قرأتَ؟» استفهام عن عدد مجهول، وتمييز «كم» الاستفهامية منصوب في هذا المثال. «كم كتابٍ قرأتُ!» تفيد الإخبار بالكثرة والتعجب منها وقد يأتي تمييزها مجرورًا. تعتمد التفرقة على السياق وعلامات الأسلوب.","prompt":"أي جملة تستخدم كم للاستفهام؟","correct":"كم كتابًا قرأتَ؟","w1":"كم كتابٍ قرأتُ!","w2":"قرأت كتبًا كثيرة","w3":"يا طالبُ","practice":"اكتب ثلاثة أسئلة بكم الاستفهامية وثلاث جمل بكم الخبرية، ثم اضبط التمييز."},{"n":906,"skill":"إبداء الرأي بالحجة والإنصات","passage":"في مناقشة أصلية قال طالب: «أفضّل المشروعات الجماعية لأنها تتيح تبادل المهارات، لكن بعضها يحتاج توزيع أدوار أفضل». فرّق بين موقفه ودليله وتحفظه، واستمع لزميل يخالفه دون تحقير.","prompt":"ما العبارة التي تحمل تحفظًا في الرأي؟","correct":"لكن بعضها يحتاج توزيع أدوار أفضل","w1":"أفضّل المشروعات","w2":"قال طالب","w3":"تبادل المهارات","practice":"اكتب رأيًا من فقرتين حول التعلم الجماعي، فيه حجة ومثال واعتراض ورد مهذب."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=10
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027' AND cu.id='e15ed6fd-370c-4980-b724-d0c19ec2c029'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='عرب 802 — اللغة العربية للتعليم الفني والمهني' AND u.semester=2 AND l.sort_order=r.n AND l.status='published'
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
        jsonb_build_object('origin','DADYOOM_BH_TECH_G10_T2_ARAB802_EXTRA6_ORIGINAL_20261008','notOfficialBook',true,'ocrReview','pending','options',CASE (r.n % 4) WHEN 0 THEN jsonb_build_array(r.correct,r.w1,r.w2,r.w3) WHEN 1 THEN jsonb_build_array(r.w1,r.correct,r.w2,r.w3) WHEN 2 THEN jsonb_build_array(r.w1,r.w2,r.w3,r.correct) ELSE jsonb_build_array(r.w1,r.w2,r.correct,r.w3) END),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_TECH_G10_T2_ARAB802_EXTRA6_ORIGINAL_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_TECH_G10_T2_ARAB802_EXTRA6_ORIGINAL_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_TECH_G10_T2_ARAB802_EXTRA6_ORIGINAL_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;