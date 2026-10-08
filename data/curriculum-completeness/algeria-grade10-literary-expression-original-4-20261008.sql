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
    WHERE l.unit_id='0e193dcf-2194-4d56-ab29-4fd66b6417c6'::uuid
    AND l.status='published';
  IF existing_count<>4 THEN
    RAISE EXCEPTION 'DADYOOM_DZ_G10_LITERARY_EXP_EXPECTED_10_FOUND_%',existing_count;
  END IF;
  SELECT count(*) INTO used_count
  FROM public.student_lesson_progress sp JOIN public.lessons l ON l.id=sp.lesson_id
  WHERE l.unit_id='0e193dcf-2194-4d56-ab29-4fd66b6417c6'::uuid;
  IF used_count<>0 THEN RAISE EXCEPTION 'DADYOOM_DZ_G10_LITERARY_EXP_HAS_LEARNER_PROGRESS'; END IF;
  SELECT count(*) INTO used_count
  FROM public.lesson_activity_attempts att
  JOIN public.lesson_activities a ON a.id=att.activity_id
  JOIN public.lessons l ON l.id=a.lesson_id
  WHERE l.unit_id='0e193dcf-2194-4d56-ab29-4fd66b6417c6'::uuid;
  IF used_count<>0 THEN RAISE EXCEPTION 'DADYOOM_DZ_G10_LITERARY_EXP_HAS_ACTIVITY_ATTEMPTS'; END IF;

  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"title":"زهير بن أبي سلمى شاعر السلم والسلام","skill":"توثيق الشعر وتحليل حجة السلم","passage":"يشتهر زهير بن أبي سلمى في التراث بالشعر الذي يعالج الصلح وبعض قضايا الحكمة، لكن تحليل «شاعر السلم والسلام» يحتاج أبياتًا صحيحة ومصدرًا محققًا قبل وصف موقفه من واقعة محددة. مثال مستقل من ضاديوم: تفاوض وسيط بين فريقين على تنظيم استخدام ساحة مشتركة، فشرح كلفة النزاع وقدّم حلًا يحفظ حق الطرفين. يُستخدم المثال لتحديد الحجة والنتيجة، وليس بيتًا للشاعر أو رواية تاريخية. النقد المتزن يفرق بين صورة المصلح في النص وما يثبته التاريخ.","question":"ما الدليل اللازم لنسبة دعوة إلى السلام لزهير؟","correct":"شاهد شعري صحيح المصدر والسياق","wrong":["عبارة متخيلة تشبه القافية","خبر مجهول","تشابه اسم القبيلة"],"writing":"استخرج بيتًا موثقًا لزهير يعالج الصلح، ثم قارن حجته بموقف من إنشائك واذكر المصدر."},{"n":2,"title":"الخطابة في عصرها الذهبي: الأسباب والخصائص","skill":"بنية الخطبة بين الجمهور والحجة","passage":"تتحدد قيمة الخطبة من مناسبة اللغة للجمهور وترتيب الفكرة والحجة وإيقاع الجمل، ولا تُثبت عبارة «العصر الذهبي» صحة كل خطاب من حقبة واحدة دون نصوص محققة. في نموذج مستقل يخاطب متحدث زملاءه حول تنظيم مكتبة: يبدأ بالمشكلة ويعرض دليلًا ثم يقترح تقسيم المهام وينهي بدعوة للمتابعة. يمكن للطالب تحليل الافتتاح والانتقالات والخاتمة دون نسبة الخطبة إلى شخصية تاريخية أو نص ديني.","question":"ما الذي يجعل الخطبة مقنعة في نموذج المكتبة؟","correct":"مشكلة محددة وحجة وخطة عمل","wrong":["الإطالة بلا هدف","إلغاء الجمهور","الاعتماد على قافية وحدها"],"writing":"خطط خطبة من دقيقة واحدة للجمهور المدرسي تتضمن افتتاحًا ودليلًا ودعوة عملية، ثم قارنها بخطبة تاريخية موثقة."},{"n":3,"title":"مظاهر التجديد في شعر شعراء المدينة","skill":"قراءة البنية والموضوع قبل حكم التجديد","passage":"قد يتجلى التجديد الشعري في منظور المتكلم أو طريقة الحوار أو بناء الصورة والموضوع، لكن لا يكفي اسم المدينة أو تاريخ الشاعر لإثبات سمة فنية. عند دراسة شعراء المدينة ينبغي اختيار أبيات أصلية صحيحة المصدر وتحديد المخاطب والانتقال بين الصور. مثال مستقل: يبدأ شاعر متخيل قصيدته بسؤال مباشر ثم يحكي موقفًا بدل مقدمة وصفية طويلة؛ يوضح التحول البنائي دون أن يمثل بيتًا قديمًا. القراءة النقدية تفرق بين التقليد والتجديد بشواهد.","question":"ما الدليل الأفضل على تجديد أسلوب شاعر؟","correct":"مقارنة نص موثق بأسلوب سابق وبيان الاختلاف","wrong":["الاعتماد على المدينة وحدها","تأليف أبيات باسمه","القول إن كل جديد أفضل"],"writing":"قارن مطلعين موثقين من الشعر القديم مع بيان تغير زاوية الخطاب أو بنية الصورة."},{"n":4,"title":"خصائص الشعر السياسي في العصر الأموي","skill":"الموقف والحجة والمبالغة في الشعر السياسي","passage":"عند دراسة الشعر السياسي الأموي نتحقق من نسبة الأبيات والسياق والمخاطبين ونوع الحجة، ونتجنب تعميم موقف شاعر على جميع أهل العصر. قد يستخدم النص المدح أو الهجاء أو المفاضلة، وقد تمثل المبالغة جزءًا من الأداء الشعري لا حقيقة تاريخية. في مثال مستقل يكتب طالب خطابًا شعريًا متخيلًا مؤيدًا لخطة مدرسة وآخر يعارضها بأسباب، ويُقرأ المثال كتدريب على تمييز الدعوى من الدليل لا كشعر تاريخي.","question":"ما الذي يمنع التعامل مع المبالغة الشعرية كخبر تاريخي؟","correct":"تحليل السياق والصورة وتوثيق المصدر","wrong":["اسم الشاعر وحده","اتفاق القافية","عدد أبيات القصيدة"],"writing":"اختر بيتين صحيحَي النسبة يعبران عن اتجاهين مختلفين، ثم حلل الحجة والمخاطب والقرائن البلاغية."}]'::jsonb) AS x(
    n integer,title text,skill text,passage text,question text,
    correct text,wrong text[],writing text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_lesson_id,previous_content
    FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=10
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.id='66b6722e-6ca0-4bd0-8c4e-5ce525c37123'::uuid
    JOIN public.countries co ON co.id=cu.country_id AND co.code='DZ'
    WHERE l.unit_id='0e193dcf-2194-4d56-ab29-4fd66b6417c6'::uuid
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
      RAISE EXCEPTION 'DADYOOM_DZ_G10_LITERARY_EX_EXPECTED_3_ORIGINAL_PLACEHOLDERS_FOR_%_FOUND_%',r.n,existing_count;
    END IF;

    UPDATE public.lesson_activities SET
      prompt='اقرأ الشرح الأصلي ثم حدد الدليل اللغوي في المثال، ولا تنسبه إلى الكتاب المدرسي.',
      content=content || jsonb_build_object(
         'origin','DADYOOM_DZ_G10_LITERARY_EXPRESSION_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
         'text',r.passage,'notOfficialBook',true,
         'teacherReviewRequired',true,'sourceVerification','pending'
      )
    WHERE lesson_id=target_lesson_id AND activity_type='reading'
      AND content->>'origin'='DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL'
      AND answer='{}'::jsonb;

    UPDATE public.lesson_activities SET
      prompt=r.question,
      content=content || jsonb_build_object(
        'origin','DADYOOM_DZ_G10_LITERARY_EXPRESSION_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
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
        'origin','DADYOOM_DZ_G10_LITERARY_EXPRESSION_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
        'text',r.writing,'notOfficialBook',true,'humanReviewRequired',true,
        'sourceVerification','pending'
      )
    WHERE lesson_id=target_lesson_id AND activity_type='writing'
      AND content->>'origin'='DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL'
      AND answer='{}'::jsonb;
    SELECT count(*) INTO existing_count
      FROM public.lesson_activities
      WHERE lesson_id=target_lesson_id AND content->>'origin'='DADYOOM_DZ_G10_LITERARY_EXPRESSION_V1_20261008';
    IF existing_count<>3 THEN
      RAISE EXCEPTION 'DADYOOM_DZ_G10_LITERARY_EX_ACTIVITY_UPDATE_FAILED_%_COUNT_%',r.n,existing_count;
    END IF;
  END LOOP;
END
$dadyoom$;