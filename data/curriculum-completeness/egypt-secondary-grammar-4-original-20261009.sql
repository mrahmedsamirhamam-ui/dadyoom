-- Egyptian G10-G12 broad grammar skill headings: four authored supplements,
-- NOT official unit/textbook matching. Preserve all existing lesson/activity IDs.
DO $dadyoom$
DECLARE r record; target_id uuid; prior text; c_count integer; used_count integer;
BEGIN
 FOR r IN SELECT * FROM jsonb_to_recordset('[{"grade":10,"sem":1,"unit":"d501edf2-d859-427c-a357-c345d13dc8f3","title":"النحو والصرف — الفصل الأول","skill":"الفصل بين البنية الاسمية والفعلية وتحليل الوظائف","passage":"في «المكتبةُ واسعةٌ» تتكون الجملة من مبتدأ وخبر مرفوعين، وفي «قرأ الطالبُ المقالَ» نحدد فعلًا وفاعلًا مرفوعًا ومفعولًا به منصوبًا. لا يُعرب الاسم بحسب ترتيبه في السطر وحده؛ يقرأ الطالب البنية والعامل وعلامة الإعراب. هذه أمثلة ضاديوم أصلية وليست نص صفحات منهج مصر.","q1":"ما إعراب «المكتبةُ» في «المكتبة واسعة»؟","a1":"مبتدأ مرفوع","w1":["مفعول به","اسم مجرور","مفعول مطلق"],"q2":"ما الوظيفة النحوية لـ«المقالَ» في «قرأ الطالب المقال»؟","a2":"مفعول به منصوب","w2":["فاعل مرفوع","خبر كان","منادى"],"task":"اكتب ثلاث جمل اسمية وثلاثًا فعلية، ثم أعرب الركنين الأساسين في كل منها مع التعليل."},{"grade":10,"sem":2,"unit":"32c88f7c-8198-4e5d-8c81-5aadbb4177e0","title":"النحو والصرف — الفصل الثاني","skill":"الفاعل ونائب الفاعل في التحويل من المعلوم إلى المجهول","passage":"في «كتبَ الطالبُ الدرسَ» فاعل الفعل «الطالبُ» والمفعول «الدرسَ»، وعند بناء الفعل للمجهول نقول «كُتبَ الدرسُ»، ويصبح «الدرسُ» نائب فاعل مرفوعًا. تؤثر حركة الفعل وتحول التركيب على الإعراب ويجب المحافظة على معنى الحدث دون إضافة فاعل غير مذكور.","q1":"ما إعراب «الدرسُ» في «كُتب الدرس»؟","a1":"نائب فاعل مرفوع","w1":["مفعول به منصوب","حال","خبر إن"],"q2":"أي جملة مبنية للمعلوم؟","a2":"كتب الطالب الدرس","w2":["كُتب الدرس","فُتح الباب","قُرئ النص"],"task":"حوّل أربعة أفعال متعدية من المعلوم إلى المجهول، ثم اضبط الفعل ونائب الفاعل."},{"grade":11,"sem":1,"unit":"9533cec6-a798-4f8a-9f25-e6bb228890d4","title":"النحو والصرف — الفصل الأول","skill":"تمييز النعت من الحال في الجملة","passage":"في «اشتريتُ كتابًا مفيدًا» «مفيدًا» نعت يتبع منعوته النكرة في الإعراب، أما «عاد الطالبُ مسرورًا» ففيه «مسرورًا» حال منصوبة تبين هيئة الطالب وقت العودة. نلاحظ العلاقة بين الاسم والصفة والتعريف وحالة الفعل قبل تحديد الوظيفة الإعرابية، ولا نُطلق قاعدة شكلية واحدة لكل مثال.","q1":"ما إعراب «مفيدًا» في «اشتريت كتابًا مفيدًا»؟","a1":"نعت منصوب","w1":["حال من الفاعل","فاعل","مبتدأ"],"q2":"ما وظيفة «مسرورًا» في «عاد الطالب مسرورًا»؟","a2":"حال منصوبة","w2":["مضاف إليه","فاعل مرفوع","خبر إن"],"task":"صغ أربعة أمثلة للنعت وأربعة للحال، وبيّن صاحب الحال والمنعوت وعلامات الإعراب."},{"grade":12,"sem":null,"unit":"9f08d1af-8c71-45e3-a5b2-b7ff1bc0a5aa","title":"النحو والصرف","skill":"إعراب النواسخ والاستثناء في تراكيب متقدمة","passage":"تدخل «إنَّ» على الجملة الاسمية فتنصب الاسم وترفع الخبر في «إنَّ الطالبَ مجتهدٌ»، كما يختلف إعراب المستثنى بحسب تمام الأسلوب وإثباته ونفيه؛ ففي «حضرَ الطلابُ إلا طالبًا» يُنصب المستثنى في الاستثناء التام المثبت. يحتاج التحليل إلى فهم وظيفة كل أداة قبل ضبط أواخر الكلمات، وهذه أمثلة مستقلة غير منسوبة للكتاب الوزاري.","q1":"ما إعراب «الطالبَ» في «إن الطالب مجتهد»؟","a1":"اسم إن منصوب","w1":["خبر إن مرفوع","فاعل","مضاف إليه"],"q2":"ما موقع «طالبًا» في «حضر الطلاب إلا طالبًا»؟","a2":"مستثنى منصوب","w2":["فاعل مرفوع","مبتدأ","خبر ليس"],"task":"حلل خمسة تراكيب ناسخة وثلاثة أساليب استثناء متنوعة مع تفسير الفروق في الإعراب."}]'::jsonb)
 AS x(grade integer,sem integer,unit uuid,title text,skill text,passage text,
 q1 text,a1 text,w1 text[],q2 text,a2 text,w2 text[],task text)
 LOOP
 SELECT l.id,l.content INTO STRICT target_id,prior
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id JOIN public.curricula c ON c.id=g.curriculum_id
 JOIN public.countries co ON co.id=c.country_id
 WHERE co.code='EG' AND c.id='c9029de4-3095-47a2-9c9c-97618062f8f9'::uuid
   AND g.grade_number=r.grade AND u.id=r.unit
   AND u.semester IS NOT DISTINCT FROM r.sem
   AND l.sort_order=5 AND l.title=r.title AND l.status='published'
 FOR UPDATE OF l;

 SELECT count(*) INTO used_count FROM public.student_lesson_progress WHERE lesson_id=target_id;
 IF used_count<>0 THEN RAISE EXCEPTION 'EG_GRAMMAR_PROGRESS_EXISTS_%',r.title; END IF;
 SELECT count(*) INTO used_count FROM public.lesson_activity_attempts a JOIN public.lesson_activities ac ON ac.id=a.activity_id WHERE ac.lesson_id=target_id;
 IF used_count<>0 THEN RAISE EXCEPTION 'EG_GRAMMAR_ATTEMPT_EXISTS_%',r.title; END IF;
 IF char_length(coalesce(prior,''))>=350 THEN RAISE EXCEPTION 'EG_GRAMMAR_NOT_SHORT_%',r.title; END IF;
 SELECT count(*) INTO c_count FROM public.lesson_activities WHERE lesson_id=target_id AND content->>'origin'='DADYOOM_EG_OFFICIAL_2026_2027_V1';
 IF c_count<>3 THEN RAISE EXCEPTION 'EG_GRAMMAR_PLACEHOLDERS_NOT_THREE_%',r.title; END IF;

 UPDATE public.lessons SET content='ضاديوم — تدريب أصلي في النحو والصرف، الصف '||r.grade::text
    ||'، ليس فهرسًا وزاريًا ولا النص الرسمي. تعتمد مطابقة الوحدة والفصل على مراجعة الكتاب المعتمد.'
    ||E'\n\n'||'المهارة: '||r.skill
    ||E'\n\n'||'شرح تطبيقي مستقل: '||r.passage
    ||E'\n\n'||'سؤال أول: '||r.q1
    ||E'\n\n'||'سؤال ثانٍ: '||r.q2
    ||E'\n\n'||'مهمة كتابة ومراجعة: '||r.task
    ||E'\n\n'||'التمايز: نموذج مبسط للمبتدئ، ومقارنة قواعد للمتوسط، وتفسير البدائل للمتقدم؛ يراجع المعلم إجابات الكتابة. مدخل المحتوى المستورد المحفوظ: '||coalesce(prior,''),
    updated_at=now() WHERE id=target_id;

 UPDATE public.lesson_activities SET prompt=r.q1,
   content=content||jsonb_build_object('origin','DADYOOM_EG_G10_G12_NAHW_ORIGINAL_4_20261009','previousOrigin','DADYOOM_EG_OFFICIAL_2026_2027_V1',
     'notOfficialBook',true,'sourceVerification','pending','text',r.q1,
     'options',jsonb_build_array(r.w1[1],r.a1,r.w1[2],r.w1[3])),
   answer=jsonb_build_object('correct',r.a1)
  WHERE lesson_id=target_id AND activity_order=1 AND activity_type='multiple_choice'
    AND content->>'origin'='DADYOOM_EG_OFFICIAL_2026_2027_V1';
 UPDATE public.lesson_activities SET prompt=r.q2,
   content=content||jsonb_build_object('origin','DADYOOM_EG_G10_G12_NAHW_ORIGINAL_4_20261009','previousOrigin','DADYOOM_EG_OFFICIAL_2026_2027_V1',
     'notOfficialBook',true,'sourceVerification','pending','text',r.q2,
     'options',jsonb_build_array(r.w2[1],r.w2[2],r.a2,r.w2[3])),
   answer=jsonb_build_object('correct',r.a2)
  WHERE lesson_id=target_id AND activity_order=2 AND activity_type='multiple_choice'
    AND content->>'origin'='DADYOOM_EG_OFFICIAL_2026_2027_V1';
 UPDATE public.lesson_activities SET prompt=r.task,
   content=content||jsonb_build_object('origin','DADYOOM_EG_G10_G12_NAHW_ORIGINAL_4_20261009','previousOrigin','DADYOOM_EG_OFFICIAL_2026_2027_V1',
     'notOfficialBook',true,'sourceVerification','pending','humanReviewRequired',true,'text',r.task)
  WHERE lesson_id=target_id AND activity_order=3 AND activity_type='writing'
    AND content->>'origin'='DADYOOM_EG_OFFICIAL_2026_2027_V1';
 SELECT count(*) INTO c_count FROM public.lesson_activities WHERE lesson_id=target_id AND content->>'origin'='DADYOOM_EG_G10_G12_NAHW_ORIGINAL_4_20261009';
 IF c_count<>3 THEN RAISE EXCEPTION 'EG_GRAMMAR_UPDATE_INCOMPLETE_%',r.title; END IF;
 END LOOP;
END $dadyoom$;