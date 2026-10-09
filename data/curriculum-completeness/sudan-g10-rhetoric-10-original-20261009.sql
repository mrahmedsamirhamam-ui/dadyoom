-- Mauritania fourth preparatory year (mapped grade 10): 43 original
-- supplementary exercises across existing official-import title stubs.
-- Independent educational prose; all ministry/source matching is pending.
DO $dadyoom$
DECLARE r RECORD; target_id uuid; prior text; nact integer; hasprogress integer;
BEGIN
 FOR r IN SELECT * FROM jsonb_to_recordset('[{"cid":"49c20b78-6022-419d-bcaa-ffaa31cb886a","unit":"e69a6b54-7351-4fe5-ae00-20215a10162d","n":1,"title":"مقدمة موجزة عن البلاغة","passage":"تدرس البلاغة ملاءمة التعبير للمقام وتأثير اختيار الصياغة في المعنى؛ فالخطاب الذي يشرح خطة مدرسية يحتاج ألفاظًا دقيقة وترتيبًا واضحًا. مثال مستقل يقول متحدث «سنفتح المكتبة صباحًا» خبرًا محددًا، ثم يسأل «هل نستطيع البدء مبكرًا؟» لتغيير غرض المخاطبة.","question":"ما السؤال الذي تدرسه البلاغة عند تحليل خطاب؟","correct":"كيف تخدم الصياغة المقام والمعنى","wrong":["عدد حروف الكلمات وحده","لون الورقة","اسم الناشر فقط"],"practice":"اكتب إعلانًا وخطابًا شفهيًا لحدث واحد، وفسر فرق الصياغة بحسب الجمهور.","old":"DADYOOM_SD_G10_OFFICIAL_2026_V2"},{"cid":"49c20b78-6022-419d-bcaa-ffaa31cb886a","unit":"e69a6b54-7351-4fe5-ae00-20215a10162d","n":2,"title":"الفصاحة والبلاغة","passage":"تتعلق الفصاحة بسلامة اللفظ ووضوح التركيب وخلوه من العيوب المؤثرة، بينما تتصل البلاغة بمطابقة الكلام لمقتضى الحال مع الفصاحة. قد تكون العبارة سليمة نحويًا لكنها أقل مناسبة للمخاطب؛ في مثال مستقل تختلف رسالة رسمية عن حديث ودي.","question":"ما الفرق التعليمي بين الفصاحة والبلاغة؟","correct":"الفصاحة تعنى بسلامة التعبير والبلاغة بملاءمته للمقام","wrong":["هما قياس عدد الكلمات","الفصاحة غرض الشعور وحده","البلاغة تلغي صحة اللغة"],"practice":"أعد كتابة رسالة رسمية بعبارات ودية دون الإخلال بالمعنى، وحلل الفروق.","old":"DADYOOM_SD_G10_OFFICIAL_2026_V2"},{"cid":"49c20b78-6022-419d-bcaa-ffaa31cb886a","unit":"e69a6b54-7351-4fe5-ae00-20215a10162d","n":3,"title":"الحقيقة والمجاز","passage":"تستعمل «أشرقت الشمس» للدلالة الحقيقية على الضوء، ويمكن القول «أشرقت الفكرة في ذهني» مجازًا لفهم مفاجئ. يعتمد تمييز المجاز على علاقة المعنى وقرينته؛ لا يُحكم على العبارة من جمال وقعها فقط.","question":"أي تعبير يمثل استعمالًا مجازيًا للشرق؟","correct":"أشرقت الفكرة في ذهني","wrong":["أشرقت الشمس","سطع نور المصباح","ظهر ضوء الفجر"],"practice":"اكتب مثالين للحقيقة وآخرين للمجاز مع تحديد القرينة المانعة من المعنى الأصلي.","old":"DADYOOM_SD_G10_OFFICIAL_2026_V2"},{"cid":"49c20b78-6022-419d-bcaa-ffaa31cb886a","unit":"e69a6b54-7351-4fe5-ae00-20215a10162d","n":4,"title":"الاستعارة","passage":"تقوم الاستعارة على استعمال لفظ في غير معناه الأصلي لعلاقة المشابهة مع قرينة، مثل «ابتسم الصباح» حيث يصور الصباح في هيئة إنسان. في المثال المُنشأ داخل ضاديوم لا يدّعي الكاتب أن الصباح يبتسم حقيقة؛ يكشف الصورة وأثرها الوجداني.","question":"ما الصورة البيانية في «ابتسم الصباح»؟","correct":"استعارة فيها تشخيص","wrong":["حقيقة حسية","خبر علمي","طباق"],"practice":"أنشئ ثلاث استعارات من بيئتك، وفسر قرينة كل واحدة والمعنى الذي تضيفه.","old":"DADYOOM_SD_G10_OFFICIAL_2026_V2"},{"cid":"49c20b78-6022-419d-bcaa-ffaa31cb886a","unit":"e69a6b54-7351-4fe5-ae00-20215a10162d","n":5,"title":"المجاز المرسل","passage":"يرتبط المجاز المرسل بمعنى غير حقيقي لعلاقة غير المشابهة، مثل استعمال «قرأت لطه حسين» في سياق يقصد قراءة كتاب له إذا كانت القرينة واضحة؛ في هذا المثال علاقته بالمؤلف. لا يساوي المجاز المرسل الاستعارة التي تتأسس على المشابهة.","question":"ما أبرز فرق بين المجاز المرسل والاستعارة؟","correct":"العلاقة في المجاز المرسل غير المشابهة","wrong":["كلاهما وزن صرفي","المجاز المرسل يستلزم قافية","الاستعارة بلا قرينة"],"practice":"حلل مثالين موثقين للمجاز المرسل وحدد العلاقة والقرينة.","old":"DADYOOM_SD_G10_OFFICIAL_2026_V2"},{"cid":"49c20b78-6022-419d-bcaa-ffaa31cb886a","unit":"e69a6b54-7351-4fe5-ae00-20215a10162d","n":6,"title":"الكناية","passage":"الكناية تعبير يقصد به معنى لازم يمكن فهمه من السياق مع إمكان إرادة المعنى الأصلي، مثل التعبير عن الكرم بكثرة إيقاد نار الضيافة في سياق تراثي، مع تجنب الحكم على معنى العبارة خارج بيئتها.","question":"ما الأساس في فهم الكناية؟","correct":"استنباط معنى لازم من التعبير وسياقه","wrong":["عد حروف الكلمة","الوزن العروضي وحده","اعتبار اللفظ مرادفًا دائمًا"],"practice":"كوّن كنايتين واضحتين وبيّن المعنى المكنّى عنه وكيف دل السياق عليه.","old":"DADYOOM_SD_G10_OFFICIAL_2026_V2"},{"cid":"49c20b78-6022-419d-bcaa-ffaa31cb886a","unit":"e69a6b54-7351-4fe5-ae00-20215a10162d","n":7,"title":"المحسنات اللفظية","passage":"تتصل المحسنات اللفظية بعلاقات الأصوات والكلمات مثل الجناس والسجع، ويمكن أن تدعم الإيقاع وتماسك العبارة إذا خدمت المعنى. لا يُحكم على النص بأنه بليغ لمجرد تكرار النهايات؛ فوضوح الفكرة وسلامة التركيب أساسيان.","question":"ما المعيار الأنسب لاستخدام محسن لفظي؟","correct":"أن يخدم المعنى دون تكلف","wrong":["أن يملأ كل جملة","أن يمنع وضوح العبارة","أن يطيل النص دائمًا"],"practice":"اكتب عبارة واضحة ثم جرّب صياغة تستخدم محسّنًا لفظيًا وقارن أثرها.","old":"DADYOOM_SD_G10_OFFICIAL_2026_V2"},{"cid":"49c20b78-6022-419d-bcaa-ffaa31cb886a","unit":"e69a6b54-7351-4fe5-ae00-20215a10162d","n":8,"title":"الجناس","passage":"الجناس تشابه لفظين في صورتهما الصوتية مع اختلاف دلالتهما، وقد يكون تامًا أو ناقصًا وفق درجة التطابق، ويفيد التحليل فهم المعنيين لا التشابه الظاهري وحده. لا نخلط بين الجناس وتكرار لفظ واحد بمعنى واحد.","question":"ما الشرط الأساسي للجناس؟","correct":"تشابه لفظين مع اختلاف المعنى","wrong":["تضاد الكلمتين فقط","تساوي عدد الجمل","وجود مفعول به"],"practice":"اختر مثالًا صحيحًا من مصدر بلاغي موثوق، وحلل اللفظين ونوع الجناس.","old":"DADYOOM_SD_G10_OFFICIAL_2026_V2"},{"cid":"49c20b78-6022-419d-bcaa-ffaa31cb886a","unit":"e69a6b54-7351-4fe5-ae00-20215a10162d","n":9,"title":"السجع","passage":"يظهر السجع في توافق نهايات الفواصل النثرية في الحرف أو الإيقاع، وقد يدعم قابلية الحفظ لكنه لا يستلزم وزن الشعر. في نص تدريبي أصلي «بالصدق نستقيم، وبالعمل نتقدم» لا نقرر سجعه التام دون تحليل نهايات الفواصل وقيمتهما الصوتية.","question":"أين يُدرس السجع أساسًا؟","correct":"في توافق نهايات الفواصل النثرية","wrong":["في تغيير الحركات الإعرابية فقط","في أنواع الفاعل","في تقطيع الوزن وحده"],"practice":"أنشئ سطرين نثريين بسجع غير متكلف، وبيّن نهاية الفاصلتين.","old":"DADYOOM_SD_G10_OFFICIAL_2026_V2"},{"cid":"49c20b78-6022-419d-bcaa-ffaa31cb886a","unit":"e69a6b54-7351-4fe5-ae00-20215a10162d","n":10,"title":"مختارات للاطلاع الذاتي","passage":"تتطلب المطالعة البلاغية الذاتية اختيار نص مأذون صحيح المصدر، ثم تحديد فكرته وجمهوره واستخراج تركيب بلاغي مع تفسير المعنى بدل مجرد تسمية المحسن. يفضّل أن يدوّن الطالب موضع الاقتباس وتاريخ الوصول للمرجع وحدود استنتاجه.","question":"أي خطوة تجعل المطالعة الذاتية نقدية وموثوقة؟","correct":"اختيار نص موثق وتفسير شاهد منه","wrong":["نقل اقتباس مجهول","الاعتماد على العنوان وحده","تسمية المحسن بلا معنى"],"practice":"اقرأ نصًا بلاغيًا مأذونًا، وسجل فكرته وشاهدين وتحليل أثر كل واحد.","old":"DADYOOM_SD_G10_OFFICIAL_2026_V2"}]'::jsonb)
 AS x(cid uuid,unit uuid,n integer,title text,passage text,question text,correct text,wrong text[],practice text,old text)
 LOOP
  SELECT l.id,l.content INTO STRICT target_id,prior
  FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
  JOIN public.grades g ON g.id=u.grade_id
  JOIN public.curricula c ON c.id=g.curriculum_id
  JOIN public.countries co ON co.id=c.country_id
  WHERE co.code='SD' AND c.id=r.cid
    AND g.grade_number=10 AND u.semester IS NULL AND u.id=r.unit
    AND l.sort_order=r.n AND l.title=r.title AND l.status='published'
  FOR UPDATE OF l;

  SELECT count(*) INTO hasprogress FROM public.student_lesson_progress WHERE lesson_id=target_id;
  IF hasprogress<>0 THEN RAISE EXCEPTION 'SD_G10_HAS_PROGRESS_%',r.title; END IF;
  SELECT count(*) INTO hasprogress FROM public.lesson_activity_attempts att
    JOIN public.lesson_activities a ON a.id=att.activity_id WHERE a.lesson_id=target_id;
  IF hasprogress<>0 THEN RAISE EXCEPTION 'SD_G10_HAS_ATTEMPTS_%',r.title; END IF;
  IF char_length(coalesce(prior,''))>=350 THEN RAISE EXCEPTION 'SD_G10_ALREADY_CONTENT_%',r.title; END IF;
  SELECT count(*) INTO nact FROM public.lesson_activities
    WHERE lesson_id=target_id AND content->>'origin'=r.old AND answer='{}'::jsonb;
  IF nact<>3 THEN RAISE EXCEPTION 'SD_G10_EXPECTED_3_PLACEHOLDERS_%',r.title; END IF;

  UPDATE public.lessons SET
    content='ضاديوم — إثراء تعليمي أصلي للسنة الرابعة الإعدادية في موريتانيا. هذا ليس نص الكتاب المعتمد ولا تأكيدًا لمطابقة جميع الفصول؛ الاسم مستورد ويلزم تحقق وزاري.'
    ||E'\n\n'||'عنوان الدرس: '||r.title
    ||E'\n\n'||'هدف التعلم: أن يشرح المتعلم فكرة أو قاعدة من المجال، ويحلل قرينة أو شاهدًا صحيح النسبة، ويكتب استجابة جديدة تستند إلى دليل.'
    ||E'\n\n'||'شرح وتطبيق أصلي: '||r.passage
    ||E'\n\n'||'سؤال فهم: '||r.question
    ||E'\n\n'||'تطبيق كتابي مستقل: '||r.practice
    ||E'\n\n'||'التمايز: دعم بقائمة مفردات وخطوات تحليل أساسية، ومستوى متوسط يبرر الاختيار، ومستوى متقدم يقارن بين تفسيرين أو يختبر دقة المصدر. يتولى المعلم مراجعة مهام الكتابة.'
    ||E'\n\n'||'تحذير المصدر: لا تُنسب أمثلة ضاديوم إلى شاعر أو مؤرخ أو نص ديني؛ راجع المصدر المعتمد أولًا.'
    ||E'\n\n'||'المحتوى السابق المحفوظ: '||coalesce(prior,''),
    updated_at=now() WHERE id=target_id;

  UPDATE public.lesson_activities SET
    prompt='اقرأ النص التدريبي المستقل، واستخرج منه الفكرة أو الشاهد الذي تستند إليه الإجابة.',
    content=content||jsonb_build_object('origin','DADYOOM_SD_G10_BALAGHA_ORIGINAL_10_20261009','previousOrigin',r.old,
      'text',r.passage,'notOfficialBook',true,'sourceVerification','pending')
    WHERE lesson_id=target_id AND activity_type='reading'
      AND content->>'origin'=r.old AND answer='{}'::jsonb;

  UPDATE public.lesson_activities SET prompt=r.question,
    content=content||jsonb_build_object('origin','DADYOOM_SD_G10_BALAGHA_ORIGINAL_10_20261009','previousOrigin',r.old,
       'text',r.question,'notOfficialBook',true,'sourceVerification','pending',
       'options',CASE (r.n%4)
       WHEN 0 THEN jsonb_build_array(r.correct,r.wrong[1],r.wrong[2],r.wrong[3])
       WHEN 1 THEN jsonb_build_array(r.wrong[1],r.correct,r.wrong[2],r.wrong[3])
       WHEN 2 THEN jsonb_build_array(r.wrong[1],r.wrong[2],r.correct,r.wrong[3])
       ELSE jsonb_build_array(r.wrong[1],r.wrong[2],r.wrong[3],r.correct) END),
    answer=jsonb_build_object('correct',r.correct)
    WHERE lesson_id=target_id AND activity_type='multiple_choice'
      AND content->>'origin'=r.old AND answer='{}'::jsonb;

  UPDATE public.lesson_activities SET prompt=r.practice,
    content=content||jsonb_build_object('origin','DADYOOM_SD_G10_BALAGHA_ORIGINAL_10_20261009','previousOrigin',r.old,
     'text',r.practice,'notOfficialBook',true,'sourceVerification','pending',
     'humanReviewRequired',true)
    WHERE lesson_id=target_id AND activity_type='writing'
      AND content->>'origin'=r.old AND answer='{}'::jsonb;

  SELECT count(*) INTO nact FROM public.lesson_activities
   WHERE lesson_id=target_id AND content->>'origin'='DADYOOM_SD_G10_BALAGHA_ORIGINAL_10_20261009';
  IF nact<>3 THEN RAISE EXCEPTION 'SD_G10_ACTIVITY_UPDATE_FAILED_%',r.title; END IF;
 END LOOP;
END $dadyoom$;