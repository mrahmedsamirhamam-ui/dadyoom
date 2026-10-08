-- Algeria, 1AS Common Core Letters, literary criticism: independent Dadyoom training.
-- NOT a reproduction of, nor an asserted match to, any official textbook.
-- Updates existing 10 published lesson records and their existing 30 placeholder
-- activities in place. Fails closed if there are learner attempts/progress.
-- Existing IDs, titles, users, grades, security, and payment settings retained.
DO $dadyoom$
DECLARE
  r RECORD;
  lesson_id uuid;
  previous_content text;
  existing_count integer;
  used_count integer;
BEGIN
  SELECT count(*) INTO existing_count FROM public.lessons l
    WHERE l.unit_id='2ce163cc-467c-4220-a298-f776b6d26414'::uuid
    AND l.status='published';
  IF existing_count<>10 THEN
    RAISE EXCEPTION 'DZ_G10_CRITICISM_EXPECTED_10_FOUND_%',existing_count;
  END IF;
  SELECT count(*) INTO used_count
  FROM public.student_lesson_progress sp JOIN public.lessons l ON l.id=sp.lesson_id
  WHERE l.unit_id='2ce163cc-467c-4220-a298-f776b6d26414'::uuid;
  IF used_count<>0 THEN RAISE EXCEPTION 'DZ_G10_CRITICISM_HAS_LEARNER_PROGRESS'; END IF;
  SELECT count(*) INTO used_count
  FROM public.lesson_activity_attempts att
  JOIN public.lesson_activities a ON a.id=att.activity_id
  JOIN public.lessons l ON l.id=a.lesson_id
  WHERE l.unit_id='2ce163cc-467c-4220-a298-f776b6d26414'::uuid;
  IF used_count<>0 THEN RAISE EXCEPTION 'DZ_G10_CRITICISM_HAS_ACTIVITY_ATTEMPTS'; END IF;

  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"title":"تعريف النقد الأدبي","skill":"تعريف النقد الأدبي بوصفه قراءة معللة","passage":"النقد الأدبي نشاط يصف النص ويفهم بنيته ويحلل لغته وصوره ثم يقوّم أثر اختياراته الفنية بحجج وشواهد. لا يساوي النقد البحث عن الأخطاء الإملائية وحدها، ولا إصدار حكم «جميل» أو «رديء» دون دليل. مثال من إنشاء ضاديوم: في عبارة «نامت المدينةُ بعد المطر» يستخدم الكاتب تشخيص المدينة لإبراز السكون؛ والقراءة النقدية تحدد الصورة، وتشرح سبب اختيارها، ثم تناقش مدى خدمتها للجو العام. هذا المثال ليس اقتباسًا من الكتاب الجزائري.","question":"أي وصف أدق لعمل الناقد الأدبي؟","correct":"تحليل لغة النص وبنيته وتقويم أثره بشواهد","wrong":["عد الأخطاء الإملائية فقط","إعلان الإعجاب دون أمثلة","اختزال النص في اسم مؤلفه"],"writing":"حلّل جملتين أدبيتين من إنشائك بذكر الصورة والفكرة والحجة التي تؤيد حكمك النقدي."},{"n":2,"title":"وظيفة النقد الأدبي","skill":"الفهم والتفسير والتقويم والمراجعة","passage":"يساعد النقد القارئ على كشف المعنى وكيفية بنائه، ويعين الكاتب على مراجعة الصياغة، ويفتح حوارًا بين قراءات متعددة بشرط الاستدلال. في نص أصلي تقول الكاتبة: «عادت مريم إلى الحديقة الخاوية، فوجدت المقاعد تحفظ ضحكات الأمس». من وظائف النقد تفسير تشخيص المقاعد وأثره في رسم الحنين، لا الحكم على النص من طول جمله أو شعبيته. يفرق المتعلم بين الوصف الموضوعي للرسم البلاغي وبين رأيه في نجاحه مع التعليل.","question":"أي ممارسة تحقق وظيفة النقد في مثال الحديقة؟","correct":"تفسير الصورة وتقييم أثرها بدليل","wrong":["قياس عدد حروف النص فقط","إصدار حكم بلا قراءة","استبدال النص بملخص مجهول"],"writing":"اقرأ فقرة قصيرة مأذونة الاستخدام وحدد موضع قوة فنية ومجال تحسين، مع شاهد وسبب لكل حكم."},{"n":3,"title":"النقد بين الموضوعية والذاتية","skill":"تمييز الدليل القابل للتحقق عن الذوق الشخصي","passage":"يمتلك الناقد ذوقًا وتجربة يؤثران في التلقي، لكنه مطالب بتقديم حجج يمكن للقارئ مراجعتها. القول «تكررت كلمة الطريق ثلاث مرات» ملاحظة قابلة للتحقق من النص، بينما القول «أشعر أن التكرار ممل» حكم ذاتي يحتاج تفسيرًا. يمكن الجمع بين الاثنين بقول «تكررت الكلمة ثلاث مرات، وقد أبطأ الإيقاع في المقطع لأن الجمل متشابهة البناء». يعترف النقد المنصف بقراءات بديلة ولا يساوي بين جميع الأحكام إذا اختلف مقدار الدليل.","question":"أي عبارة تصف ملاحظة نصية قابلة للتحقق؟","correct":"تكررت كلمة الطريق ثلاث مرات في المقطع","wrong":["النص أجمل نص في العالم","الكاتب عبقري بالضرورة","كل القراء سيملّون"],"writing":"قدم رأيين مختلفين في فقرة من إنشائك، وافصل الأدلة اللغوية عن الاستجابة الشخصية."},{"n":4,"title":"عناصر الأدب","skill":"الفكرة والعاطفة والخيال واللغة والبناء","passage":"يتشكل الأثر الأدبي من تفاعل موضوعه وأفكاره وتجربة المتكلم وعاطفته وصوره ولغته وبنائه الإيقاعي أو السردي. في وصف أصلي: «عاد الفتى إلى البيت الذي غادره صغيرًا؛ كانت رائحة الخبز توقظ ذاكرته». الفكرة هي صلة المكان بالذاكرة، والعاطفة حنين، والتفصيل الحسي رائحة الخبز. يحلل الناقد كيف تخدم هذه العناصر بعضها، ولا يقيّم الصورة مفصولة عن السياق. هذه مادة إثراء من ضاديوم وليست تلخيصًا لنص وزاري.","question":"ما التفصيل الحسي الذي يعبر عن ذاكرة الفتى؟","correct":"رائحة الخبز","wrong":["عدد الشخصيات","اسم المدينة غير المذكور","عنوان الكتاب"],"writing":"اكتب مشهدًا من خمس جمل، ثم حلل الفكرة والعاطفة وصورة حسية وكيف يربط البناء بينها."},{"n":5,"title":"الصورة الأدبية","skill":"فهم التشبيه والاستعارة ووظيفة الصورة","passage":"الصورة الأدبية صياغة تحول المعنى إلى مشهد محسوس أو علاقة تخييلية، وقد تستخدم التشبيه والاستعارة والكناية. في «العزمُ كالجبلِ في الثبات» تشبيه تظهر فيه أداة الكاف ووجه الشبه، وفي «ابتسم الصباح» استعارة مكنية إذ أسند فعل إنساني إلى الصباح في مقام تصويري. لا يكفي تسمية الأسلوب؛ على المتعلم أن يشرح ما أضافه من توضيح أو انفعال، وأن يميز المجاز من الادعاء العلمي الحرفي. الأمثلة جديدة من ضاديوم وليست أبياتًا منسوبة إلى شاعر.","question":"ما أداة التشبيه في «العزم كالجبل»؟","correct":"الكاف","wrong":["العزم","الجبل","الثبات"],"writing":"أنشئ تشبيهًا واستعارة ثم بين معنى كل صورة وسبب ملاءمتها لفكرة فقرتك."},{"n":6,"title":"الشعر وأقسامه","skill":"تمييز البنية والأغراض الشعرية دون أحكام شكلية","passage":"يدرس الشعر من جهة بنائه الإيقاعي وقافيته وصوره ومن جهة أغراضه مثل الوصف والرثاء والمديح والغزل، كما يميز الباحث في الأدب العربي الحديث بين أنماط القصيدة العمودية والتفعيلة وقصيدة النثر في سياقاتها. وجود القافية وحده لا يكفي لإثبات جودة الشعر أو تعيين غرضه، كما لا يستنتج الوزن من اسم الشاعر. التدريب العملي السليم يقوم على بيت أو مقطع موثق وتقطيعه أو تحليل صوره وعاطفته، لا اختلاق شواهد تاريخية.","question":"ما الذي يساعد على تحديد غرض قصيدة بصورة صحيحة؟","correct":"قراءة الأبيات وتحليل المخاطب والعاطفة والشواهد","wrong":["اسم الشاعر وحده","حرف القافية فقط","عدد الكلمات في العنوان"],"writing":"اختر قصيدتين موثقتين مختلفتي الغرض، وحدد البناء والغرض مع شاهد صحيح لكل منهما."},{"n":7,"title":"التذوق الجمالي للنص","skill":"تفسير أثر الاختيار اللغوي في المتلقي","passage":"التذوق الجمالي قراءة منتبهة للصوت والإيقاع والصورة والعلاقة بين التعبير والعاطفة، وليس حفظ أوصاف عامة من قبيل «عبارة جميلة». في مشهد مستقل: «على الرصيف المبلل كان وقع الخطوات بطيئًا، وكأن الطريق ينتظر العائدين». يفيد تكرار اللام والمدود الهادئة والتمهل في الجملة في بناء جو من الترقب، لكن الحكم على أثر الصوت يظل تفسيرًا يحتاج مناقشة. يربط المتعلم بين كلمة أو تركيب بعينه والاستجابة التي أحدثها لديه.","question":"أي دليل لغوي يدعم إحساس الترقب في المشهد؟","correct":"بطء الخطوات وصورة الطريق المنتظر","wrong":["عدد صفحات الرواية","اسم شاعر غير موجود","لون غلاف الكتاب"],"writing":"اكتب فقرة قصيرة ثم عدل لفظتين فيها واشرح كيف تغيّر الإيقاع أو الصورة أو النبرة."},{"n":8,"title":"الوحدة العضوية والوحدة الموضوعية","skill":"مقارنة ترابط الفكرة بترابط البناء والعاطفة","passage":"الوحدة الموضوعية تعني اجتماع النص حول موضوع رئيس، أما الوحدة العضوية فتتعلق بتآزر الأفكار والصور والعاطفة وتسلسل المقاطع بحيث يسهم كل جزء في نمو التجربة. قد تدور قصيدة حول الحنين لكنها تعرض صورًا متناثرة بلا انتقال مقنع، فتتحقق صلة موضوعية أكثر من العضوية. مثال أصلي: يبدأ نص بمشهد وداع، وينتقل إلى ذاكرة المكان، وينتهي بتغير موقف المتكلم؛ يؤدي ترتيب المقاطع وظيفة شعورية. لا تستنتج الوحدة من تكرار عنوان واحد.","question":"ما الذي يميز الوحدة العضوية عن الموضوعية وحدها؟","correct":"ترابط الفكرة والصور والعاطفة وتطور المقاطع","wrong":["تكرار كلمة العنوان فقط","اتفاق حرف الروي دون معنى","عدد الأبيات القليل"],"writing":"صمم مخطط ثلاث فقرات لقصيدة من إنشائك، وبيّن وظيفة كل فقرة في تطور التجربة."},{"n":9,"title":"التجربة الشعرية","skill":"العاطفة الصادقة والصور والبناء الشعري","passage":"التجربة الشعرية تفاعل رؤية الشاعر مع انفعاله وذاكرته وخياله في لغة وإيقاع مترابطين؛ ولا يمكن الجزم بصدق سيرة الكاتب من عاطفة متكلم شعري متخيل. مثال مستقل: «نظر المتكلم إلى مقعد خالٍ بعد رحيل صديق، فاستيقظت ذكريات لقاءاتهما». قد تبنى من الفقد تجربة شعرية تتدرج من الذكرى إلى التساؤل ثم التسليم، ويقاس نجاحها بملاءمة الصور والألفاظ لهذا المسار، لا بشدة الألفاظ وحدها.","question":"ما العنصر الذي يجعل التجربة متماسكة في المثال؟","correct":"تدرج العاطفة وملاءمة الصور لتطورها","wrong":["استخدام صفة حزينة في كل سطر","حذف الصلة بين المقاطع","زيادة القافية دون فهم"],"writing":"اكتب مقطعًا وجدانيًا من إنشائك وحدد مراحل تطور العاطفة والقرائن اللغوية الدالة عليها."},{"n":10,"title":"اللفظ والمعنى","skill":"تحليل التناسب بين اللفظة ومقامها","passage":"لا ينفصل اللفظ عن المعنى في النص الأدبي؛ فقد يغير اختيار «همس» بدل «صرخ» تصور القارئ للمشهد. في «همست الريح قرب النافذة» تتحقق صورة هادئة، أما «عصفت الريح بالنافذة» فتخلق توترًا وحركة. النقد الجيد يشرح الفرق الدلالي والصوتي والسياقي، لا يعد الألفاظ القوية أجمل بالضرورة. يمكن تحسين التعبير بتغيير المفردات أو تركيب الجملة مع المحافظة على المعنى المقصود دون الإخلال بالإيقاع.","question":"ما الأثر الأقرب لاستعمال «همست الريح»؟","correct":"خلق جو هادئ بصياغة تصويرية","wrong":["وصف معركة صاخبة","تحديد تاريخ الحدث","تغيير الفاعل إلى إنسان حقيقة"],"writing":"اكتب ثلاث جمل عن مشهد واحد، وبدل الفعل الرئيس في كل جملة ثم حلل أثر اللفظ في النبرة."}]'::jsonb) AS x(
    n integer,title text,skill text,passage text,question text,
    correct text,wrong text[],writing text
  ) LOOP
    SELECT l.id,l.content INTO STRICT lesson_id,previous_content
    FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=10
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.id='66b6722e-6ca0-4bd0-8c4e-5ce525c37123'::uuid
    JOIN public.countries co ON co.id=cu.country_id AND co.code='DZ'
    WHERE l.unit_id='2ce163cc-467c-4220-a298-f776b6d26414'::uuid
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
      WHERE id=lesson_id;
    END IF;

    SELECT count(*) INTO existing_count FROM public.lesson_activities
      WHERE lesson_id=lesson_id AND content->>'origin'='DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL';
    IF existing_count<>3 THEN
      RAISE EXCEPTION 'DZ_CRITICISM_EXPECTED_3_ORIGINAL_PLACEHOLDERS_FOR_%_FOUND_%',r.n,existing_count;
    END IF;

    UPDATE public.lesson_activities SET
      prompt='اقرأ الشرح الأصلي ثم حدد الدليل اللغوي في المثال، ولا تنسبه إلى الكتاب المدرسي.',
      content=content || jsonb_build_object(
         'origin','DADYOOM_DZ_G10_CRITICISM_ORIGINAL_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
         'text',r.passage,'notOfficialBook',true,
         'teacherReviewRequired',true,'sourceVerification','pending'
      )
    WHERE lesson_id=lesson_id AND activity_type='reading'
      AND content->>'origin'='DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL'
      AND answer='{}'::jsonb;

    UPDATE public.lesson_activities SET
      prompt=r.question,
      content=content || jsonb_build_object(
        'origin','DADYOOM_DZ_G10_CRITICISM_ORIGINAL_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
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
    WHERE lesson_id=lesson_id AND activity_type='multiple_choice'
      AND content->>'origin'='DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL'
      AND answer='{}'::jsonb;

    UPDATE public.lesson_activities SET
      prompt=r.writing,
      content=content || jsonb_build_object(
        'origin','DADYOOM_DZ_G10_CRITICISM_ORIGINAL_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
        'text',r.writing,'notOfficialBook',true,'humanReviewRequired',true,
        'sourceVerification','pending'
      )
    WHERE lesson_id=lesson_id AND activity_type='writing'
      AND content->>'origin'='DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL'
      AND answer='{}'::jsonb;
    SELECT count(*) INTO existing_count
      FROM public.lesson_activities
      WHERE lesson_id=lesson_id AND content->>'origin'='DADYOOM_DZ_G10_CRITICISM_ORIGINAL_V1_20261008';
    IF existing_count<>3 THEN
      RAISE EXCEPTION 'DZ_CRITICISM_ACTIVITY_UPDATE_FAILED_%_COUNT_%',r.n,existing_count;
    END IF;
  END LOOP;
END
$dadyoom$;