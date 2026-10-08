-- Exercises written by Dadyoom, not copied from the Ministry's listening texts or handwriting workbooks.
-- Scheduling labels from the semester-one 2026-27 plans do NOT establish book-text parity.
-- No rows are deleted. Match grade, semester, exact lesson title/order, and existing authored content.
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(1,'الاستماع: أبو ذر الغفاري','كيف اقترح الطلاب التحقق من سيرة شخصية تاريخية في النص الأصلي؟','الرجوع إلى كتاب موثق وتدوين الأسئلة','نقل الأقوال دون مصدر','الاعتماد على توقعات العنوان فقط','تجاهل القراءة'),
(2,'الاستماع: حب الوطن','كيف يظهر حب الوطن وفق المعلمة؟','في العلم والعمل واحترام الآخرين','في الكلام دون أي عمل','في إهدار الماء','في إهمال مرافق المدرسة'),
(3,'الاستماع: الحمامة البيضاء','كيف احترم الأطفال الحمامة البيضاء؟','راقبوها من بعيد بهدوء دون إزعاجها','حاولوا الإمساك بها','كسروا غصن الشجرة','اقتربوا من العش رغم التحذير'),
(4,'الاستماع: صديق جديد','كيف ساعد يوسف رائدًا في مدرسته الجديدة؟','عرّفه إلى المكتبة والساحة','تجاهله طوال اليوم','منعه من اللعب','سخر من خجله'),
(5,'الاستماع: حلم يتحقق','ما أول خطوة وضعتها سلمى لتحقيق حلم مسابقة القراءة؟','اختيار قصة مناسبة وقراءتها كل أسبوع','التوقف عن التدريب','تقديم العرض دون فهم','انتظار النجاح من دون عمل'),
(6,'الاستماع: عبقرية عالم','بماذا يبدأ العمل العلمي بحسب المعلم؟','بسؤال ثم ملاحظة وتجربة وتسجيل نتائج','بتخمين نتيجة دون فحص','بالسخرية من الأخطاء','بترك كل الأسئلة بلا إجابة'),
(7,'الاستماع: شجرة الكنار','كيف يستطيع الزوار حماية شجرة الكنار؟','عدم كسر الأغصان والمحافظة على نظافة الأرض','قطع الأغصان للذكرى','إزعاج الكائنات حولها','إلقاء المخلفات عند جذورها'),
(9,'الاستماع: جزاء المعروف','ما الفكرة التي قالها والد راشد عن فعل المعروف؟','قيمته في ذاته ولا يحتاج انتظار مكافأة','لا فائدة منه إلا بمقابل','يجب تجاهل من يحتاج المساعدة','المساعدة تتعارض مع احترام الآخرين'),
(11,'الاستماع: أي الأعمال أحب إليك؟','ما العمل الذي قالت أمل إنها تحبه؟','القراءة','زراعة النباتات','إصلاح السيارات','رسم خرائط البحر'),
(13,'الاستماع: الطائر الطبيب','ما السؤال العلمي الذي طرحته هدى بعد الفيلم؟','علاقة شكل المنقار بطعام الطيور','موعد المباراة القادمة','الفرق بين أنواع السيارات','طرق الرسم بالحاسوب')
), scoped AS (SELECT l.id,qa.* FROM qa JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.semester=1 AND u.title='الاستماع — الخطة الرسمية للفصل الأول'
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=4 AND g.name_ar='الصف الرابع'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' )
 INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
 SELECT s.id,'استمع وأجب — تدريب ضاديوم الأصلي','multiple_choice','assessment','بعد الاستماع إلى نص ضاديوم الذي يقرؤه المعلم مرتين: '||s.prompt,
 jsonb_build_object('origin','DADYOOM_BH_T1_ORIGINAL_MISSING_ACTIVITY_CLOSURE_20261008','2026_27_book_text_verification','PENDING','notMinistryText',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3),'teacherReadAloudTwice',true,'officialAudioAvailable',false),jsonb_build_object('correct',s.correct),
 1,5,true,true FROM scoped s WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_T1_ORIGINAL_MISSING_ACTIVITY_CLOSURE_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(2,'الاستماع: مسبحة جدتي','لماذا احتفظت الجدة بالمسبحة القديمة؟','لأنها تذكرها بمواقف أسرية جميلة','لأنها لا تريد تذكر أسرتها','لأنها لعبة حديثة','لأنها أداة مدرسية')
), scoped AS (SELECT l.id,qa.* FROM qa JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.semester=1 AND u.title='الأسرة — استماع الفصل الأول'
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=5 AND g.name_ar='الصف الخامس'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' )
 INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
 SELECT s.id,'استمع وأجب — تدريب ضاديوم الأصلي','multiple_choice','assessment','بعد الاستماع إلى نص ضاديوم الذي يقرؤه المعلم مرتين: '||s.prompt,
 jsonb_build_object('origin','DADYOOM_BH_T1_ORIGINAL_MISSING_ACTIVITY_CLOSURE_20261008','2026_27_book_text_verification','PENDING','notMinistryText',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3),'teacherReadAloudTwice',true,'officialAudioAvailable',false),jsonb_build_object('correct',s.correct),
 1,5,true,true FROM scoped s WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_T1_ORIGINAL_MISSING_ACTIVITY_CLOSURE_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(6,'الاستماع: الأصدقاء الثلاثة','كيف تعامل الأصدقاء مع انسكاب اللون على اللوحة؟','تعاونوا وأعادوا توزيع المهام','تبادلوا اللوم وتركوا العمل','أتلفوا اللوحة دون بديل','رفضوا المساعدة')
), scoped AS (SELECT l.id,qa.* FROM qa JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.semester=1 AND u.title='الصداقة والأخوة — استماع الفصل الأول'
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=5 AND g.name_ar='الصف الخامس'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' )
 INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
 SELECT s.id,'استمع وأجب — تدريب ضاديوم الأصلي','multiple_choice','assessment','بعد الاستماع إلى نص ضاديوم الذي يقرؤه المعلم مرتين: '||s.prompt,
 jsonb_build_object('origin','DADYOOM_BH_T1_ORIGINAL_MISSING_ACTIVITY_CLOSURE_20261008','2026_27_book_text_verification','PENDING','notMinistryText',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3),'teacherReadAloudTwice',true,'officialAudioAvailable',false),jsonb_build_object('correct',s.correct),
 1,5,true,true FROM scoped s WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_T1_ORIGINAL_MISSING_ACTIVITY_CLOSURE_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(11,'الاستماع: سائح عربي في البحرين','ماذا اقترح راشد على الزائر العربي للتعرف إلى التراث؟','زيارة مكان ثقافي بمساعدة دليل موثوق','دخول المواقع دون احترام','التخلص من المخلفات في الشارع','نقل تاريخ غير موثق')
), scoped AS (SELECT l.id,qa.* FROM qa JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.semester=1 AND u.title='وطني البحرين — استماع الفصل الأول'
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=5 AND g.name_ar='الصف الخامس'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' )
 INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
 SELECT s.id,'استمع وأجب — تدريب ضاديوم الأصلي','multiple_choice','assessment','بعد الاستماع إلى نص ضاديوم الذي يقرؤه المعلم مرتين: '||s.prompt,
 jsonb_build_object('origin','DADYOOM_BH_T1_ORIGINAL_MISSING_ACTIVITY_CLOSURE_20261008','2026_27_book_text_verification','PENDING','notMinistryText',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3),'teacherReadAloudTwice',true,'officialAudioAvailable',false),jsonb_build_object('correct',s.correct),
 1,5,true,true FROM scoped s WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_T1_ORIGINAL_MISSING_ACTIVITY_CLOSURE_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(4,'الاستماع: حلمٌ يتحقق','كيف اقتربت ليلى من حلم تقديم عرض علمي؟','بالتدرب وتنظيم النتائج ومراجعة الأخطاء','بعدم سؤال المعلمة','بإخفاء مصادر المعلومات','بترك الأفكار دون تجربة'),
(10,'الاستماع: عيون الماء في البحرين','كيف حاول سلمان وزملاؤه فهم تاريخ عيون الماء؟','راجعوا صورًا وخرائط وسألوا عن مصادر موثوقة','اختلقوا أحداثًا تاريخية','رفضوا حماية المياه','اكتفوا بتوقعات غير مدعومة'),
(13,'الاستماع: حمام الحمى','ما التعليمات التي طلبها المرشد لمراقبة الطيور؟','ترك مسافة مناسبة وعدم إزعاج الأعشاش','إطعام الطيور طعامًا عشوائيًا','الإمساك بها عند كل مشاهدة','إتلاف مواطنها الطبيعية')
), scoped AS (SELECT l.id,qa.* FROM qa JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.semester=1 AND u.title='الاستماع — خطة الصف السادس الفصل الأول'
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=6 AND g.name_ar='الصف السادس'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' )
 INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
 SELECT s.id,'استمع وأجب — تدريب ضاديوم الأصلي','multiple_choice','assessment','بعد الاستماع إلى نص ضاديوم الذي يقرؤه المعلم مرتين: '||s.prompt,
 jsonb_build_object('origin','DADYOOM_BH_T1_ORIGINAL_MISSING_ACTIVITY_CLOSURE_20261008','2026_27_book_text_verification','PENDING','notMinistryText',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3),'teacherReadAloudTwice',true,'officialAudioAvailable',false),jsonb_build_object('correct',s.correct),
 1,5,true,true FROM scoped s WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_T1_ORIGINAL_MISSING_ACTIVITY_CLOSURE_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,practice) AS (VALUES
(2,'الخط: حرف (أ)','أي كلمة تبدأ بألف عليها همزة فوقها؟','أمل','اسم','بيت','تمر','اكتب حرف الألف المهموز في سطر واضح ثم انسخ «أمل» و«أرض» وراجع موضع الهمزة.'),
(3,'الخط: حرف (ب)','أين توضع نقطة الباء في الكتابة المعتادة؟','تحت الحرف','فوق الحرف','نقطتان فوقه','بدون نقطة','انسخ «باب، كتاب، حب» وميز الباء ونقطتها في المواقع الثلاثة.'),
(4,'الخط: حرف (ت)','كم نقطة فوق التاء في خط النسخ؟','نقطتان','نقطة واحدة','ثلاث نقاط','لا نقاط','انسخ «تمر، مكتب، بنت» مع مراجعة نقطتي التاء واتصالها.'),
(5,'الخط: حرف (ث)','كم نقطة فوق الثاء؟','ثلاث نقاط','نقطتان','نقطة واحدة','لا توجد نقاط','انسخ «ثوب، مثلث، بحث» وراجع مواضع نقاط الثاء.'),
(6,'الخط: حرف (ج)','أين تقع نقطة حرف الجيم؟','تحت الحرف','فوق الحرف','لا توجد نقطة','نقطتان فوقه','انسخ «جمل، نجمة، درج» وراجع نقطة الجيم حسب موضعه.'),
(7,'الخط: حرفا (ح) و(خ)','ما الذي يميز الخاء عن الحاء في الرسم؟','نقطة فوق الخاء','نقطة تحت الحاء','نقطتان فوق الحاء','إضافة حرف مد بعد الخاء','انسخ «حب، خبز، بحر، فخر» وميز بين الحاء والخاء وخط سير القلم.'),
(8,'الخط: حرف (د)','هل يتصل حرف الدال بالحرف الذي بعده في الكتابة العربية؟','لا يتصل بالحرف الذي بعده','يتصل دائمًا بما بعده','يتحول إلى ذال إذا اتصل','يرسم بثلاث نقاط','اكتب «دار، مدرسة، ورد» ولاحظ أن الدال لا يتصل بما بعده.'),
(9,'الخط: حرف (ذ)','ما العلامة التي تميز الذال عن الدال؟','نقطة فوق الذال','نقطة تحت الذال','نقطتان فوق الدال','حذف جسم الحرف','اكتب «ذهب، أذن، لذيذ» وميز نقطة الذال في المواقع المختلفة.'),
(10,'الخط: حرف (ر)','أي حرف لا يتصل بما بعده مثل حرف الراء؟','الواو','الباء','السين','الشين','انسخ «رمل، مدرسة، نهر» وراجع عدم اتصال الراء بالحرف اللاحق.'),
(11,'الخط: حرف (ز)','كم نقطة فوق الزاي في الخط المعتاد؟','نقطة واحدة','نقطتان','ثلاث نقاط','لا نقاط','انسخ «زهر، مزرعة، كنز» مع وضع نقطة الزاي بدقة.'),
(12,'الخط: حرفا (س) و(ش)','كم نقطة فوق الشين تميزه عن السين؟','ثلاث نقاط','نقطة واحدة','نقطتان','لا نقاط','انسخ «سمك، شمس، مدرسة، فرش» وقارن السين بالشين.'),
(13,'الخط: حرف (ص)','أي كلمة تبدأ بحرف الصاد؟','صبر','ضوء','سفر','ظرف','انسخ «صبر، فصل، قفص» مع مراجعة هيئة الصاد على السطر.')
), scoped AS (SELECT l.id,qa.* FROM qa JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.semester=1 AND u.title='الخط العربي — الفصل الأول 2026–2027'
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=5 AND g.name_ar='الصف الخامس'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' )
 INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
 SELECT s.id,'تمييز الحرف — تدريب ضاديوم','multiple_choice','assessment',s.prompt,
 jsonb_build_object('origin','DADYOOM_BH_T1_ORIGINAL_MISSING_ACTIVITY_CLOSURE_20261008','2026_27_book_text_verification','PENDING','notMinistryText',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),jsonb_build_object('correct',s.correct),
 1,5,true,true FROM scoped s WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_T1_ORIGINAL_MISSING_ACTIVITY_CLOSURE_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,practice) AS (VALUES
(2,'الخط: حرف (أ)','أي كلمة تبدأ بألف عليها همزة فوقها؟','أمل','اسم','بيت','تمر','اكتب حرف الألف المهموز في سطر واضح ثم انسخ «أمل» و«أرض» وراجع موضع الهمزة.'),
(3,'الخط: حرف (ب)','أين توضع نقطة الباء في الكتابة المعتادة؟','تحت الحرف','فوق الحرف','نقطتان فوقه','بدون نقطة','انسخ «باب، كتاب، حب» وميز الباء ونقطتها في المواقع الثلاثة.'),
(4,'الخط: حرف (ت)','كم نقطة فوق التاء في خط النسخ؟','نقطتان','نقطة واحدة','ثلاث نقاط','لا نقاط','انسخ «تمر، مكتب، بنت» مع مراجعة نقطتي التاء واتصالها.'),
(5,'الخط: حرف (ث)','كم نقطة فوق الثاء؟','ثلاث نقاط','نقطتان','نقطة واحدة','لا توجد نقاط','انسخ «ثوب، مثلث، بحث» وراجع مواضع نقاط الثاء.'),
(6,'الخط: حرف (ج)','أين تقع نقطة حرف الجيم؟','تحت الحرف','فوق الحرف','لا توجد نقطة','نقطتان فوقه','انسخ «جمل، نجمة، درج» وراجع نقطة الجيم حسب موضعه.'),
(7,'الخط: حرفا (ح) و(خ)','ما الذي يميز الخاء عن الحاء في الرسم؟','نقطة فوق الخاء','نقطة تحت الحاء','نقطتان فوق الحاء','إضافة حرف مد بعد الخاء','انسخ «حب، خبز، بحر، فخر» وميز بين الحاء والخاء وخط سير القلم.'),
(8,'الخط: حرف (د)','هل يتصل حرف الدال بالحرف الذي بعده في الكتابة العربية؟','لا يتصل بالحرف الذي بعده','يتصل دائمًا بما بعده','يتحول إلى ذال إذا اتصل','يرسم بثلاث نقاط','اكتب «دار، مدرسة، ورد» ولاحظ أن الدال لا يتصل بما بعده.'),
(9,'الخط: حرف (ذ)','ما العلامة التي تميز الذال عن الدال؟','نقطة فوق الذال','نقطة تحت الذال','نقطتان فوق الدال','حذف جسم الحرف','اكتب «ذهب، أذن، لذيذ» وميز نقطة الذال في المواقع المختلفة.'),
(10,'الخط: حرف (ر)','أي حرف لا يتصل بما بعده مثل حرف الراء؟','الواو','الباء','السين','الشين','انسخ «رمل، مدرسة، نهر» وراجع عدم اتصال الراء بالحرف اللاحق.'),
(11,'الخط: حرف (ز)','كم نقطة فوق الزاي في الخط المعتاد؟','نقطة واحدة','نقطتان','ثلاث نقاط','لا نقاط','انسخ «زهر، مزرعة، كنز» مع وضع نقطة الزاي بدقة.'),
(12,'الخط: حرفا (س) و(ش)','كم نقطة فوق الشين تميزه عن السين؟','ثلاث نقاط','نقطة واحدة','نقطتان','لا نقاط','انسخ «سمك، شمس، مدرسة، فرش» وقارن السين بالشين.'),
(13,'الخط: حرف (ص)','أي كلمة تبدأ بحرف الصاد؟','صبر','ضوء','سفر','ظرف','انسخ «صبر، فصل، قفص» مع مراجعة هيئة الصاد على السطر.')
), scoped AS (SELECT l.id,qa.* FROM qa JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.semester=1 AND u.title='الخط العربي — الفصل الأول 2026–2027'
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=5 AND g.name_ar='الصف الخامس'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' )
 INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
 SELECT s.id,'مهمة خط تحتاج مراجعة المعلم','writing','practice',s.practice,
 jsonb_build_object('origin','DADYOOM_BH_T1_ORIGINAL_MISSING_ACTIVITY_CLOSURE_20261008','2026_27_book_text_verification','PENDING','notMinistryText',true,'reviewStatus','required','text',s.practice,'humanReviewRequired',true,'handwritingAutoGraded',false),
 jsonb_build_object('grading_mode','completion_only_reference','model_answer','على المعلم مراجعة جودة الخط ورسم الحروف عمليًا؛ إكمال المهمة لا يثبت جودة الكتابة.'),2,5,true,true
 FROM scoped s WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_T1_ORIGINAL_MISSING_ACTIVITY_CLOSURE_20261008' AND a.activity_type='writing');
