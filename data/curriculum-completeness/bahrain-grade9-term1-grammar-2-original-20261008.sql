-- Independent Dadyoom teaching supports, not claims about the contents of official books.
-- Idempotent: update only genuinely empty published lessons; add each origin/type once.
DO $dadyoom$
DECLARE
  r RECORD;
  target_id uuid;
  target_content text;
BEGIN
  FOR r IN SELECT * FROM jsonb_to_recordset('[{"n":2,"skill":"صيغة منتهى الجموع الممنوعة من الصرف","passage":"في «مررتُ بمساجدَ كثيرةٍ» جُرّت «مساجدَ» بالفتحة نيابة عن الكسرة لأنها ممنوعة من الصرف لصيغة منتهى الجموع، وهي غير مضافة وغير معرَّفة بـ«أل». في «مررتُ بالمساجدِ» يظهر الجر بالكسرة بسبب دخول «أل».","prompt":"ما علامة جر «مساجدَ» في المثال الأول؟","correct":"الفتحة نيابة عن الكسرة","w1":"الضمة","w2":"السكون","w3":"حذف حرف العلة","practice":"اكتب جملتين بكلمة «مساجد»: نكرة غير مضافة ومعرّفة بأل، ثم أعرب الكلمة في كل حالة."},{"n":17,"skill":"ألف التأنيث الممدودة المانعة من الصرف","passage":"«صحراءُ» ممنوعة من الصرف لألف التأنيث الممدودة، وفي «سرتُ في صحراءَ واسعةٍ» جُرّت بالفتحة نيابة عن الكسرة لأنها غير مضافة وغير معرفة بـ«أل». نقارن ذلك بكلمة «الصحراءِ» بعد دخول «أل»، فنعيد الجر بالكسرة.","prompt":"لماذا جرت «صحراءَ» بالفتحة في المثال؟","correct":"لأنها ممنوعة من الصرف لألف التأنيث الممدودة","w1":"لأنها فعل ماض","w2":"لأنها جمع مذكر سالم","w3":"لأنها حرف جر","practice":"كوّن مثالًا بكلمة «صحراء» نكرة، وآخر معرفة بأل، ثم فسّر اختلاف علامة الجر."}]'::jsonb) AS x(
    n integer,skill text,passage text,prompt text,correct text,w1 text,w2 text,w3 text,practice text
  ) LOOP
    SELECT l.id,l.content INTO STRICT target_id,target_content
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=9
    JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
    JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
    WHERE u.title='القواعد والتراكيب' AND u.semester=1 AND l.sort_order=r.n AND l.status='published'
    FOR UPDATE OF l;
    IF coalesce(trim(target_content),'')='' OR (target_content LIKE 'يتناول هذا الدرس موضوع%' AND char_length(target_content)<350) THEN
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
        jsonb_build_object('origin','DADYOOM_BH_G9_T1_GRAMMAR_2_20261008','notOfficialBook',true,'ocrReview','pending','options',jsonb_build_array(r.correct,r.w1,r.w2,r.w3)),
        jsonb_build_object('correct',r.correct),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='multiple_choice' AND content->>'origin'='DADYOOM_BH_G9_T1_GRAMMAR_2_20261008');
      INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
      SELECT target_id,'كتابة تطبيقية بمراجعة المعلم','writing','practice',r.practice,
        jsonb_build_object('origin','DADYOOM_BH_G9_T1_GRAMMAR_2_20261008','notOfficialBook',true,'humanReviewRequired',true,'text',r.practice,'skillQualityAutoVerified',false),
        jsonb_build_object('grading_mode','completion_only_reference','model_answer','لا تكفي المطابقة النصية؛ يصحح المعلم ملاءمة الأفكار والدليل والترابط.'),
        coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=target_id),0)+1,5,true,true
      WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities WHERE lesson_id=target_id AND activity_type='writing' AND content->>'origin'='DADYOOM_BH_G9_T1_GRAMMAR_2_20261008');
    END IF;
  END LOOP;
END
$dadyoom$;