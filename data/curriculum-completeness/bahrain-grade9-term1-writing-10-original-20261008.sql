-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only genuinely empty published lessons; add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":3,"skill":"تخطيط بداية قصة مترابطة","passage":"نص قصصي مستقل: «في صباح هادئ وصلت ريم إلى المكتبة لتعيد كتابًا استعارتْه. عند الباب سمعت إعلانًا عن مسابقة القراءة». تكشف البداية عن الشخصية والمكان والزمان والهدف، وتمهد لحدث سيغير الخطط. لا يمثل النص مادة الكتاب الوزاري.","prompt":"أي عنصر يوضح المكان في بداية القصة؟","correct":"المكتبة","w1":"صباح هادئ","w2":"ريم","w3":"مسابقة القراءة","practice":"اكتب بداية قصة في أربعة أسطر تقدم شخصية ومكانًا وزمانًا وهدفًا واضحًا، ثم حدد هذه العناصر."},{"n":4,"skill":"بناء عقدة وسبب ونتيجة","passage":"في نموذج أصلي: «فقد سالم بطاقة المشاركة قبل بدء السباق، فبحث في حقيبته ثم استعان بالمشرف». الضياع عقدة، والبحث والاستعانة أفعال ناتجة عنها. التسلسل يجيب: ماذا حدث؟ ولماذا جاء الحدث التالي؟","prompt":"ما العقدة الرئيسة في نموذج القصة؟","correct":"فقدان بطاقة المشاركة","w1":"وجود السباق","w2":"حضور المشرف","w3":"حقيبة سالم","practice":"اكتب فقرة تضع فيها عقبة واحدة لشخصيتك وتتبعها بمحاولتين منطقيتين لحلها."},{"n":5,"skill":"إنهاء قصة بحل مرتبط بالعقدة","passage":"نموذج أصلي: «وجد المشرف البطاقة بين الأوراق التي سقطت من سالم، فتأكد من هويته وأعادها إليه قبل السباق». تحل النهاية مشكلة محددة ولا تضيف مصادفة لا علاقة لها بالأحداث السابقة؛ ونوازن بين الحل والتعلم من التجربة.","prompt":"لماذا تعد النهاية منطقية؟","correct":"لأن العثور على البطاقة يحل المشكلة الأصلية","w1":"لأن السباق أُلغي","w2":"لأن الشخصية تغيرت دون سبب","w3":"لأن المكان لم يذكر","practice":"اكتب خاتمة لعقدة فقدان غرض مهم، موضحًا خطوة الحل وأثرها في الشخصية."},{"n":6,"skill":"التمييز بين الوصف الخِلقي والخُلقي","passage":"في فقرة مستقلة: «كان يوسف طويل القامة يضع نظارة صغيرة، لكنه يصغي إلى الجميع ويساعد زملاءه». القامة والنظارة صفتان خِلقيتان مرئيتان، أما الإصغاء والمساعدة فيدلان على خُلق وسلوك. الوصف يدعم السرد ولا يوقفه.","prompt":"أي عبارة تدل على صفة خُلُقية؟","correct":"يساعد زملاءه","w1":"طويل القامة","w2":"يضع نظارة","w3":"له شعر أسود","practice":"اكتب وصف شخصية تتضمن صفتين ظاهرتين وسلوكين يكشفان خلقها دون الحكم عليها بكلمة عامة فقط."},{"n":7,"skill":"إظهار الصفات عبر السلوك","passage":"نموذج أصلي: «عادت نورة إلى الصف بعد انتهاء الحصة لتعيد قلمًا وجدته على الأرض، ثم بحثت عن صاحبه». هذا الفعل يبين الأمانة أبلغ من قول «نورة أمينة» وحده. القارئ يستنتج الخُلق من الدليل.","prompt":"ما الصفة المستنتجة من إعادة القلم؟","correct":"الأمانة","w1":"التسرع","w2":"الأنانية","w3":"الكسل","practice":"اكتب مشهدًا قصيرًا يكشف صفتين خُلُقيتين من أفعال الشخصية وحوارها، مع تفسير الدليل."},{"n":8,"skill":"الروابط الزمنية في تسلسل القصة","passage":"نموذج مستقل: «أولًا سمعت ليلى جرس الإنذار، ثم خرجت بهدوء مع زميلاتها، وبعد ذلك اجتمع الجميع في الساحة». الروابط الزمنية ترتب الأحداث، ويجب أن تتوافق مع منطق السبب والنتيجة.","prompt":"أي رابط يدل على الحدث التالي؟","correct":"ثم","w1":"ربما","w2":"لكن","w3":"لأنها","practice":"اكتب سلسلة من أربعة أحداث مرتبطة باستخدام أولًا ثم وبعد ذلك وأخيرًا مع المحافظة على زمن واضح."},{"n":9,"skill":"الترابط بين دوافع الشخصية وأفعالها","passage":"في مثال أصلي: «أراد حسن أن يعتذر لصديقه بعد خلاف، فكتب رسالة قصيرة، ثم طلب لقاءه». الدافع هو إصلاح العلاقة، والكتابة فعل يقود إلى الحل. إذا حُذف الدافع أصبح التسلسل أقل إقناعًا.","prompt":"ما الدافع إلى كتابة الرسالة؟","correct":"إصلاح العلاقة بعد خلاف","w1":"المشاركة في رحلة","w2":"شراء كتاب","w3":"الاستعداد لمباراة","practice":"اكتب قصة من خمس جمل تذكر فيها رغبة الشخصية وقرارها ونتيجته، ثم راجع الروابط."},{"n":10,"skill":"تحرير القصة وتنقيح التكرار","passage":"نص أولي: «دخل خالد الفصل. دخل خالد الفصل مسرعًا. كان الفصل كبيرًا جدًا جدًا». تحريره: «دخل خالد الفصل مسرعًا، فرأى مقاعده المرتبة». التنقيح يزيل التكرار ويربط الوصف بالحركة دون حذف الحدث المهم.","prompt":"أي تعديل حسّن الفقرة؟","correct":"حذف التكرار مع الحفاظ على الحدث","w1":"تكرار الجملة الثالثة","w2":"حذف الشخصية كلها","w3":"إضافة وصف بعيد عن الحدث","practice":"حرر فقرة قصصية من تأليفك، واحذف تكرارين وأضف رابطًا بين جملتين مع شرح سبب كل تعديل."},{"n":18,"skill":"وصف مكان مغلق بحواس دقيقة","passage":"نص إثرائي: «دخلت هدى غرفة الأرشيف؛ مصابيح صغيرة فوق الرفوف، ورائحة الورق القديم تملأ المكان، وخطواتها مسموعة في الهدوء». يعتمد وصف المكان المغلق على الضوء والصوت والرائحة وترتيب الأشياء.","prompt":"ما التفصيل الذي ينتمي لحاسة الشم؟","correct":"رائحة الورق القديم","w1":"المصابيح الصغيرة","w2":"ترتيب الرفوف","w3":"صوت الخطوات","practice":"اكتب وصفًا لغرفة مهمة في قصتك مستخدمًا ثلاث حواس، ثم بيّن كيف يؤثر المكان في الشخصية."},{"n":19,"skill":"ربط المكان المغلق بحركة الحدث","passage":"في نموذج مستقل: «أُغلق باب المختبر بسبب الهواء الشديد، فبحث المتعلمون عن المفتاح في الأدراج، بينما انعكس الضوء على الأجهزة». الوصف ليس زينة منفصلة؛ الباب والأدراج يوجهان الحدث وحركة الشخصيات.","prompt":"أي عنصر مكاني أثر في مسار الحدث؟","correct":"إغلاق باب المختبر","w1":"اسم المدينة","w2":"نوع وجبة الغداء","w3":"موعد رحلة قديمة","practice":"اكتب مشهدًا يبدأ في غرفة مغلقة، واجعل تفصيلًا من المكان سببًا لفعل أو قرار للشخصية."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=9
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='التعبير والكتابة' AND u.semester=1 AND l.sort_order=r.n AND l.status='published'
    FOR UPDATE OF l;
    IF coalesce(trim(target_content),'')='' OR (target_content LIKE 'يتناول هذا الدرس موضوع%' AND char_length(target_content)<350) THEN
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
        jsonb_build_object('origin','DADYOOM_BH_G9_T1_WRITING_10_20261008','notOfficialBook',true,'ocrReview','pending','options',jsonb_build_array(r.correct,r.w1,r.w2,r.w3)),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_G9_T1_WRITING_10_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_G9_T1_WRITING_10_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_G9_T1_WRITING_10_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;