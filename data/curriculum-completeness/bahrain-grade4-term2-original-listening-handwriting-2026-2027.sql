-- Source-scoped original Dadyoom lesson checks, not official Bahrain textbook/recorded audio.
-- Teacher reads the supporting passage twice for listening. Handwriting needs human review.
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
    (1,'رحلة إلى بلاد الإسكيمو','ما الذي أرادت ندى التعرف إليه في الرحلة المصورة؟','ملابس السكان ووسائل التنقل وحماية البيئة','أنواع الألعاب الإلكترونية','أسماء بحار البحرين فقط','طريقة صنع الشوكولاتة'),
    (2,'الحركة الكشفية','ماذا فعل الكشافة بالأدوات بعد انتهاء المهمة؟','أعادوها إلى أماكنها','تركوها مبعثرة','أخذوها إلى المنزل دون إذن','أتلفوها'),
    (3,'انقلب السحر على الساحر','لماذا اعتذر مازن لزملائه؟','لأنه اختلق خبر إلغاء الامتحان وأزعجهم','لأنه قرأ إعلانًا صحيحًا','لأنه ساعدهم في المراجعة','لأنه حضر إلى المدرسة مبكرًا'),
    (4,'خبر من الماضي','لماذا أرادت يارا الرجوع إلى مصادر موثوقة؟','للتحقق من المعلومات عن الصورة القديمة','لتغيير تاريخ الصورة دون دليل','لإخفاء الصورة عن جدها','لرسم صورة خيالية فقط'),
    (5,'الاستماع — الأسبوع الخامس','أين وجد الطالب بطاقة مكتبته؟','في جيب معطفه','خلف باب الصف','عند أمين المكتبة','تحت شجرة'),
    (6,'بساط الريح','أي شيء في قصة رنا كان خياليًا؟','البساط السحري الطائر','الطائرات التي صنعتها التقنية','المكتبة التي زارتها','البحار الحقيقية'),
    (7,'الإسراء والمعراج','كيف تعامل الطلاب مع التفاصيل التي لم يفهموها في النشاط؟','سجّلوا أسئلتهم ليجيب المعلم بعد التحقق','أضافوا معلومات غير موثقة','تجاهلوا السؤال تمامًا','خلطوا القصة بتفاصيل خيالية'),
    (8,'رائد في عالم الصحافة','ماذا فعل فهد قبل نشر الخبر المدرسي؟','راجع التفاصيل مع المعلم وتحقق منها','نشر الخبر فور سماعه','حذف مكان الحدث وزمانه','اعتمد على التخمين'),
    (9,'مولد بركان','كيف درس التلاميذ البراكين بطريقة آمنة؟','شاهدوا فيلمًا علميًا ورسموا أشكالًا توضيحية','أجروا تجربة بركانية خطرة بأنفسهم','اقتربوا من حمم حقيقية','تجاهلوا توجيهات المعلم'),
    (10,'لماذا اختفى البدر؟','لماذا يتغير شكل الجزء المضيء الذي نراه من القمر؟','بسبب تغير أطوار القمر أثناء دورته حول الأرض','لأن القمر ينطفئ تمامًا كل ليلة','لأن القمر يختفي من الفضاء','لأن الغيوم وحدها تغير جميع الأطوار')
), targets AS (SELECT l.id,qa.* FROM qa JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — الاستماع' AND u.semester=2
JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=4 AND g.name_ar='الصف الرابع'
JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
WHERE length(coalesce(l.content,''))>350 AND l.content ILIKE '%ضاديوم%' AND l.content LIKE '%نص للاستماع يقرؤه المعلم مرتين%')
INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT t.id,'تحقق من فهم النص المسموع — ضاديوم','multiple_choice','assessment',
  'بعد أن يقرأ المعلم النص الأصلي مرتين، أجب: '||t.prompt,
  jsonb_build_object('origin','DADYOOM_BH_G4_T2_LISTENING_ORIGINAL_MCQ_V1','sourceStatus','HISTORICAL_2025_2026_NOT_VERIFIED_FOR_2026_2027','bookTextCopied',false,'reviewStatus','required','delivery','teacher_read_aloud_twice','officialAudioAvailable',false,'options',jsonb_build_array(t.correct,t.w1,t.w2,t.w3)),
  jsonb_build_object('correct',t.correct),1,5,true,true
FROM targets t WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=t.id AND a.content->>'origin'='DADYOOM_BH_G4_T2_LISTENING_ORIGINAL_MCQ_V1');

WITH qa(sort_order,title,prompt,correct,w1,w2,w3,writing_prompt) AS (VALUES
    (1,'حرف (ض)','أي كلمة تبدأ بحرف الضاد؟','ضوء','صديق','ظرف','طريق','اكتب «ضوء» و«أرض» بخط واضح، ثم تتبع شكل الضاد في موضعين. بعد التدريب دوّن الكلمتين هنا لمراجعة رسمهما.'),
    (2,'حرفا (ط) و(ظ)','أي كلمة تبدأ بحرف الظاء؟','ظرف','طريق','ضوء','صباح','انسخ «طائر، طريق، ظرف، نظيف» في دفتر الخط، ولاحظ نقطة الظاء. ثم اكتب كلمتين تتضمنان طاء وظاء.'),
    (3,'حرف (ع)','أين يقع حرف العين في كلمة «عين»؟','أول الكلمة','وسط الكلمة','آخر الكلمة','لا يوجد','اكتب «عين، لعبة، شارع» في سطر واضح؛ لاحظ اتصال حرف العين بحسب موضعه، ثم اكتب الأمثلة هنا.'),
    (4,'حرف (غ)','ما العلامة التي تميز الغين عن العين في الرسم المعتاد؟','نقطة فوق الغين','نقطتان تحت الغين','نقطة تحت العين','ألف بعد الغين','تدرب على «غزال، مغارة، فراغ»، وراجع موضع النقطة فوق الغين، ثم اكتب كلمتين من تدريبك.'),
    (5,'حرفا (ف) و(ق)','كم نقطة فوق حرف القاف في رسم النسخ الشائع؟','نقطتان','نقطة واحدة','ثلاث نقاط','لا نقاط','اكتب «فجر، دفتر، قمر، طريق» بخط النسخ، وميّز نقطتي القاف عن نقطة الفاء، ثم دوّن المثالين هنا.'),
    (6,'حرف (ك)','في أي كلمة يظهر حرف الكاف في آخرها؟','سمك','كتاب','مكتب','كرسي','اكتب «كتاب، مكتب، سمك» في سطر واضح، ولاحظ اختلاف شكل الكاف في المواضع الثلاثة.'),
    (7,'حرف (ل)','أي كلمة من أمثلة الدرس تنتهي بحرف اللام؟','جبل','ليل','لعبة','مكتبة','اكتب «ليل، قلم، جبل» بخط واضح، وأبرز شكل اللام في أول الكلمة ووسطها وآخرها.'),
    (8,'حرف (م)','أين يقع حرف الميم في كلمة «قلم»؟','آخر الكلمة','أول الكلمة','وسط الكلمة','لا يوجد','انسخ «ماء، سماء، قلم» وراجع رسم الميم ومسافات الحروف، ثم أعد كتابة الكلمات هنا.'),
    (9,'حرف (ن)','أين يقع حرف النون في كلمة «لون»؟','آخر الكلمة','أول الكلمة','وسط الكلمة','لا يوجد','انسخ «نور، منزل، لون»، ثم أظهر نقطة النون الواحدة في كل موضع، واكتب كلمتين من الأمثلة.'),
    (10,'حرف (هـ)','أي كلمة من الأمثلة تنتهي بحرف الهاء؟','وجه','هلال','نهر','هذا','انسخ «هلال، نهر، وجه» مع مراجعة اتصال الهاء في مواضعها، ثم دوّن الكلمة التي تنتهي بها.'),
    (11,'حرف (و)','ما خاصية اتصال حرف الواو في الكتابة العربية؟','لا يتصل بالحرف الذي بعده','يتصل دائمًا بالحرف الذي بعده','له نقطتان فوقه','يتغير إلى ياء عند نهايته','انسخ «ورد، ضوء، حلو»، ولاحظ الفراغ الناتج عن عدم اتصال الواو بالحرف الذي بعدها، ثم اكتب مثالًا آخر.'),
    (12,'حرف (ي)','أي كلمة تبدأ بحرف الياء؟','يد','بيت','نور','عين','انسخ «يد، بيت، كرسي» في دفتر الخط، ولاحظ موضع الياء ونقطتيها عند الحاجة؛ ثم دوّن كلمتين تحتويان على ياء.')
), targets AS (SELECT l.id,qa.* FROM qa JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — الخط العربي' AND u.semester=2
JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=4 AND g.name_ar='الصف الرابع'
JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
WHERE length(coalesce(l.content,''))>350 AND l.content ILIKE '%ضاديوم%' AND l.content LIKE '%شرح تطبيقي أصلي%')
INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT t.id,'تمييز أشكال الحروف — ضاديوم','multiple_choice','assessment',t.prompt,
  jsonb_build_object('origin','DADYOOM_BH_G4_T2_HANDWRITING_ORIGINAL_V1','sourceStatus','HISTORICAL_2025_2026_NOT_VERIFIED_FOR_2026_2027','bookTextCopied',false,'reviewStatus','required','subtype','letter_recognition','options',jsonb_build_array(t.correct,t.w1,t.w2,t.w3)),
  jsonb_build_object('correct',t.correct),1,5,true,true
FROM targets t WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=t.id AND a.content->>'origin'='DADYOOM_BH_G4_T2_HANDWRITING_ORIGINAL_V1' AND a.activity_type='multiple_choice');

WITH qa(sort_order,title,prompt,correct,w1,w2,w3,writing_prompt) AS (VALUES
    (1,'حرف (ض)','أي كلمة تبدأ بحرف الضاد؟','ضوء','صديق','ظرف','طريق','اكتب «ضوء» و«أرض» بخط واضح، ثم تتبع شكل الضاد في موضعين. بعد التدريب دوّن الكلمتين هنا لمراجعة رسمهما.'),
    (2,'حرفا (ط) و(ظ)','أي كلمة تبدأ بحرف الظاء؟','ظرف','طريق','ضوء','صباح','انسخ «طائر، طريق، ظرف، نظيف» في دفتر الخط، ولاحظ نقطة الظاء. ثم اكتب كلمتين تتضمنان طاء وظاء.'),
    (3,'حرف (ع)','أين يقع حرف العين في كلمة «عين»؟','أول الكلمة','وسط الكلمة','آخر الكلمة','لا يوجد','اكتب «عين، لعبة، شارع» في سطر واضح؛ لاحظ اتصال حرف العين بحسب موضعه، ثم اكتب الأمثلة هنا.'),
    (4,'حرف (غ)','ما العلامة التي تميز الغين عن العين في الرسم المعتاد؟','نقطة فوق الغين','نقطتان تحت الغين','نقطة تحت العين','ألف بعد الغين','تدرب على «غزال، مغارة، فراغ»، وراجع موضع النقطة فوق الغين، ثم اكتب كلمتين من تدريبك.'),
    (5,'حرفا (ف) و(ق)','كم نقطة فوق حرف القاف في رسم النسخ الشائع؟','نقطتان','نقطة واحدة','ثلاث نقاط','لا نقاط','اكتب «فجر، دفتر، قمر، طريق» بخط النسخ، وميّز نقطتي القاف عن نقطة الفاء، ثم دوّن المثالين هنا.'),
    (6,'حرف (ك)','في أي كلمة يظهر حرف الكاف في آخرها؟','سمك','كتاب','مكتب','كرسي','اكتب «كتاب، مكتب، سمك» في سطر واضح، ولاحظ اختلاف شكل الكاف في المواضع الثلاثة.'),
    (7,'حرف (ل)','أي كلمة من أمثلة الدرس تنتهي بحرف اللام؟','جبل','ليل','لعبة','مكتبة','اكتب «ليل، قلم، جبل» بخط واضح، وأبرز شكل اللام في أول الكلمة ووسطها وآخرها.'),
    (8,'حرف (م)','أين يقع حرف الميم في كلمة «قلم»؟','آخر الكلمة','أول الكلمة','وسط الكلمة','لا يوجد','انسخ «ماء، سماء، قلم» وراجع رسم الميم ومسافات الحروف، ثم أعد كتابة الكلمات هنا.'),
    (9,'حرف (ن)','أين يقع حرف النون في كلمة «لون»؟','آخر الكلمة','أول الكلمة','وسط الكلمة','لا يوجد','انسخ «نور، منزل، لون»، ثم أظهر نقطة النون الواحدة في كل موضع، واكتب كلمتين من الأمثلة.'),
    (10,'حرف (هـ)','أي كلمة من الأمثلة تنتهي بحرف الهاء؟','وجه','هلال','نهر','هذا','انسخ «هلال، نهر، وجه» مع مراجعة اتصال الهاء في مواضعها، ثم دوّن الكلمة التي تنتهي بها.'),
    (11,'حرف (و)','ما خاصية اتصال حرف الواو في الكتابة العربية؟','لا يتصل بالحرف الذي بعده','يتصل دائمًا بالحرف الذي بعده','له نقطتان فوقه','يتغير إلى ياء عند نهايته','انسخ «ورد، ضوء، حلو»، ولاحظ الفراغ الناتج عن عدم اتصال الواو بالحرف الذي بعدها، ثم اكتب مثالًا آخر.'),
    (12,'حرف (ي)','أي كلمة تبدأ بحرف الياء؟','يد','بيت','نور','عين','انسخ «يد، بيت، كرسي» في دفتر الخط، ولاحظ موضع الياء ونقطتيها عند الحاجة؛ ثم دوّن كلمتين تحتويان على ياء.')
), targets AS (SELECT l.id,qa.* FROM qa JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — الخط العربي' AND u.semester=2
JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=4 AND g.name_ar='الصف الرابع'
JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
WHERE length(coalesce(l.content,''))>350 AND l.content ILIKE '%ضاديوم%' AND l.content LIKE '%شرح تطبيقي أصلي%')
INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT t.id,'تدريب خط يحتاج مراجعة بشرية','writing','practice',t.writing_prompt,
  jsonb_build_object('origin','DADYOOM_BH_G4_T2_HANDWRITING_ORIGINAL_V1','sourceStatus','HISTORICAL_2025_2026_NOT_VERIFIED_FOR_2026_2027','bookTextCopied',false,'reviewStatus','required','subtype','handwriting_practice','humanReviewRequired',true,'text',t.writing_prompt),
  jsonb_build_object('grading_mode','completion_only_reference','model_answer','يلزم الاطلاع على التدريب المكتوب باليد ومراجعة جودة الخط من المعلم؛ الإدخال النصي لا يثبت جودة الخط.'),2,5,true,true
FROM targets t WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=t.id AND a.content->>'origin'='DADYOOM_BH_G4_T2_HANDWRITING_ORIGINAL_V1' AND a.activity_type='writing');
