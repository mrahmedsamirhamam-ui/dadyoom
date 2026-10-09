-- 22 source-safe Jordan grade 12 supplemental lessons.
-- Two existing MCQs plus a reading / writing activity are preserved in place.
-- The first attempt assumed blank answers; the actual Jordan imports already
-- contain 2 answered MCQs. Never delete them or replace their stable IDs.
DO $dadyoom$
DECLARE r record; target_id uuid; prior text; nact integer; nused integer;
BEGIN
 FOR r IN SELECT * FROM jsonb_to_recordset('[{"cid":"270026e3-1832-49b3-a580-89708396bb6d","unit":"6370c05e-b166-4604-8322-f4a624bcc653","n":1,"title":"محور الاستماع — الفصل الأول","passage":"في تسجيل تعليمي مستقل يروي متحدث خطوات إنشاء ركن قراءة بالمدرسة: اتفق الطلاب أولًا على قائمة كتب مناسبة، ثم رتبوا الرفوف، وبعد أسبوع راجعوا احتياجات القراء. يلتقط المستمع تسلسل الأحداث والفكرة الأساسية، ويميز معلومة مسموعة عن استنتاجه الخاص.","question":"ما الخطوة التي سبقت ترتيب الرفوف في النص؟","correct":"الاتفاق على قائمة كتب مناسبة","wrong":["مراجعة الاحتياجات بعد أسبوع","إلغاء المشروع","نشر نتائج وهمية"],"practice":"اسمع القصة مرة أخرى ثم سجّل ثلاث خطوات بالترتيب وفكرة تستنتجها مع دليل من التسجيل.","old":"DADYOOM_JO_OFFICIAL_2026_2027_V1"},{"cid":"270026e3-1832-49b3-a580-89708396bb6d","unit":"6370c05e-b166-4604-8322-f4a624bcc653","n":2,"title":"محور التحدث — الفصل الأول","passage":"عند عرض موضوع شفهي يحدد المتحدث جمهوره وهدفه، ويقسم مداخلته إلى افتتاح وفكرتين مدعومتين بشواهد وخاتمة موجزة. في تمرين مستقل يقدم طالب اقتراحًا لتنظيم استعارة الكتب، ثم ينصت لسؤال ويجيب دون مقاطعة.","question":"ما الذي يساعد على وضوح العرض الشفهي؟","correct":"تنظيم الفكرة والشاهد والاستجابة لسؤال","wrong":["التحدث بلا هدف","عدم سماع الأسئلة","تكرار العنوان فقط"],"practice":"قدّم عرضًا من دقيقة عن اقتراح مدرسي يضم مقدمة وشاهدًا وخاتمة.","old":"DADYOOM_JO_OFFICIAL_2026_2027_V1"},{"cid":"270026e3-1832-49b3-a580-89708396bb6d","unit":"6370c05e-b166-4604-8322-f4a624bcc653","n":3,"title":"محور القراءة — الفصل الأول","passage":"تساعد القراءة النقدية على فصل فكرة الكاتب عن الشواهد والاستنتاجات التي يضيفها القارئ. في فقرة تدريبية يكتب طالب أن نشاط المكتبة زاد الإقبال وفق سجل أسبوعي، لكنه لا يعمم النتيجة على جميع المدارس لغياب بيانات أخرى.","question":"ما الذي يمنع التعميم عن كل المدارس من المثال؟","correct":"البيانات تخص نشاط مكتبة واحدة وفترة محددة","wrong":["أن كل البيانات متطابقة","أن عدد الصفحات قليل","أن النص مكتوب بالفصحى"],"practice":"حلل فقرة مأذونة بذكر فكرتها وشاهد يدعمها وحدٍّ لما يمكن استنتاجه.","old":"DADYOOM_JO_OFFICIAL_2026_2027_V1"},{"cid":"270026e3-1832-49b3-a580-89708396bb6d","unit":"6370c05e-b166-4604-8322-f4a624bcc653","n":4,"title":"محور الكتابة — الفصل الأول","passage":"تحتاج الكتابة الوظيفية والأدبية إلى تحديد الغرض والقارئ واختيار بنية واضحة وروابط بين الجمل، ثم التحرير والتصحيح. في مثال مستقل تكتب طالبة رسالة طلب نشاط للمكتبة وتحدد السبب والوقت المطلوب قبل مراجعة الأسلوب.","question":"ما المكوّن الأساسي في رسالة طلب منسقة؟","correct":"طلب واضح مع سبب ومعلومات مناسبة","wrong":["عنوان طويل دون مضمون","أرقام مختلقة","جمل بلا روابط"],"practice":"اكتب رسالة رسمية قصيرة إلى إدارة المدرسة تطلب نشاطًا قرائيًا مع الأسباب والتاريخ.","old":"DADYOOM_JO_OFFICIAL_2026_2027_V1"},{"cid":"270026e3-1832-49b3-a580-89708396bb6d","unit":"6370c05e-b166-4604-8322-f4a624bcc653","n":5,"title":"محور البناء اللغوي — الفصل الأول","passage":"يعتمد فهم البنية اللغوية على موقع الكلمات وعواملها؛ في «الطالبُ مجتهدٌ» مبتدأ وخبر مرفوعان، وفي «قرأ الطالبُ كتابًا» «كتابًا» مفعول به منصوب. يصوغ المتعلم أمثلة مستقلة ولا ينقل أسئلة الكتاب الأصلي دون إذن.","question":"ما إعراب «كتابًا» في «قرأ الطالب كتابًا»؟","correct":"مفعول به منصوب","wrong":["فاعل مرفوع","خبر كان","مضاف إليه"],"practice":"أنشئ ثلاث جمل اسمية وثلاث فعلية مع تحديد المبتدأ والخبر أو الفاعل والمفعول.","old":"DADYOOM_JO_OFFICIAL_2026_2027_V1"}]'::jsonb)
 AS x(cid uuid,unit uuid,n integer,title text,passage text,question text,correct text,wrong text[],practice text,old text)
 LOOP
  SELECT l.id,l.content INTO STRICT target_id,prior
  FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
  JOIN public.grades g ON g.id=u.grade_id
  JOIN public.curricula c ON c.id=g.curriculum_id
  JOIN public.countries co ON co.id=c.country_id
  WHERE co.code='JO' AND c.id=r.cid AND g.grade_number=11
    AND u.semester=1 AND u.id=r.unit AND l.sort_order=r.n
    AND l.title=r.title AND l.status='published'
  FOR UPDATE OF l;

  SELECT count(*) INTO nused FROM public.student_lesson_progress WHERE lesson_id=target_id;
  IF nused<>0 THEN RAISE EXCEPTION 'JO_G11_HAS_PROGRESS_%',r.title; END IF;
  SELECT count(*) INTO nused FROM public.lesson_activity_attempts att
    JOIN public.lesson_activities a ON a.id=att.activity_id WHERE a.lesson_id=target_id;
  IF nused<>0 THEN RAISE EXCEPTION 'JO_G11_HAS_ATTEMPTS_%',r.title; END IF;
  IF char_length(coalesce(prior,''))>=350 THEN RAISE EXCEPTION 'JO_G11_ALREADY_ENRICHED_%',r.title; END IF;

  SELECT count(*) INTO nact FROM public.lesson_activities
   WHERE lesson_id=target_id AND content->>'origin'=r.old;
  IF nact<>3 THEN RAISE EXCEPTION 'JO_G11_EXPECTED_THREE_ACTIVITIES_%',r.title; END IF;
  SELECT count(*) INTO nact FROM public.lesson_activities
   WHERE lesson_id=target_id AND content->>'origin'=r.old
     AND ((activity_order IN (1,2) AND activity_type='multiple_choice')
       OR (activity_order=3 AND activity_type IN ('reading','writing','speaking','listening')));
  IF nact<>3 THEN RAISE EXCEPTION 'JO_G11_ACTIVITY_SHAPE_MISMATCH_%',r.title; END IF;

  UPDATE public.lessons SET
   content='ضاديوم — إثراء تعليمي أصلي للصف الثاني عشر بالأردن؛ لا يمثل نص الكتاب المدرسي ولا إثبات مطابقة كل صفحة أو فصل. عناوين الدروس مستوردة وتحتاج تحققًا من الفهرس الرسمي.'
   ||E'\n\n'||'الدرس: '||r.title
   ||E'\n\n'||'هدف: أن يفسر المتعلم فكرة الدرس بدليل أو مثال صحيح، ويطبق مهارة تحليلية مع تعليل إجابة اختيار متعدد.'
   ||E'\n\n'||'شرح أصلي: '||r.passage
   ||E'\n\n'||'سؤال للفهم: '||r.question
   ||E'\n\n'||'تطبيق أصلي: '||r.practice
   ||E'\n\n'||'تدرّج التعلم: يبدأ المتعلم بتحديد المفهوم، ثم يفسر الدليل، ثم يختبر قراءة بديلة أو يستخدم مثالًا من إنشائه. يتولى المعلم مراجعة مهام الكتابة عند وجودها.'
   ||E'\n\n'||'توثيق: تُقرأ النصوص التاريخية والدينية والشعرية من نسخ أصلية موثقة، ولا تُنسب إليها أمثلة ضاديوم المستقلة.'
   ||E'\n\n'||'المحتوى السابق المحفوظ: '||coalesce(prior,''),
   updated_at=now()
   WHERE id=target_id;

  UPDATE public.lesson_activities SET
   prompt=r.question,
   content=content||jsonb_build_object('origin','DADYOOM_JO_G11_SKILLS_ORIGINAL_5_20261009',
     'previousOrigin',r.old,'text',r.question,'sourceVerification','pending',
     'notOfficialBook',true,
     'options',jsonb_build_array(r.wrong[1],r.correct,r.wrong[2],r.wrong[3])),
   answer=jsonb_build_object('correct',r.correct)
   WHERE lesson_id=target_id AND activity_order=1 AND activity_type='multiple_choice'
     AND content->>'origin'=r.old;

  UPDATE public.lesson_activities SET
   prompt='أي نشاط تدريبي يمثل تطبيقًا ملائمًا لدرس «'||r.title||'»؟',
   content=content||jsonb_build_object('origin','DADYOOM_JO_G11_SKILLS_ORIGINAL_5_20261009',
     'previousOrigin',r.old,'sourceVerification','pending','notOfficialBook',true,
     'text','أي نشاط تدريبي يمثل تطبيقًا ملائمًا لدرس «'||r.title||'»؟',
     'options',jsonb_build_array('أنسخ الجواب دون الرجوع إلى القاعدة أو المصدر',
     'أختلق شاهدًا غير موجود ليدعم رأيي',
     r.practice,
     'أقفز إلى النتيجة قبل دراسة النص أو المثال')),
   answer=jsonb_build_object('correct',r.practice)
   WHERE lesson_id=target_id AND activity_order=2 AND activity_type='multiple_choice'
     AND content->>'origin'=r.old;

  UPDATE public.lesson_activities SET
   prompt=r.practice,
   content=content||jsonb_build_object(
      'origin','DADYOOM_JO_G11_SKILLS_ORIGINAL_5_20261009',
      'previousOrigin',r.old,'sourceVerification','pending',
      'notOfficialBook',true,'text',r.passage,
      'practice',r.practice,
      'humanReviewRequired',activity_type='writing')
   WHERE lesson_id=target_id AND activity_order=3
     AND activity_type IN ('listening','speaking','reading','writing')
     AND content->>'origin'=r.old;

  SELECT count(*) INTO nact FROM public.lesson_activities WHERE lesson_id=target_id
    AND content->>'origin'='DADYOOM_JO_G11_SKILLS_ORIGINAL_5_20261009';
  IF nact<>3 THEN RAISE EXCEPTION 'JO_G11_UPDATE_MISSING_ACTIVITY_%',r.title; END IF;
 END LOOP;
END $dadyoom$;