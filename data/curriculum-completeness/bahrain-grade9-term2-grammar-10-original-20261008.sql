-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only genuinely empty published lessons; add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"skill":"مراجعة القواعد عبر أمثلة دقيقة","passage":"في «كتبَ الطالبُ تقريرًا موجزًا» الفعل «كتب» ماض، و«الطالب» فاعل مرفوع، و«تقريرًا» مفعول به منصوب. نراجع وظيفة الكلمة قبل الحكم بعلامة الإعراب، فلا نخلط المفعول بالحال.","prompt":"ما إعراب «تقريرًا»؟","correct":"مفعول به منصوب","w1":"مبتدأ مرفوع","w2":"خبر كان","w3":"منادى","practice":"اكتب ثلاث جمل، واستخرج من كل جملة فعلًا وفاعلًا ومفعولًا به مع علامات الإعراب."},{"n":2,"skill":"إسناد المثال والأجوف للضمائر","passage":"الفعل المثال «وَعَدَ» يصبح «وَعَدْتُ» عند إسناده إلى تاء المتكلم، والفعل الأجوف «قال» يصبح «قُلْتُ» بحذف حرف العلة وتحريك ما قبله. نتعلم تتبع التغير لا حفظ النتيجة دون سبب.","prompt":"ما صيغة «قال» مع تاء المتكلم؟","correct":"قُلْتُ","w1":"قالتُ","w2":"قَوَلْتُ","w3":"يقولُ","practice":"أسند «وعد» و«قال» إلى ضميرين مختلفين، ثم اشرح موضع حرف العلة في كل تصريف."},{"n":3,"skill":"إسناد الفعل الناقص إلى الضمائر","passage":"الفعل الناقص ما كان آخر أصوله حرف علة، مثل «دعا» و«رمى». عند إسناده إلى تاء المتكلم نقول «دعوتُ» و«رميتُ»، وتظهر صورة حرف العلة المناسبة للتصريف. نتحقق من الضمير قبل كتابته.","prompt":"ما الصيغة الصحيحة لـ«رمى» مع تاء المتكلم؟","correct":"رميتُ","w1":"رمياتُ","w2":"رموتُ","w3":"يرميُ","practice":"صرّف «دعا» و«رمى» مع تاء المتكلم وواو الجماعة مستعينًا بجدول، ثم راجع علامات الإملاء."},{"n":4,"skill":"مصدر الفعل المجرد الثلاثي والرباعي","passage":"المصدر اسم يدل على الحدث مجردًا من الزمن؛ مصدر «كتب» هو «كتابة»، ومصدر الرباعي «دحرج» هو «دحرجة». تُراجع مصادر الثلاثي في المعجم لأنها تتنوع، ويأتي مصدر فعللة الرباعي غالبًا على وزن فعللة.","prompt":"ما مصدر الفعل «دحرج»؟","correct":"دحرجة","w1":"تدحرج","w2":"مُدحرِج","w3":"مدحرَج","practice":"استخرج مصادر ثلاثة أفعال ثلاثية من معجم موثوق واكتب مصدر «دحرج» في جملة مفيدة."},{"n":5,"skill":"تمييز المصدر من الفعل والاسم المشتق","passage":"«جلس» فعل ماض يدل على الزمن، و«جلوس» مصدر يدل على الحدث دون زمن، و«جالس» اسم فاعل يدل على من قام بالفعل. وفي «زلزل» الرباعي المصدر «زلزلة». تفيد المقارنة في تجنب الخلط بين الأوزان.","prompt":"أي كلمة مصدر للفعل «جلس»؟","correct":"جلوس","w1":"جلس","w2":"جالس","w3":"مجلس","practice":"كوّن جدولًا بثلاثة أفعال، ومصدر كل فعل، واسم الفاعل منه، وتحقق من الصيغ."},{"n":6,"skill":"مصادر الأفعال الثلاثية المزيدة","passage":"الفعل «أكرم» مزيد بحرف على وزن أفعل، ومصدره «إكرام». والفعل «تعلّم» على وزن تفعّل، ومصدره «تعلُّم». يحدد الطالب حروف الزيادة والوزن قبل اختيار المصدر.","prompt":"ما مصدر الفعل «أكرم»؟","correct":"إكرام","w1":"كرم","w2":"مُكرَم","w3":"كريم","practice":"اختر ثلاثة أفعال ثلاثية مزيدة مختلفة، واذكر صيغة مصدرها ووزن الفعل بعد التحقق."},{"n":7,"skill":"اسم الفاعل وصيغة المبالغة","passage":"«كاتب» اسم فاعل من «كتب» يدل على من يقوم بالكتابة، و«غفّار» صيغة مبالغة من «غفر» تفيد كثرة وقوع الفعل في الاستعمال المناسب. نختبر صيغة الكلمة وسياقها قبل تفسير الدلالة.","prompt":"ما اسم الفاعل من «كتب»؟","correct":"كاتب","w1":"مكتوب","w2":"كتابة","w3":"مكتب","practice":"اكتب ثلاث جمل تميز فيها اسم الفاعل من صيغة المبالغة، وحدد الوزن والمعنى."},{"n":8,"skill":"اشتقاق اسم المفعول ودلالته","passage":"اسم المفعول يدل على من وقع عليه الفعل؛ «مكتوب» من «كتب» و«مسموع» من «سمع» على وزن مفعول للفعل الثلاثي. في «الخطاب مكتوب» يقع أثر الكتابة على الخطاب.","prompt":"أي كلمة اسم مفعول من «سمع»؟","correct":"مسموع","w1":"سامع","w2":"سماع","w3":"سمع","practice":"اشتق أسماء المفعول من ثلاثة أفعال، ثم ضعها في جمل توضح ما وقع عليه الفعل."},{"n":9,"skill":"اسما المكان والزمان بالسياق","passage":"«مجلس» يمكن أن يدل على مكان الجلوس، و«موعد» قد يدل على زمان أو مكان اللقاء حسب السياق. في «موعد الاجتماع صباحًا» المقصود الزمن؛ وفي «المجلس واسع» المقصود المكان.","prompt":"ما مدلول «مجلس» في «المجلس واسع»؟","correct":"مكان الجلوس","w1":"زمن الجلوس","w2":"صوت الحديث","w3":"اسم فاعل","practice":"اكتب مثالين لاسم مكان واسم زمان، وفسر دور السياق في تحديد المعنى."},{"n":10,"skill":"اسم الآلة ووظيفته","passage":"اسم الآلة يدل على الأداة التي يقع بها الفعل؛ «مفتاح» للفتح و«منشار» للنشر. نميز الآلة عن اسم الفاعل: «ناشر» من يؤدي النشر أو ينشر شيئًا، و«منشار» أداة للنشر.","prompt":"ما اسم الآلة المستعملة في النشر؟","correct":"منشار","w1":"ناشر","w2":"منشور","w3":"نشر","practice":"استخرج أربعة أسماء آلة من محيطك، واكتب الفعل الذي ترتبط به ووظيفة الأداة."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=9
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='الجزء الثاني — القواعد والتراكيب' AND u.semester=2 AND l.sort_order=r.n AND l.status='published'
    FOR UPDATE OF l;
    IF char_length(coalesce(target_content,''))<350 THEN
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
        jsonb_build_object('origin','DADYOOM_BH_G9_T2_GRAMMAR_10_20261008','notOfficialBook',true,'ocrReview','pending','options',jsonb_build_array(r.correct,r.w1,r.w2,r.w3)),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_G9_T2_GRAMMAR_10_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_G9_T2_GRAMMAR_10_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_G9_T2_GRAMMAR_10_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;