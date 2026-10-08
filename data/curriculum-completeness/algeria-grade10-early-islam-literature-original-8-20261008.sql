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
    WHERE l.unit_id='37652f2e-93d1-426d-a24b-401ce1c3998b'::uuid
    AND l.status='published';
  IF existing_count<>8 THEN
    RAISE EXCEPTION 'DADYOOM_DZ_G10_EARLY_ISLAM_EXPECTED_10_FOUND_%',existing_count;
  END IF;
  SELECT count(*) INTO used_count
  FROM public.student_lesson_progress sp JOIN public.lessons l ON l.id=sp.lesson_id
  WHERE l.unit_id='37652f2e-93d1-426d-a24b-401ce1c3998b'::uuid;
  IF used_count<>0 THEN RAISE EXCEPTION 'DADYOOM_DZ_G10_EARLY_ISLAM_HAS_LEARNER_PROGRESS'; END IF;
  SELECT count(*) INTO used_count
  FROM public.lesson_activity_attempts att
  JOIN public.lesson_activities a ON a.id=att.activity_id
  JOIN public.lessons l ON l.id=a.lesson_id
  WHERE l.unit_id='37652f2e-93d1-426d-a24b-401ce1c3998b'::uuid;
  IF used_count<>0 THEN RAISE EXCEPTION 'DADYOOM_DZ_G10_EARLY_ISLAM_HAS_ACTIVITY_ATTEMPTS'; END IF;

  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"title":"القيم الروحية والاجتماعية في الإسلام","skill":"التمييز بين القيمة والشاهد التاريخي","passage":"يمكن للنصوص العربية في مرحلة صدر الإسلام أن تناقش الصدق والتكافل والعدل، لكن تحليلها يتطلب مصادر صحيحة ونسبة دقيقة، ولا يكفي ذكر القيمة بوصفها شعارًا. في مثال جديد من ضاديوم أمين مكتبة يعيد كتابًا مستعارًا في موعده ويدعو زملاءه إلى الحفاظ على الممتلكات. يوضح السلوك قيمة الأمانة دون نسبته إلى نص قرآني أو حديث أو حدث تاريخي.","question":"ما السلوك الذي يبرز الأمانة في المثال؟","correct":"إعادة الكتاب في موعده","wrong":["إخفاء الكتاب","تغيير سجل الاستعارة","تجاهل صاحبه"],"writing":"استخرج قيمة من نص أدبي موثق من الفترة، وميزها من موقف أصلي يطبقها في الحياة."},{"n":2,"title":"قيم روحية وقيم اجتماعية واكبت ظهور الإسلام","skill":"قراءة التحولات دون تعميم","passage":"تعددت بيئات الناس وأجناس الخطاب مع ظهور الإسلام، وتحتاج دراسة تغير القيم في الأدب إلى مقارنة نصين مؤرخين والتحقق من مصادرهما. مشهد تدريبي مستقل: بدأ فريق دراسي بمنع مشاركة المصادر، ثم وضع نظامًا لتبادل الكتب وتوثيقها، فتحسن التعاون. يدل على تغير سلوك جماعي، ولا يمثل رواية من عصر صدر الإسلام.","question":"ما العامل الذي ساعد الفريق في المثال؟","correct":"تنظيم تبادل الكتب وتوثيقها","wrong":["إلغاء القواعد","منع التعاون","إخفاء المصادر"],"writing":"قارن قيمتين في نصين موثقين وحدد الشاهد والسياق دون ادعاء تماثل المجتمعات."},{"n":3,"title":"النضال والصراع","skill":"وظيفة الصراع في بنية الخطاب","passage":"قد يرد الصراع في النصوص الأدبية بوصفه خلافًا فكريًا أو توترًا اجتماعيًا أو صراعًا داخليًا بين قيم متعددة. يفيد التحليل في تحديد وجهتي نظر وحجة كل طرف دون ترويج العنف أو اختلاق أخبار تاريخية. في قصة ضاديوم اختلف عضوان حول توزيع العمل؛ عالج المدير الأمر بمعايير معلنة بدل الاتهام.","question":"ما جوهر الصراع في القصة التدريبية؟","correct":"الاختلاف حول توزيع المهام","wrong":["اختلاف لون المكان","غياب الشخصيات","موقع المكتب"],"writing":"اختر مقطعًا أدبيًا موثقًا واستخرج عناصر الصراع ووسائل الإقناع ونتيجته."},{"n":4,"title":"وضع الشعر أثناء الدعوة الإسلامية","skill":"قراءة دور الشعر مع مراعاة المصدر","passage":"تغيرت سياقات التلقي والخطاب في صدر الإسلام، ولا يصح تلخيص مكانة كل الشعراء بحكم واحد أو نسبة قول إلى شاعر دون ديوان محقق. يقارن المتعلم نصين صحيحَي المصدر في موضوعهما وجمهورهما وطريقة بناء الحجة. مثال مستقل يبين كيف يمكن لقصيدة معاصرة أن تدعم التعاون دون أن تمثل نصًا دينيًا.","question":"ما شرط نسبة بيت إلى شاعر من صدر الإسلام؟","correct":"تثبيت البيت من مصدر موثوق","wrong":["تخمين القافية","استخدام عنوان عام","اختراع الشطر المكمل"],"writing":"أنشئ بطاقة مقارنة لشاهدين موثقين من شعر الفترة مع مصدر كل شاهد."},{"n":5,"title":"شعر الفتوحات الإسلامية","skill":"السياق التاريخي وتحليل الصور","passage":"تحتاج دراسة الشعر الذي يرتبط بالفتوحات إلى ضبط سياق الحدث والقصيدة وموقف المتكلم، والتمييز بين السرد التاريخي والصورة الشعرية المتخيلة. لا تُنسب حكايات القتال أو أبيات حماسية غير موثقة إلى شعراء الفترة. في تدريب أصلي يصف راوي مشاعر انتظار قريب مسافر، فيُحلل الإيقاع والعاطفة دون الحديث عن معركة.","question":"ما الذي يفصل الصورة الشعرية عن الواقعة التاريخية؟","correct":"توثيق السياق وتمييز الخيال من الخبر","wrong":["الاعتماد على التشبيه كواقعة","القول إن كل شعر حقيقة حرفية","حذف المصدر"],"writing":"حلل صورة شعرية موثقة من نص مقرر وبيّن ما تثبته لغويًا وما لا تثبته تاريخيًا."},{"n":6,"title":"شعر الفتوح وآثاره النفسية على الفرد والأسرة","skill":"الانتقال من الحدث إلى المشاعر","passage":"يمكن للنص الأدبي تصوير أثر الغياب والانتظار والحنين في الأسرة، لكن تفاصيل المشاعر المنسوبة إلى شخصية تاريخية تحتاج شاهدًا من النص نفسه. في مشهد أصلي تنتظر أسرة رسالة من مسافر، فتتابع تغير الأفعال من القلق إلى الطمأنينة. النص من ضاديوم وليس شعرًا أو رواية من الفتوحات.","question":"ما التغير الشعوري في المشهد المستقل؟","correct":"الانتقال من القلق إلى الطمأنينة","wrong":["تكرار الفخر فقط","غياب الانتظار","عدم وجود شخصيات"],"writing":"اكتب قراءة أدبية لنص تاريخي موثق تحلل أثر الحدث على المتكلم أو أسرته دون اختراع رواية."},{"n":7,"title":"تأثير الإسلام في الشعر والشعراء","skill":"مقارنة الأسلوب والموضوع تاريخيًا","passage":"يتطلب الحديث عن تغير موضوعات الشعراء في صدر الإسلام شواهد من نصوص صحيحة النسبة، مع مراعاة استمرار بعض الأغراض القديمة وتبدل سياقها. تدريب مستقل يقارن رسالة تدعو إلى الوفاء بنص يصف الأنانية؛ والمقصود هو مهارة تحليل التحول في الموقف لا تحديد موقف شاعر تاريخي من دون مصدر.","question":"ما أقوى دليل على تحول موضوع شعري؟","correct":"مقارنة نصين موثقين من حقبتين","wrong":["تكرار لقب الشاعر","ذكر سنة عشوائية","اختلاق مناسبة للقصيدة"],"writing":"حدد موضوعًا تغير في شعر شاعر موثق، مع بيتين صحيحين وسياقهما."},{"n":8,"title":"من آثار الإسلام على الفكر واللغة","skill":"دقة المفهوم وأثر المصطلحات","passage":"تدرس علاقة الفكر باللغة عبر تغير تداول مفردات ومعان في النصوص الموثقة، ولا يصح الادعاء أن كلمة نشأت في حقبة معينة لمجرد كثرتها في مصدر. مثال أصلي: يستعمل كاتب «الأمانة» في سياق عهد شخصي، وآخر في سياق حفظ ملف عام؛ تظهر أهمية السياق في اتساع الدلالة دون أن يكون المثال نصًا دينيًا.","question":"ما الذي يساعد على فهم اختلاف دلالة الكلمة؟","correct":"السياق ومجال الاستعمال","wrong":["عدد حروفها فقط","لون الكتاب","مكان الحفظ"],"writing":"اختر مفردتين من نصوص موثقة واشرح تغير استعمالهما في السياق الأدبي أو الثقافي."}]'::jsonb) AS x(
    n integer,title text,skill text,passage text,question text,
    correct text,wrong text[],writing text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_lesson_id,previous_content
    FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=10
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.id='66b6722e-6ca0-4bd0-8c4e-5ce525c37123'::uuid
    JOIN public.countries co ON co.id=cu.country_id AND co.code='DZ'
    WHERE l.unit_id='37652f2e-93d1-426d-a24b-401ce1c3998b'::uuid
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
      RAISE EXCEPTION 'DADYOOM_DZ_G10_EARLY_ISLA_EXPECTED_3_ORIGINAL_PLACEHOLDERS_FOR_%_FOUND_%',r.n,existing_count;
    END IF;

    UPDATE public.lesson_activities SET
      prompt='اقرأ الشرح الأصلي ثم حدد الدليل اللغوي في المثال، ولا تنسبه إلى الكتاب المدرسي.',
      content=content || jsonb_build_object(
         'origin','DADYOOM_DZ_G10_EARLY_ISLAM_LITERATURE_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
         'text',r.passage,'notOfficialBook',true,
         'teacherReviewRequired',true,'sourceVerification','pending'
      )
    WHERE lesson_id=target_lesson_id AND activity_type='reading'
      AND content->>'origin'='DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL'
      AND answer='{}'::jsonb;

    UPDATE public.lesson_activities SET
      prompt=r.question,
      content=content || jsonb_build_object(
        'origin','DADYOOM_DZ_G10_EARLY_ISLAM_LITERATURE_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
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
        'origin','DADYOOM_DZ_G10_EARLY_ISLAM_LITERATURE_V1_20261008','previousOrigin','DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL',
        'text',r.writing,'notOfficialBook',true,'humanReviewRequired',true,
        'sourceVerification','pending'
      )
    WHERE lesson_id=target_lesson_id AND activity_type='writing'
      AND content->>'origin'='DADYOOM_DZ_SECONDARY_OFFICIAL_DETAIL'
      AND answer='{}'::jsonb;
    SELECT count(*) INTO existing_count
      FROM public.lesson_activities
      WHERE lesson_id=target_lesson_id AND content->>'origin'='DADYOOM_DZ_G10_EARLY_ISLAM_LITERATURE_V1_20261008';
    IF existing_count<>3 THEN
      RAISE EXCEPTION 'DADYOOM_DZ_G10_EARLY_ISLA_ACTIVITY_UPDATE_FAILED_%_COUNT_%',r.n,existing_count;
    END IF;
  END LOOP;
END
$dadyoom$;