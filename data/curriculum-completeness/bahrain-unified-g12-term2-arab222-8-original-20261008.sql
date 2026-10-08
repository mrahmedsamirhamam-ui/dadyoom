-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only genuinely empty published lessons; add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":1,"skill":"الواقعية والشعور الفردي في الشعر","passage":"تحليل قصيدة «ردي علي عواطفي» لإلياس قنصل يحتاج أبياتها الصحيحة لتحديد موقف الشاعر والصور، ولا يُستدل من العنوان وحده على مضمونها. نص أصلي: «رجع العامل آخر النهار متعبًا، وسأل نفسه كيف يغير الغد» يعرض تجربة يومية، وليس بيتًا من القصيدة.","prompt":"ما السمة الواقعية في المثال المستقل؟","correct":"الاهتمام بتجربة عمل يومية","w1":"اختلاق أحداث أسطورية","w2":"إلغاء الشخصية","w3":"غياب الزمن","practice":"بعد قراءة قصيدة موثقة، استخرج صورة ترتبط بتجربة إنسانية ملموسة واشرح دلالتها."},{"n":2,"skill":"القضية الإنسانية في الشعر الواقعي","passage":"لقراءة «الكوكب الأرضي» لفدوى طوقان قراءة دقيقة نحتاج النص المدرسي والسياق قبل تعيين فكرة أو شعار للشاعرة. تدريب مستقل: «يرى طفل الحي ماءً مهدورًا فيقترح على جيرانه إصلاح التسرب». يجسد اهتمامًا بمشكلة عامة، لكنه غير منسوب إلى الشاعرة.","prompt":"ما القضية العملية في المثال؟","correct":"هدر المياه","w1":"الاستعداد لمباراة","w2":"فقد قلم","w3":"شراء حاسوب","practice":"قارن بين موقف إنساني من قصيدة فدوى طوقان موثقة ومشهد من إنشائك، مع بيان أدوات التأثير."},{"n":3,"skill":"المقال الأدبي بين المسودة والتنقيح","passage":"تبدأ المقالة الأدبية بفكرة مثل «كيف تغيّر القراءة حياة طالب»، ثم تشرح تجربة أو مشهدًا وتنتقل إلى تأمل شخصي وخاتمة. الإنتاج الجزئي يركز على فقرة أو افتتاحية، أما الكامل فيربط الأجزاء ويحذف التكرار.","prompt":"ما الخطوة التي تلي صياغة المسودة؟","correct":"مراجعة الترابط والدليل واللغة","w1":"نشر النص دون قراءة","w2":"تكرار المقدمة","w3":"حذف الفكرة","practice":"اكتب مقدمة وفقرتين أولًا، ثم وسعهما إلى مقال أدبي متكامل مع مراجعة لغوية."},{"n":4,"skill":"المفارقة في القصة الواقعية","passage":"لقراءة «الضحك في آخر الليل» المنسوبة إلى عبد الله عبد يجب الرجوع إلى النص الأصلي وعدم اختلاق شخصيات أو نهايات. نموذج مستقل: ضحك صديقان من خطأ بسيط في إعلان المدرسة، ثم أدركا أنه أربك الحضور فبادرا بتصحيحه. تتغير دلالة الضحك مع الموقف.","prompt":"ما التحول في موقف الصديقين؟","correct":"الانتقال من الضحك إلى تحمل المسؤولية","w1":"ترك الإعلان بلا إصلاح","w2":"إلغاء الضحك","w3":"اختفاء المدرسة","practice":"استخرج من القصة المقررة تحولًا حقيقيًا للشخصية وشاهدًا يدل عليه، ثم أعد كتابة مشهد مستقل."},{"n":5,"skill":"الحوار المسرحي وكشف الشخصية","passage":"تحليل «النائبة المحترمة» لتوفيق الحكيم يتطلب النص المسرحي الأصلي قبل نسبة حوار أو موقف للكاتب. نموذج مستقل: «المديرة: لماذا تأخر التقرير؟ الموظف: لأننا لم نتفق على مصدر الأرقام. المديرة: لنجتمع ونراجعها». يكشف الحوار علاقة المشكلة بالقرار.","prompt":"ما سبب التأخير في النموذج المسرحي؟","correct":"عدم الاتفاق على مصدر الأرقام","w1":"غياب المديرة","w2":"انتهاء الاجتماعات","w3":"تغيير المكتب","practice":"اكتب مشهدًا من ثماني مداخلات بشخصيتين متباينتين وصراع وحل، ثم استشهد من المسرحية الأصلية بعد قراءتها."},{"n":6,"skill":"العناية بالتفاصيل في الرواية الواقعية","passage":"لا يحدد عنوان «دواء المتقدم في السن» المنسوب إلى نجيب محفوظ وحده الوقائع أو الفكرة الأساسية؛ يجب مراجعة النص المقرر. في مشهد مستقل يقف رجل مسن عند نافذة صيدلية ويطلب تفسير التعليمات المكتوبة على عبوة دواء دون وصف دواء حقيقي أو علاج، فيساعده موظف على القراءة.","prompt":"ما المشكلة التي واجهها الرجل في النموذج؟","correct":"فهم التعليمات المكتوبة","w1":"فقد منزله","w2":"تعطل سيارة","w3":"نسي عنوان الشارع","practice":"بعد قراءة النص الأصلي حلل وصف شخصية أو مكان بشاهد موثق، ثم اكتب مشهدًا واقعيًا دون ادعاء تفاصيل طبية."},{"n":7,"skill":"القصة القصيرة: من مشهد إلى عمل كامل","passage":"يمكن البدء بقصة من مشهد واحد: اكتشف طفل ضياع كتاب قبل زيارة المكتبة. يحدد الكاتب وجهة نظر الراوي وعقدة وحلًا ونتيجة، ثم يوسع المشهد إلى قصة لا تكثر الشخصيات بلا ضرورة.","prompt":"ما العنصر الذي يحرك الحدث في النموذج؟","correct":"ضياع الكتاب","w1":"عنوان المكتبة","w2":"عدد الرفوف","w3":"لون السماء","practice":"اكتب مشهدًا افتتاحيًا ثم طوره إلى قصة من 200 كلمة تشتمل على عقدة وحوار ونهاية معقولة."},{"n":8,"skill":"الاحتجاج في شعر الواقعية الجديدة","passage":"لفهم «احتجاج العائد من رحلة الخوف» لعبد العزيز المقالح يتطلب الرجوع إلى القصيدة الصحيحة وسياقها قبل نسبة خطاب سياسي أو صورة إليها. تدريب مستقل: «عاد متعلم من رحلة طويلة ورفض الصمت عن ظاهرة ظلم شاهدها، فكتب رسالة موثقة». ليس هذا نص القصيدة.","prompt":"ما الوسيلة التي اختارها المتعلم للتعبير عن احتجاجه؟","correct":"رسالة تستند إلى ما شاهده","w1":"إخفاء المشاهدات","w2":"اختلاق معلومات","w3":"الامتناع عن الكتابة","practice":"وثق من القصيدة الأصلية أسلوبًا يعبر عن موقف الشاعر ثم حلله دون استنتاج غير مدعوم."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=12
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027' AND cu.id='31c82c79-72de-4e4b-a5dc-6f9e598b3533'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='عرب 222 — الأدب العربي الحديث: المدرسة الواقعية (اختياري أساسي)' AND u.semester=2 AND l.sort_order=r.n AND l.status='published'
    FOR UPDATE OF l;
    IF char_length(coalesce(target_content,''))<350 THEN
      UPDATE public.lessons SET
        content='ضاديوم — إثراء مستقل أصلي للصف الثامن، الفصل الثاني. لا يمثل النص الوزاري الأصلي ولا يثبت مطابقة العنوان للمصدر.'||E'\n\n'||
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
        jsonb_build_object('origin','DADYOOM_BH_UNIFIED_G12_T2_ARAB222_ORIGINAL_20261008','notOfficialBook',true,'ocrReview','pending','options',CASE (r.n % 4) WHEN 0 THEN jsonb_build_array(r.correct,r.w1,r.w2,r.w3) WHEN 1 THEN jsonb_build_array(r.w1,r.correct,r.w2,r.w3) WHEN 2 THEN jsonb_build_array(r.w1,r.w2,r.correct,r.w3) ELSE jsonb_build_array(r.w1,r.w2,r.w3,r.correct) END),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_UNIFIED_G12_T2_ARAB222_ORIGINAL_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_UNIFIED_G12_T2_ARAB222_ORIGINAL_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_UNIFIED_G12_T2_ARAB222_ORIGINAL_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;