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
    WHERE l.unit_id='b49ff6cc-b898-46af-8ba0-b9c4597db368'::uuid
    AND l.status='published';
  IF existing_count<>8 THEN
    RAISE EXCEPTION 'DZ_G10_JAHILI_EXPECTED_10_FOUND_%',existing_count;
  END IF;
  SELECT count(*) INTO used_count
  FROM public.student_lesson_progress sp JOIN public.lessons l ON l.id=sp.lesson_id
  WHERE l.unit_id='b49ff6cc-b898-46af-8ba0-b9c4597db368'::uuid;
  IF used_count<>0 THEN RAISE EXCEPTION 'DZ_G10_JAHILI_HAS_LEARNER_PROGRESS'; END IF;
  SELECT count(*) INTO used_count
  FROM public.lesson_activity_attempts att
  JOIN public.lesson_activities a ON a.id=att.activity_id
  JOIN public.lessons l ON l.id=a.lesson_id
  WHERE l.unit_id='b49ff6cc-b898-46af-8ba0-b9c4597db368'::uuid;
  IF used_count<>0 THEN RAISE EXCEPTION 'DZ_G10_JAHILI_HAS_ACTIVITY_ATTEMPTS'; END IF;

  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"title":"التقاليد والأخلاق والمثل العليا","skill":"قراءة القيم في الشواهد الأدبية","passage":"تختلف التقاليد في الجزيرة العربية قبل الإسلام باختلاف الجماعات والأزمنة؛ ويعرض الأدب أحيانًا مواقف الكرم والنجدة وحفظ العهد، لكن هذه الصور لا تساوي وصف كل أفراد المجتمع بالطريقة نفسها. لقراءة نص تاريخي نحدد القائل والمخاطب والمقام، ثم نستخرج اللفظ الدال على القيمة ونفرق بين المثل المعلن والسلوك الذي تؤكده الأحداث. مثال ضاديوم الأصلي: «حفظ رجل وعدًا قطعه لصديقه رغم تأخر فائدته»؛ يقدم حالة افتراضية لمعنى الوفاء وليس خبرًا عن شخصية جاهلية.","question":"ما المنهج السليم لاستنتاج قيمة أخلاقية من نص جاهلي؟","correct":"تحليل شاهد أصلي موثق وسياقه","wrong":["تعميم صفة على جميع القبائل","نسبة قصة خيالية إلى شاعر","الاكتفاء بعنوان الدرس"],"writing":"اختر نصًا جاهليًا صحيح النسبة، واستخرج قيمة أخلاقية بشاهد وناقش الفرق بين المثال الأدبي والتاريخ الاجتماعي."},{"n":2,"title":"الصلح والسلم بين القبائل في العصر الجاهلي","skill":"تحليل مفردات الإصلاح والحجة","passage":"تظهر في بعض الأخبار والأشعار القديمة صور للوساطة وحفظ العهود وتبعات النزاع، لكن كل واقعة تحتاج توثيقًا تاريخيًا ولا يجوز جمع حوادث مختلفة في قصة واحدة. في مشهد مستقل تخاصمت جماعتان بسبب مورد ماء، فاقترح وسيط قواعد للاستعمال وطلب موافقة الطرفين وتسجيل الالتزامات. يبين النموذج الحجاج بالمصلحة المشتركة وتوقع العواقب، ولا يمثل خبرًا من العصر الجاهلي أو بيتًا لشاعر معين. يقارن الطالب بين الرأي ودليله وبين الوعيد والمصالحة.","question":"ما الذي يجعل اقتراح الوسيط مقبولًا في النموذج؟","correct":"وضع قواعد واضحة يوافق عليها الطرفان","wrong":["إخفاء شروط الاتفاق","رفض استماع أحد الطرفين","اختلاق وعد باسم الغائبين"],"writing":"حلل خبر صلح موثق أو بيتًا من مقرر معتمد، ثم قارن حجته بمقترح وساطة من إنشائك."},{"n":3,"title":"الفروسية","skill":"تفسير الفروسية في إطارها الأدبي","passage":"لا تُختزل صورة الفروسية في ركوب الخيل أو القوة البدنية؛ فقد تظهر في الأدب مقترنة بالشجاعة والانضباط وحماية الضعيف والوفاء. مع ذلك يختلف السياق من قصيدة لأخرى، ولا يثبت عنوان «الفروسية» وحده مضمون كل نص. في وصف مستقل يرفض متسابق استخدام وسيلة غير عادلة رغم إمكان الفوز، فيربط المثال الشجاعة بالنزاهة دون تمثيل بطولة تاريخية. يشرح الناقد كيف تكشف الأفعال والاختيارات قيمة الشخصية بدل الاكتفاء بالصفات.","question":"أي تصرف يبرز الجانب الخلقي للفروسية في المثال؟","correct":"رفض الفوز بوسيلة غير عادلة","wrong":["المبالغة في وصف القوة","تجاهل القواعد","إخفاء سبب الفوز"],"writing":"أنشئ فقرة تصف موقفًا شجاعًا غير عنيف، ثم حلل قيمته وقارنه بصورة فروسية من نص جاهلي موثق."},{"n":4,"title":"آداب الفروسية والبطولة","skill":"التمييز بين القوة والمسؤولية","passage":"تتناول القراءة الأدبية للبطولة دوافع الشخصية وحدود تصرفها وعلاقة القوة بالمسؤولية. يمكن أن يكون الثبات في موقف صعب بطولة أخلاقية حتى دون قتال، كما أن القوة إذا انفصلت عن الإنصاف قد تتحول إلى تعسف. في قصة تدريبية أصلية توقف قائد فريق عن تنفيذ خطة بعدما تنبه إلى أنها تعرض زملاءه للخطر، ثم أعاد توزيع المهمة بأمان. الهدف تحليل القرار وعاقبته وليس نقل خبر تاريخي أو تشجيع استخدام القوة.","question":"ما سبب اعتبار قرار القائد مسؤولًا؟","correct":"قدّم سلامة زملائه وأعاد تقييم الخطة","wrong":["تابع رغم الخطر","أخفى المخاطر","رفض سماع التحذير"],"writing":"ناقش موقفًا بطوليًا موثقًا من نص أدبي بذكر دوافع الشخصية ونتيجة قرارها، ثم اكتب موقفًا مستقلًا."},{"n":5,"title":"وصف الطبيعة","skill":"الصورة الحسية والعلاقة بالمزاج","passage":"يصف الأديب الطبيعة بتحديد المشاهد والأصوات والحركة، وقد يستعين بالتشبيه والاستعارة لتقريب انفعاله. في نص من إنشاء ضاديوم: «امتد الوادي عند الفجر هادئًا، وتحرك ظل الجبل على الحصى كأنه ستار بطيء». يتضمن الوصف علاقة مكانية وحركة وتشبيهًا، لكنه لا يمثل بيتًا جاهليًا. القراءة النقدية تسأل عن مناسبة الصورة للمكان والعاطفة وما إذا كانت التفاصيل تبني مشهدًا متماسكًا بدل تراكم الصفات بلا وظيفة.","question":"ما المشبه به في «ظل الجبل كأنه ستار»؟","correct":"الستار","wrong":["الجبل","الحصى","الوادي"],"writing":"اكتب مشهدًا طبيعيًا بوسيلتين حسيتين وتشبيه، ثم فسر وظيفة الصورة في الجو العام."},{"n":6,"title":"الطبيعة من خلال الشعر الجاهلي","skill":"قراءة البيئة دون اختلاق أبيات","passage":"يمكن دراسة الصحراء والليل والرحلة والظواهر الجوية في قصائد جاهلية صحيحة النسبة، مع التمييز بين الصورة الفنية والوصف الجغرافي الحرفي. لا تكفي الأسماء العامة لتعيين شاعر أو بيت. نموذج مستقل: «لمع البرق فوق التلال، فاستعاد الراكب أمل الوصول قبل المطر». يربط الصورة بالحالة النفسية دون أن يكون بيتًا قديمًا. يعتمد التفسير الأدبي على مفردة حقيقية في النص الموثق والعلاقة بين المشهد والعاطفة وبنية القصيدة.","question":"ما وظيفة البرق في المثال الأصلي؟","correct":"تعزيز إحساس الراكب بالأمل والترقب","wrong":["تحديد اسم الشاعر","إثبات تاريخ رحلة","تعيين بحر القصيدة"],"writing":"استخرج صورة طبيعية من قصيدة جاهلية موثقة واشرح كيف تخدم عاطفة المتكلم مقارنة بصورتك المستقلة."},{"n":7,"title":"الحكم والأمثال","skill":"فهم التكثيف والدلالة في الحكمة والمثل","passage":"تتميز كثير من الأمثال بالإيجاز وقابلية الانتقال بين مواقف متعددة، وقد تعتمد على تشبيه أو مقابلة أو تجربة اجتماعية؛ لكن صحة نسبة مثل إلى عصر معين تحتاج مرجعًا. نموذج أصلي: «من يراجع خطاه يقلّ خطؤه» عبارة تدريبية من ضاديوم لا مثل تاريخي. يمكن تفسيرها بوصفها نصيحة إلى التثبت، ثم اختبار حدودها: فالمراجعة تقلل بعض الأخطاء لكنها لا تضمن انعدامها. النقد الجيد يوازن بين المقصد البلاغي ودقة التعميم.","question":"أي ميزة تجعل المثل قابلًا للتداول غالبًا؟","correct":"إيجاز العبارة واتساع مجال تطبيقها","wrong":["طول الحكاية دائمًا","نسبة مجهولة موثقة تلقائيًا","غياب أي معنى عملي"],"writing":"اختر مثلًا قديمًا موثقًا، وفسر صورته ودلالته ثم ناقش حالة لا ينطبق عليها حرفيًا."},{"n":8,"title":"ترجمة الحكم والأمثال لعقلية الشعوب والأمم","skill":"استنتاج القيم بحذر من النصوص الموروثة","passage":"قد تعكس الحكم والأمثال خبرات جماعات ومواقفها من الكرم والصدق والعمل، لكنها لا تمثل جميع أفراد الأمة ولا تلغي وجود أمثال متعارضة داخل ثقافة واحدة. مثال مستقل: يفضل مثل متخيل التعاون، وآخر يمدح الاستقلال؛ يمكن أن يناسب كل منهما موقفًا مختلفًا، ولا يصح استنتاج صفة ثابتة لكل الناس. عند قراءة الأمثال القديمة نتحقق من النص والمصدر والسياق ثم نفصل الملاحظة الأدبية من الحكم الاجتماعي الواسع. هذا التدريب من ضاديوم وليس نصًا وزاريًا.","question":"لماذا لا يثبت مثل واحد صفة لجميع أفراد الأمة؟","correct":"لأن المثل يعكس موقفًا لا جميع التجارب","wrong":["لأن الأمثال كلها بلا معنى","لأن النصوص لا تحتاج مصدرًا","لأن كل الشعوب متماثلة تمامًا"],"writing":"قارن مثلين موثقين يقدمان قيمتين متباينتين، ثم ناقش ما يمكن وما لا يمكن استنتاجه عن السياق الاجتماعي."}]'::jsonb) AS x(
    n integer,title text,skill text,passage text,question text,
    correct text,wrong text[],writing text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_lesson_id,previous_content
    FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=10
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.id='66b6722e-6ca0-4bd0-8c4e-5ce525c37123'::uuid
    JOIN public.countries co ON co.id=cu.country_id AND co.code='DZ'
    WHERE l.unit_id='b49ff6cc-b898-46af-8ba0-b9c4597db368'::uuid
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
      RAISE EXCEPTION 'DZ_JAHILI_EXPECTED_3_ORIGINAL_PLACEHOLDERS_FOR_%_FOUND_%',r.n,existing_count;
    END IF;

    UPDATE public.lesson_activities SET
      prompt='اقرأ الشرح الأصلي ثم حدد الدليل اللغوي في المثال، ولا تنسبه إلى الكتاب المدرسي.',
      content=content || jsonb_build_object(
         'origin','DADYOOM_DZ_G10_JAHILI_ORIGINAL_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
         'text',r.passage,'notOfficialBook',true,
         'teacherReviewRequired',true,'sourceVerification','pending'
      )
    WHERE lesson_id=target_lesson_id AND activity_type='reading'
      AND content->>'origin'='DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL'
      AND answer='{}'::jsonb;

    UPDATE public.lesson_activities SET
      prompt=r.question,
      content=content || jsonb_build_object(
        'origin','DADYOOM_DZ_G10_JAHILI_ORIGINAL_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
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
        'origin','DADYOOM_DZ_G10_JAHILI_ORIGINAL_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
        'text',r.writing,'notOfficialBook',true,'humanReviewRequired',true,
        'sourceVerification','pending'
      )
    WHERE lesson_id=target_lesson_id AND activity_type='writing'
      AND content->>'origin'='DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL'
      AND answer='{}'::jsonb;
    SELECT count(*) INTO existing_count
      FROM public.lesson_activities
      WHERE lesson_id=target_lesson_id AND content->>'origin'='DADYOOM_DZ_G10_JAHILI_ORIGINAL_V1_20261008';
    IF existing_count<>3 THEN
      RAISE EXCEPTION 'DZ_JAHILI_ACTIVITY_UPDATE_FAILED_%_COUNT_%',r.n,existing_count;
    END IF;
  END LOOP;
END
$dadyoom$;