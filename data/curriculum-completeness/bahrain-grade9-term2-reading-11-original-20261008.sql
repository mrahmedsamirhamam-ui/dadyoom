-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only genuinely empty published lessons; add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"skill":"توثيق الحديث قبل شرح معناه","passage":"في «من الهدي النبوي الشريف» لا يصح أن ننسب أي عبارة إلى النبي ﷺ دون النص الصحيح ومصدره. تدريب مستقل: «يحسن المرء معاملة جاره ويساعد من يحتاج». يمكن مناقشة القيمة، لكن العبارة ليست حديثًا نبويًا ولا بديلًا عن نص الكتاب.","prompt":"ما الشرط اللازم لنسبة قول إلى الحديث؟","correct":"التحقق من نص الحديث ومصدره","w1":"الاعتماد على الذاكرة وحدها","w2":"صياغة حديث جديد","w3":"تغيير لفظ الرواية","practice":"بإشراف المعلم حدد الحديث في نسخة معتمدة، واذكر قيمة ودليلًا نصيًا صحيحًا مع المصدر."},{"n":2,"skill":"قراءة السيرة بفصل الرواية الموثقة عن الخيال","passage":"عبد الله بن رواحة من صحابة النبي وشعرائهم؛ تتطلب تفاصيل النص المدرسي قراءة المصدر قبل سرد وقائع بعينها. مثال مستقل: «استعد الشاعر لإلقاء كلمة تذكّر قومه بالوفاء». هذا موقف تخييلي لا ننسبه تاريخيًا إلى الصحابي.","prompt":"ما الذي يجب فعله قبل نسبة حادثة لشخصية تاريخية؟","correct":"الرجوع إلى مصدر موثق","w1":"اعتماد مثال تخييلي حقيقة","w2":"حذف السياق","w3":"تعميم الوقائع","practice":"اقرأ النص المعتمد وحدد واقعتين موثقتين مع مصدرهما، وقارن بين الخبر الصحيح والاستنتاج."},{"n":3,"skill":"معنى الوطن بالأفعال والشواهد","passage":"مقطع مستقل: «كان أهل الحي ينظفون الحديقة العامة ويتعاونون على زراعة شجرة كل شهر؛ شعر الجميع بأن المكان بيتهم المشترك». يظهر الانتماء في سلوك عملي لا في الشعار وحده.","prompt":"ما السلوك الدال على الانتماء في المثال؟","correct":"العناية بالحديقة العامة","w1":"إهمال الممتلكات","w2":"هدر الماء","w3":"ترك النفايات","practice":"اكتب فقرة عن عمل تطوعي ممكن في الحي، وحدد فائدته ووسيلة التحقق من نجاحه."},{"n":4,"skill":"تحديد العاطفة في خطاب الوطن","passage":"نموذج أدبي نثري مستقل: «يا وطني، أعتز بمدارسك وأحافظ على شواطئك وأشارك في خدمتك». ألفاظ الاعتزاز والمحافظة توضح علاقة عاطفة ومسؤولية. لا يُنسب النص إلى قصيدة «أحبك يا وطني».","prompt":"أي فعل يعبر عن المسؤولية تجاه الوطن؟","correct":"أحافظ على شواطئك","w1":"أذكر الاسم فقط","w2":"أغيب عن العمل","w3":"أترك المكان","practice":"بعد قراءة النص الأصلي حدد عاطفته بدليل لفظي موثق، ثم اكتب تعبيرًا نثريًا أصليًا عن الواجب."},{"n":5,"skill":"تحديد دور المؤسسات الثقافية","passage":"مثال مستقل: «زار فريق مكتبة ومتحفًا في البحرين؛ في المكتبة بحث عن مراجع، وفي المتحف شاهد مقتنيات تشرح مراحل من التاريخ». تختلف وظائف المؤسسات مع تكاملها في نشر المعرفة. لا نقدم هذا المشهد نص الكتاب.","prompt":"أين بحث الطلاب عن المراجع في المثال؟","correct":"المكتبة","w1":"الموقف الخارجي","w2":"المقصف","w3":"الملعب","practice":"اكتب فقرة تقارن بين خدمتين ثقافيتين في البحرين مع أمثلة قابلة للتوثيق."},{"n":6,"skill":"الهوية المشتركة والتنوع الخليجي","passage":"مقطع مستقل: «تتبادل مدن الخليج الخبرات في التعليم والتجارة، وتحتفظ كل مدينة بعادات محلية تميزها». نميز أوجه التشابه والتنوع بلا اختزال جميع المجتمعات في صورة واحدة.","prompt":"ما الفكرة الأصح من المثال؟","correct":"تعاون مع تنوع في العادات","w1":"تماثل كل العادات تمامًا","w2":"انعدام التبادل","w3":"غياب الهوية المحلية","practice":"اكتب مقارنة بين تقليدين اجتماعيين تعرفهما، مع احترام الاختلاف وتجنب أحكام التعميم."},{"n":7,"skill":"قراءة جغرافية موثقة للجزر","passage":"لفهم «الجزر العربية في الخليج» يجب استخدام خريطة معتمدة ومعلومات جغرافية حديثة وتجنب أي نسبة غير موثقة للسيادة أو الحدود. نص تدريبي: «تحتاج الجزيرة إلى إدارة موارد المياه والنقل بسبب اتصالها المحدود بالبر».","prompt":"ما التحدي الذي يشير إليه المقطع؟","correct":"إدارة المياه والنقل","w1":"انعدام أي اتصال بالبحر","w2":"وجود طرق برية فقط","w3":"استحالة الإقامة","practice":"اختر جزيرة من خريطة موثوقة، ووصف موقعها ووسيلتي نقل إليها مع ذكر المصدر."},{"n":8,"skill":"تحديد هدف قابل للتنفيذ","passage":"نموذج أصلي: «قررت سلمى تحسين قراءتها في شهر؛ خصصت عشر دقائق يوميًا وسجلت الكلمات الجديدة أسبوعيًا». تحول الرغبة إلى هدف وخطوات ومقياس للتقدم؛ وهو ليس اقتباسًا من نص «اصنع حياتك».","prompt":"ما المقياس المستخدم لمتابعة التقدم؟","correct":"تسجيل الكلمات الجديدة أسبوعيًا","w1":"الاكتفاء بالتمني","w2":"إهمال الوقت","w3":"غياب الخطة","practice":"اكتب هدفًا تعليميًا لشهر وخطوتين قابلتين للتنفيذ ومؤشرًا واحدًا للقياس."},{"n":9,"skill":"الدعوة إلى التعاون بلغة شاملة","passage":"نموذج مستقل: «تعالوا ننظم ركنًا لتبادل القصص في المدرسة؛ يجلب كل مشارك قصة ويتحدث عنها في دقيقتين». الأمر «تعالوا» دعوة جماعية يتبعها عمل محدد، لا نفترض أنها فكرة نص الكتاب.","prompt":"ما العمل المطلوب في الدعوة؟","correct":"تنظيم ركن لتبادل القصص","w1":"إلغاء القراءة","w2":"منع المشاركة","w3":"إخفاء الكتب","practice":"اكتب إعلانًا قصيرًا يدعو إلى نشاط جماعي ويحدد الزمن والأدوار والخطوات دون وعود مبالغ فيها."},{"n":10,"skill":"الإحسان من خلال فعل ونتيجة","passage":"مقطع مستقل: «لاحظت طالبة زميلتها الجديدة جالسة وحدها؛ دعتها إلى المجموعة وشرحت لها نظام المدرسة». تظهر الرحمة في الدعوة والمساعدة، ولا ننسب المثال إلى نص «أحسن إلى الناس».","prompt":"ما الدليل على الإحسان في المثال؟","correct":"دعوة الزميلة الجديدة ومساعدتها","w1":"تجاهلها","w2":"مقاطعة حديثها","w3":"السخرية منها","practice":"اكتب موقفًا يظهر فيه الإحسان دون انتظار مقابل، مع أثره على الطرفين."},{"n":11,"skill":"مراجعة القراءة: دليل وفكرة وقيمة","passage":"نص تدريبي شامل: «نظمت المكتبة يومًا للقراءة، فتطوع الطلاب لترتيب الكتب واستقبال الضيوف». الحدث الرئيس التنظيم، والقيمة التعاون، والدليل ترتيب الكتب واستقبال الضيوف؛ نميز بين هذه العناصر.","prompt":"ما الدليل المباشر على التعاون؟","correct":"ترتيب الكتب واستقبال الضيوف","w1":"عنوان المكتبة","w2":"عدد الحروف","w3":"لون الملصق","practice":"اكتب ملخصًا من ثلاث جمل للنص، ثم حدد قيمة ودليلًا من الأفعال المذكورة."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=9
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='الجزء الثاني — القراءة والنصوص' AND u.semester=2 AND l.sort_order=r.n AND l.status='published'
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
        jsonb_build_object('origin','DADYOOM_BH_G9_T2_READING_11_20261008','notOfficialBook',true,'ocrReview','pending','options',jsonb_build_array(r.correct,r.w1,r.w2,r.w3)),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_G9_T2_READING_11_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_G9_T2_READING_11_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_G9_T2_READING_11_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;