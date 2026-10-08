-- Algeria, 1AS Common Core Letters, literary criticism: independent Dadyoom training.
-- NOT a reproduction of, nor an asserted match to, any official textbook.
-- Updates existing 10 published lesson records and their existing 30 placeholder
-- activities in place. Fails closed if there are learner attempts/progress.
-- Existing IDs, titles, users, grades, security, and payment settings retained.
DO $dadyoom$
DECLARE
  r RECORD;
  target_lesson_id uuid;
  previous_content text;
  existing_count integer;
  used_count integer;
BEGIN
  SELECT count(*) INTO existing_count FROM public.lessons l
    WHERE l.unit_id='498599df-40df-478b-a81e-f1a6602566ce'::uuid
    AND l.status='published';
  IF existing_count<>6 THEN
    RAISE EXCEPTION 'DADYOOM_DZ_G10_EXPOSITORY_W_EXPECTED_10_FOUND_%',existing_count;
  END IF;
  SELECT count(*) INTO used_count
  FROM public.student_lesson_progress sp JOIN public.lessons l ON l.id=sp.lesson_id
  WHERE l.unit_id='498599df-40df-478b-a81e-f1a6602566ce'::uuid;
  IF used_count<>0 THEN RAISE EXCEPTION 'DADYOOM_DZ_G10_EXPOSITORY_W_HAS_LEARNER_PROGRESS'; END IF;
  SELECT count(*) INTO used_count
  FROM public.lesson_activity_attempts att
  JOIN public.lesson_activities a ON a.id=att.activity_id
  JOIN public.lessons l ON l.id=a.lesson_id
  WHERE l.unit_id='498599df-40df-478b-a81e-f1a6602566ce'::uuid;
  IF used_count<>0 THEN RAISE EXCEPTION 'DADYOOM_DZ_G10_EXPOSITORY_W_HAS_ACTIVITY_ATTEMPTS'; END IF;

  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"title":"أثر العمل في حياة الأمة والفرد","skill":"بناء فقرة حجاجية بين الأثر الفردي والاجتماعي","passage":"لا يقتصر أثر العمل على حصول الفرد على مقابل مادي؛ فقد يتيح تنمية المهارة والتعاون وتقديم خدمة يحتاجها المجتمع. لكن لا يجوز الزعم بأن كل عمل متاح يوفر ظروفًا عادلة دون دليل. في مثال مستقل ساعد متدرب في أرشفة كتب مكتبة عامة، فتعلم التنظيم واستفاد الزوار من سرعة العثور على الكتب. يمكن تقسيم المقال إلى دعوى وأثر على الفرد وأثر على الجماعة وتحفظ عملي. هذا نص تدريبي من ضاديوم لا ينقل الكتاب الرسمي.","question":"ما الفائدتان اللتان ظهرتا في موقف المكتبة؟","correct":"اكتساب مهارة وخدمة الزوار","wrong":["إخفاء الكتب وإضاعة الوقت","رفض التعلم والتعاون","زيادة الخطأ عمدًا"],"writing":"اكتب مقالًا من ثلاث فقرات عن قيمة العمل يتضمن أثرًا فرديًا واجتماعيًا ومثالًا وتحفظًا مناسبًا."},{"n":2,"title":"الوقت وأهميته في حياة الفرد والمجتمع","skill":"إدارة الوقت وبيان الأسباب والنتائج","passage":"إدارة الوقت اختيار للأولويات وترك هامش للطوارئ، لا حشو جدول اليوم بأعمال لا تُنجز. في موقف مستقل وزع فريق مدرسي مهامه على أيام الأسبوع، وحدد موعدًا للمراجعة قبل التسليم، فأمكن اكتشاف خطأ مبكرًا. يبين المثال علاقة التخطيط بتقليل التأخير، لكنه لا يثبت نسبة نجاح عامة دون قياس. يستطيع الكاتب دعم الحجة بتفسير أثر التأخير على الفرد وعلى الفريق، ثم اقتراح معيار بسيط لمراجعة الإنجاز.","question":"ما الخطوة التي سمحت باكتشاف الخطأ مبكرًا؟","correct":"تحديد موعد للمراجعة قبل التسليم","wrong":["ترك الجدول بلا مراجعة","إلغاء توزيع المهام","تأجيل التخطيط إلى النهاية"],"writing":"أعد خطة أسبوعية بثلاث أولويات ووقت احتياطي، ثم اكتب فقرة تناقش أثر التخطيط على الجماعة."},{"n":3,"title":"الدقة في المحافظة على المواعيد","skill":"الوفاء بالوعد والموازنة مع الظروف الطارئة","passage":"يُظهر احترام الموعد تقدير وقت الآخرين ويساعد على تنسيق الأعمال، لكن المسؤولية تتضمن أيضًا الإبلاغ المبكر عند حدوث ظرف خارج الإرادة. في مشهد أصلي تأخر متدرب بسبب انقطاع المواصلات، فأخبر الفريق وقدّم موعدًا بديلًا بدل الصمت. ليس الغرض تبرير التأخير الدائم، بل بيان الفرق بين الخطأ المتكرر والتواصل المهني. تقيّم الكتابة هنا بوضوح السبب والإجراء التصحيحي والأثر على الشركاء.","question":"ما السلوك المسؤول عند توقع التأخير؟","correct":"إبلاغ المعنيين مبكرًا واقتراح بديل","wrong":["إخفاء سبب التأخير","انتظار انتهاء الموعد دون تنبيه","تغيير الموعد دون اتفاق"],"writing":"اكتب رسالة اعتذار عملية عن تأخير متخيل تذكر السبب وخطة التعويض وتاريخ الالتزام الجديد."},{"n":4,"title":"رسالة المعلم وأثرها في رقي الأمم وازدهارها","skill":"تعليل أثر التعليم بعلاقة السبب والنتيجة","passage":"تتجاوز رسالة المعلم نقل المعلومات إلى دعم التفكير المستقل وتدريب الطلاب على المراجعة والتعاون واحترام الدليل. في فصل دراسي مستقل لاحظت معلمة أن الطالب يكرر الإجابة دون فهم، فأعطته نشاطًا يقارن حلين وطلبت منه تعليل الاختيار. يُظهر الموقف أثر تغيير طريقة التعليم في بناء القدرة على الحكم، لكنه لا يبرهن وحده على ازدهار مجتمع كامل؛ يتطلب ذلك شواهد أوسع. تُبنى المقالة من أطروحة وموقف تعليمي وأثر قابل للملاحظة.","question":"ما المهارة التي عززها نشاط المعلمة؟","correct":"تعليل الاختيار والتفكير المقارن","wrong":["الحفظ بلا فهم فقط","إلغاء التغذية الراجعة","تجنب السؤال"],"writing":"اكتب فقرة تقدير للمعلم بحجة ومثال صفي محدد، ثم وضح كيف يمكن قياس تحسن التعلم."},{"n":5,"title":"مزايا التسامح في بناء المجتمعات الإنسانية ورقيها","skill":"الحوار واحترام الحقوق دون قبول الضرر","passage":"يمكن أن يساعد التسامح على خفض التوتر وحفظ الروابط، لكنه لا يقتضي التنازل عن الحقوق أو تبرير الأذى. في مشهد مستقل اختلف طالبان حول طريقة تنفيذ مشروع، فشرح كل منهما رأيه واستمع الآخر ثم اتفقا على تجربة معيارين ومراجعة النتائج. يبرز التسامح هنا في احترام المختلف وتحكيم الدليل، لا مجرد قول «لا خلاف». يميز المتعلم بين الدعوى ومثالها والاستثناءات التي تحتاج حماية الحقوق.","question":"ما السلوك الذي عبّر عن التسامح في الموقف؟","correct":"الاستماع وتجربة المعايير المشتركة","wrong":["إسكات الطرف الآخر","قبول الأذى بلا حدود","رفض التحقق من النتائج"],"writing":"صغ نصًا إقناعيًا يشرح التسامح بمثال وحجة وتحفظ يحمي الحقوق الأساسية."},{"n":6,"title":"أساليب استثمار وسائل الاتصال والإعلام في الحصول على العلم والمعرفة","skill":"تقييم المصدر والتحقق من الإعلام الرقمي","passage":"يساعد الإعلام الرقمي على الوصول السريع للمعلومات، لكنه يحمل أحيانًا أخطاءً وإعلانات وموادًا بلا مصدر. في تدريب مستقل وجد طالب خبرًا عن اكتشاف علمي، فراجع الجهة الناشرة وتاريخ النشر ورابط الدراسة قبل مشاركته. يوضح المثال أهمية مقارنة المصادر وعدم اعتبار كثرة المشاركات معيارًا لصحة الخبر. يمكن بناء خطة تحقق من ثلاث خطوات: هوية المصدر، أصل الدليل، وحداثة البيانات وسياقها، مع احترام الخصوصية عند النشر.","question":"ما الخطوة التي سبقت مشاركة الخبر في المثال؟","correct":"التحقق من الجهة والتاريخ والمصدر الأصلي","wrong":["الاكتفاء بعدد المشاركات","إخفاء رابط الدراسة","نقل العنوان فقط"],"writing":"اختر خبرًا تعليميًا عامًا ودوّن ثلاثة أسئلة تحقق ومصدرين مستقلين، ثم اكتب تقييمًا قصيرًا."}]'::jsonb) AS x(
    n integer,title text,skill text,passage text,question text,
    correct text,wrong text[],writing text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_lesson_id,previous_content
    FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=10
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.id='66b6722e-6ca0-4bd0-8c4e-5ce525c37123'::uuid
    JOIN public.countries co ON co.id=cu.country_id AND co.code='DZ'
    WHERE l.unit_id='498599df-40df-478b-a81e-f1a6602566ce'::uuid
      AND l.sort_order=r.n AND l.title=r.title AND l.status='published'
      AND u.semester IS NULL
    FOR UPDATE OF l;

    IF char_length(coalesce(previous_content,'')) < 350 THEN
      UPDATE public.lessons SET
        content='ضاديوم — إثراء نقد أدبي أصلي للسنة الأولى ثانوي، جذع مشترك آداب، الجزائر. هذه أمثلة مستقلة لا تمثل النص الوزاري، والعنوان المستورد يحتاج مطابقة مع الكتاب المعتمد.'
        ||E'\n\n'||'عنوان المهارة: '||r.title
        ||E'\n\n'||'هدف التعلم: أن يحدد الطالب الشاهد ويحلل اختيارًا لغويًا، ويميز رأيًا نقديًا من دليل، ثم يكتب حكمًا معللًا.'
        ||E'\n\n'||'شرح مهاري وتطبيق أصلي: '||r.passage
        ||E'\n\n'||'سؤال فهم: '||r.question
        ||E'\n\n'||'إنتاج مستقل ومراجعة المعلم: '||r.writing
        ||E'\n\n'||'التمايز: دعم بمفردات وتوجيهات للمبتدئ، ومثال مستقل للمتوسط، ومقارنة قراءتين مدعومتين بدليل للمتقدم.'
        ||E'\n\n'||'حالة المصدر: مراجعة مطابقته الكتابية الرسمية معلقة. لا تنسب عبارات التدريب إلى مؤلفي النصوص التاريخية.'
        ||E'\n\n'||'النص السابق المحفوظ: '||coalesce(previous_content,''),
        updated_at=now()
      WHERE id=target_lesson_id;
    END IF;

    SELECT count(*) INTO existing_count FROM public.lesson_activities
      WHERE lesson_id=target_lesson_id AND content->>'origin'='DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL';
    IF existing_count<>3 THEN
      RAISE EXCEPTION 'DADYOOM_DZ_G10_EXPOSITORY__EXPECTED_3_ORIGINAL_PLACEHOLDERS_FOR_%_FOUND_%',r.n,existing_count;
    END IF;

    UPDATE public.lesson_activities SET
      prompt='اقرأ الشرح الأصلي ثم حدد الدليل اللغوي في المثال، ولا تنسبه إلى الكتاب المدرسي.',
      content=content || jsonb_build_object(
         'origin','DADYOOM_DZ_G10_EXPOSITORY_WRITING_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
         'text',r.passage,'notOfficialBook',true,
         'teacherReviewRequired',true,'sourceVerification','pending'
      )
    WHERE lesson_id=target_lesson_id AND activity_type='reading'
      AND content->>'origin'='DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL'
      AND answer='{}'::jsonb;

    UPDATE public.lesson_activities SET
      prompt=r.question,
      content=content || jsonb_build_object(
        'origin','DADYOOM_DZ_G10_EXPOSITORY_WRITING_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
        'text',r.question,'options',
          CASE (r.n%4)
            WHEN 0 THEN jsonb_build_array(r.correct,r.wrong[1],r.wrong[2],r.wrong[3])
            WHEN 1 THEN jsonb_build_array(r.wrong[1],r.correct,r.wrong[2],r.wrong[3])
            WHEN 2 THEN jsonb_build_array(r.wrong[1],r.wrong[2],r.correct,r.wrong[3])
            ELSE jsonb_build_array(r.wrong[1],r.wrong[2],r.wrong[3],r.correct)
          END,
        'notOfficialBook',true,'sourceVerification','pending'
      ),
      answer=jsonb_build_object('correct',r.correct)
    WHERE lesson_id=target_lesson_id AND activity_type='multiple_choice'
      AND content->>'origin'='DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL'
      AND answer='{}'::jsonb;

    UPDATE public.lesson_activities SET
      prompt=r.writing,
      content=content || jsonb_build_object(
        'origin','DADYOOM_DZ_G10_EXPOSITORY_WRITING_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
        'text',r.writing,'notOfficialBook',true,'humanReviewRequired',true,
        'sourceVerification','pending'
      )
    WHERE lesson_id=target_lesson_id AND activity_type='writing'
      AND content->>'origin'='DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL'
      AND answer='{}'::jsonb;
    SELECT count(*) INTO existing_count
      FROM public.lesson_activities
      WHERE lesson_id=target_lesson_id AND content->>'origin'='DADYOOM_DZ_G10_EXPOSITORY_WRITING_V1_20261008';
    IF existing_count<>3 THEN
      RAISE EXCEPTION 'DADYOOM_DZ_G10_EXPOSITORY__ACTIVITY_UPDATE_FAILED_%_COUNT_%',r.n,existing_count;
    END IF;
  END LOOP;
END
$dadyoom$;