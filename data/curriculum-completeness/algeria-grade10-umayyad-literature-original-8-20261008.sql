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
    WHERE l.unit_id='99e3f727-5e85-4c7f-af90-ff64813a1c94'::uuid
    AND l.status='published';
  IF existing_count<>8 THEN
    RAISE EXCEPTION 'DADYOOM_DZ_G10_UMAYYAD_LIT_EXPECTED_10_FOUND_%',existing_count;
  END IF;
  SELECT count(*) INTO used_count
  FROM public.student_lesson_progress sp JOIN public.lessons l ON l.id=sp.lesson_id
  WHERE l.unit_id='99e3f727-5e85-4c7f-af90-ff64813a1c94'::uuid;
  IF used_count<>0 THEN RAISE EXCEPTION 'DADYOOM_DZ_G10_UMAYYAD_LIT_HAS_LEARNER_PROGRESS'; END IF;
  SELECT count(*) INTO used_count
  FROM public.lesson_activity_attempts att
  JOIN public.lesson_activities a ON a.id=att.activity_id
  JOIN public.lessons l ON l.id=a.lesson_id
  WHERE l.unit_id='99e3f727-5e85-4c7f-af90-ff64813a1c94'::uuid;
  IF used_count<>0 THEN RAISE EXCEPTION 'DADYOOM_DZ_G10_UMAYYAD_LIT_HAS_ACTIVITY_ATTEMPTS'; END IF;

  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"title":"الخلافة الإسلامية والمؤثرات الحزبية في الشعر","skill":"تمييز الصوت الشعري من الوقائع السياسية","passage":"تحتاج دراسة أثر الاختلافات السياسية في الشعر الأموي إلى سياق تاريخي صحيح وديوان موثق؛ فالرأي الذي يعبر عنه متكلم شعري لا يمثل بالضرورة جميع سكان العصر. نموذج مستقل عن مجلس طلابي اختلف أعضاؤه في قرار عام ثم كتب بعضهم آراءً معللة، يساعد على تحديد المخاطب والحجة ولا يمثل أحداثًا أموية.","question":"ما الذي يضبط تحليل موقف شاعر سياسي؟","correct":"توثيق الأبيات وسياق المتكلم","wrong":["التخمين من القافية","إلغاء الرأي المخالف","اعتبار كل شاعر ممثلًا للجميع"],"writing":"حلل بيتًا موثقًا يتضمن موقفًا عامًا، وميز اللغة الإقناعية من الحدث التاريخي."},{"n":2,"title":"الأحزاب السياسية في عهد بني أمية","skill":"قراءة التعدد التاريخي دون تعميم","passage":"شهد العصر الأموي مواقف واتجاهات سياسية مختلفة، ولا تُفهم من اسم الحزب وحده آراء الأفراد أو تفاصيل الوقائع. يجب التمييز بين مصادر الأخبار التاريخية والدواوين الشعرية وبين ما يذكره شاعر في سياق مدح أو جدال. مثال من ضاديوم: مجموعتان تناقشان سياسة لمكتبة المدرسة وتقدمان حججًا، وليس قصة تاريخية.","question":"ما الشرط السابق إلى نسبة موقف تاريخي لجماعة؟","correct":"الرجوع إلى مصدر موثق والسياق","wrong":["الاستناد إلى اسم الجماعة فقط","اختراع قول قائد","التعميم على كل الأفراد"],"writing":"أعد خريطة مفاهيم لاتجاهين تاريخيين موثقين وشاهد أدبي صحيح لكل منهما."},{"n":3,"title":"المواقف الوجدانية","skill":"قراءة العاطفة من شواهد لغوية","passage":"الموقف الوجداني هو علاقة المتكلم بتجربة تحرك شعوره، وتدل عليه الصور والألفاظ والإيقاع، لا مجرد عنوان «الحب» أو «الحزن». في وصف مستقل «أعاد المتعلم فتح رسالة صديق قديم، فتوقف طويلًا عند كلمة الوداع»؛ يستدل القارئ على الحنين من التوقف والتذكر. المثال من تأليف ضاديوم وليس بيتًا أمويًا.","question":"ما الدليل على الحنين في المثال؟","correct":"إعادة قراءة رسالة الصديق والتوقف عند الوداع","wrong":["وجود ورق","عدد الأسطر","اسم العصر"],"writing":"اختر مقطعًا وجدانيًا من شعر موثق واستخرج شاهدين يوضحان العاطفة."},{"n":4,"title":"التعبير الوجداني في شعر الغزل في العهد الأموي","skill":"بنية خطاب الغزل ونبرته","passage":"تختلف أصوات الغزل الأموي في المخاطب والتجربة والصور بين شعراء متعددين، ولا يجوز نسبة أبيات غزل مختلقة لأي منهم. مثال نثري مستقل: «منذ رحيل صديقتي أصبحت الأمكنة تذكرني بحوارنا»؛ يصور أثر الفقد والذاكرة لكنه ليس شعرًا تاريخيًا. يحلل المتعلم الضمائر والصور وحركة العاطفة داخل النص الصحيح.","question":"ما الذي يحدد المخاطب في شعر الغزل؟","correct":"الضمائر والنداء والسياق النصي","wrong":["اسم البحر وحده","سنة تأليف مجهولة","عدد الأبيات فقط"],"writing":"استخرج من قصيدة أموية موثقة وسيلتين في التعبير الوجداني مع بيان أثرهما."},{"n":5,"title":"التقليد والتجديد","skill":"فصل التغير الفني عن مجرد الحداثة الزمنية","passage":"قد يواصل شاعر بنية قصيدة مألوفة لكنه يجدد في الصورة أو الموضوع أو مخاطبة الجمهور، وقد يستعمل موضوعًا جديدًا في تركيب قديم. لذلك لا يعني كل نص متأخر أنه مجدد. في مثال من ضاديوم يعيد كاتب سرد موقف قديم بصوت شخصية ثانوية فتتغير زاوية النظر، وهو تدريب على المقارنة لا وصف حركة تاريخية.","question":"ما الدليل على التجديد في مثال إعادة السرد؟","correct":"تغيير زاوية النظر إلى الشخصية","wrong":["تكرار النص حرفيًا","عدم وجود مخاطب","نقل العنوان فقط"],"writing":"قارن نصين من مصدر موثق وحدد جانبًا مستمرًا وجانبًا متغيرًا مع دليل لغوي."},{"n":6,"title":"مظاهر التقليد والتجديد في الشعر الأموي","skill":"مقارنة الأغراض والبناء الشعري","passage":"يُدرس الشعر الأموي بملاحظة ما استمر من تقاليد الوزن والمطلع والبناء وما استجد في موضوعات أو أساليب ضمن سياقات محددة. لا تكفي المقارنة بين أسماء الشعراء؛ يلزم بيتان موثقان وتحليل الصورة والبناء والمقام. مثال جديد: يفتتح شاعر متخيل قصيدته بوصف الطبيعة بدل ذكر موقفه مباشرة، لتوضيح أثر ترتيب المطلع دون نسبته للتاريخ.","question":"أي دليل أدبي يثبت تغير البناء الشعري؟","correct":"مقارنة مطلعين موثقين وطريقة الانتقال بينهما","wrong":["تخمين من اسم الشاعر","نسخ عنوان عصر","ذكر القافية وحدها"],"writing":"حلل شواهد أصيلة لسمتي التقليد والتجديد في نصين من الشعر الأموي."},{"n":7,"title":"نهضة الفنون النثرية","skill":"وظيفة الخطبة والرسالة في التواصل","passage":"تأثرت أشكال النثر ببيئات الإدارة والمجالس والخطابة، لكن نسب الرسائل إلى كاتب أو حاكم تحتاج وثيقة أدبية أو تاريخية معتبرة. في نموذج مستقل يكتب مسؤول رسالة تنظم موعد اجتماع وحجج القرار، بينما يلقي زميله خطابًا مباشرًا للجمهور؛ الفرق في البنية والمخاطب لا في طول النص فقط.","question":"ما الفارق الأساسي بين الرسالة والخطبة في المثال؟","correct":"طريقة مخاطبة المتلقي وبناء الطلب","wrong":["وجود كلمات عربية","التزام الوزن الشعري","تساوي كل المخاطبين"],"writing":"قارن نموذجين من نثر الفترة بنصوص محققة محددًا الغرض والوسائل الإقناعية."},{"n":8,"title":"وضع النثر في العصر الأموي","skill":"تحليل النثر في بيئته التاريخية","passage":"تتطلب دراسة النثر الأموي قراءة نماذج من الرسائل والخطب والنصوص الإدارية التي ثبتت نسبتها، مع الحذر من اختلاف الروايات. يستخدم الناقد معيار وضوح الحجة وتنظيم الأفكار والتناسب مع الجمهور. مشهد مستقل يعرض متحدثًا يقنع زملاءه بتوثيق المصروفات بلغة موجزة، ولا يمثل خطابًا من العصر الأموي.","question":"ما أداة التقويم الأنسب لنص نثري حجاجي؟","correct":"تماسك الحجة وملاءمة الأسلوب للمخاطب","wrong":["عدد الأسطر وحده","وزن البحر","اسم الحاكم دون مصدر"],"writing":"اختر مقطعًا أمويًا موثقًا ثم حلل مقدمته وحجته وخاتمته مقارنة بنص وظيفي معاصر."}]'::jsonb) AS x(
    n integer,title text,skill text,passage text,question text,
    correct text,wrong text[],writing text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_lesson_id,previous_content
    FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=10
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.id='66b6722e-6ca0-4bd0-8c4e-5ce525c37123'::uuid
    JOIN public.countries co ON co.id=cu.country_id AND co.code='DZ'
    WHERE l.unit_id='99e3f727-5e85-4c7f-af90-ff64813a1c94'::uuid
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
      RAISE EXCEPTION 'DADYOOM_DZ_G10_UMAYYAD_LI_EXPECTED_3_ORIGINAL_PLACEHOLDERS_FOR_%_FOUND_%',r.n,existing_count;
    END IF;

    UPDATE public.lesson_activities SET
      prompt='اقرأ الشرح الأصلي ثم حدد الدليل اللغوي في المثال، ولا تنسبه إلى الكتاب المدرسي.',
      content=content || jsonb_build_object(
         'origin','DADYOOM_DZ_G10_UMAYYAD_LITERATURE_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
         'text',r.passage,'notOfficialBook',true,
         'teacherReviewRequired',true,'sourceVerification','pending'
      )
    WHERE lesson_id=target_lesson_id AND activity_type='reading'
      AND content->>'origin'='DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL'
      AND answer='{}'::jsonb;

    UPDATE public.lesson_activities SET
      prompt=r.question,
      content=content || jsonb_build_object(
        'origin','DADYOOM_DZ_G10_UMAYYAD_LITERATURE_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
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
        'origin','DADYOOM_DZ_G10_UMAYYAD_LITERATURE_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
        'text',r.writing,'notOfficialBook',true,'humanReviewRequired',true,
        'sourceVerification','pending'
      )
    WHERE lesson_id=target_lesson_id AND activity_type='writing'
      AND content->>'origin'='DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL'
      AND answer='{}'::jsonb;
    SELECT count(*) INTO existing_count
      FROM public.lesson_activities
      WHERE lesson_id=target_lesson_id AND content->>'origin'='DADYOOM_DZ_G10_UMAYYAD_LITERATURE_V1_20261008';
    IF existing_count<>3 THEN
      RAISE EXCEPTION 'DADYOOM_DZ_G10_UMAYYAD_LI_ACTIVITY_UPDATE_FAILED_%_COUNT_%',r.n,existing_count;
    END IF;
  END LOOP;
END
$dadyoom$;