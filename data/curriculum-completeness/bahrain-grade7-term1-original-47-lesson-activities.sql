-- Added Dadyoom-original activities to 47 existing published grade-seven Bahrain first-term
-- lesson records. Official schedule evidence is separate from exercise-book-text fidelity.
-- No lessons or previous activities are overwritten/deleted, and every insertion is idempotent.
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,practice) AS (VALUES
(81,'إعداد خطة عمل للموضوع الإنشائي السردي','ما العنصر الذي يسبق كتابة قصة مترابطة عادةً؟','تحديد الشخصيات والمكان والأحداث الأساسية','كتابة النهاية دون فكرة','تكرار الجملة نفسها','حذف سبب المشكلة','ضع خطة لقصة قصيرة تضم الشخصية والمكان والمشكلة والحل في نقاط مرتبة.'),
(112,'كتابة نص سردي ذي بنية ثلاثية (1)','ما الأقسام الرئيسة للبنية السردية الثلاثية؟','البداية والوسط والنهاية','العنوان فقط','التحية والتوقيع فقط','فهرس الأسماء','اكتب قصة في ثلاثة مقاطع قصيرة: بداية تعرض الشخصيات، ووسط فيه مشكلة، ونهاية للحل.'),
(123,'كتابة نص سردي ذي بنية ثلاثية (2)','أي عبارة تصلح لبداية حل المشكلة في سرد ثلاثي؟','بعد التفكير اتفق الأصدقاء على خطة','كان يا مكان فقط دون تكملة','انتهت القصة قبل أن تبدأ','العنوان مناسب جدًا','راجع نصًا سرديًا من تأليفك وأضف جملتي سبب ونتيجة لتوضيح الحل.'),
(134,'توظيف علامات الترقيم توظيفًا سليمًا','ما علامة الترقيم المناسبة بعد سؤال «أين الكتاب»؟','؟','،','.','؛','اكتب حوارًا من أربعة أسطر يستخدم علامة الاستفهام والفاصلة والنقطة في مواضعها.'),
(155,'كتابة تقرير عن رحلة أو زيارة أو فعالية','ما المعلومات الضرورية في تقرير عن رحلة مدرسية؟','الزمان والمكان والحدث والنتيجة','خيال الكاتب دون أحداث','الانطباعات بلا زمان أو مكان','عنوان لا صلة له بالنشاط','اكتب تقريرًا موجزًا عن زيارة تعليمية يبين أين ومتى حدثت ومن شارك وما النتيجة.'),
(166,'كتابة بطاقة الدعوة','أي عناصر يجب أن تتضمنها بطاقة دعوة مناسبة؟','المناسبة والزمان والمكان والجهة الداعية','لون البطاقة فقط','اسم شخص بلا موعد','معلومات غير متصلة بالحدث','صمم نص بطاقة دعوة إلى معرض قراءة، مع موعد ومكان وعبارة ترحيب واضحة.')
), scoped AS (SELECT l.id,qa.* FROM qa
JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
JOIN public.units u ON u.id=l.unit_id AND u.title='التعبير والكتابة' AND u.semester=1
JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=7
JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
WHERE length(coalesce(l.content,''))>400 AND l.content LIKE '%ضاديوم%'
)
INSERT INTO public.lesson_activities(lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم أصلي من ضاديوم','multiple_choice','assessment',s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G7_T1_ORIGINAL_ACTIVITY_COMPLETENESS_20261008','notMinistryBookText',true,'bookFidelityNotAudited',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
jsonb_build_object('correct',s.correct),1,5,true,true FROM scoped s
WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G7_T1_ORIGINAL_ACTIVITY_COMPLETENESS_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,practice) AS (VALUES
(81,'إعداد خطة عمل للموضوع الإنشائي السردي','ما العنصر الذي يسبق كتابة قصة مترابطة عادةً؟','تحديد الشخصيات والمكان والأحداث الأساسية','كتابة النهاية دون فكرة','تكرار الجملة نفسها','حذف سبب المشكلة','ضع خطة لقصة قصيرة تضم الشخصية والمكان والمشكلة والحل في نقاط مرتبة.'),
(112,'كتابة نص سردي ذي بنية ثلاثية (1)','ما الأقسام الرئيسة للبنية السردية الثلاثية؟','البداية والوسط والنهاية','العنوان فقط','التحية والتوقيع فقط','فهرس الأسماء','اكتب قصة في ثلاثة مقاطع قصيرة: بداية تعرض الشخصيات، ووسط فيه مشكلة، ونهاية للحل.'),
(123,'كتابة نص سردي ذي بنية ثلاثية (2)','أي عبارة تصلح لبداية حل المشكلة في سرد ثلاثي؟','بعد التفكير اتفق الأصدقاء على خطة','كان يا مكان فقط دون تكملة','انتهت القصة قبل أن تبدأ','العنوان مناسب جدًا','راجع نصًا سرديًا من تأليفك وأضف جملتي سبب ونتيجة لتوضيح الحل.'),
(134,'توظيف علامات الترقيم توظيفًا سليمًا','ما علامة الترقيم المناسبة بعد سؤال «أين الكتاب»؟','؟','،','.','؛','اكتب حوارًا من أربعة أسطر يستخدم علامة الاستفهام والفاصلة والنقطة في مواضعها.'),
(155,'كتابة تقرير عن رحلة أو زيارة أو فعالية','ما المعلومات الضرورية في تقرير عن رحلة مدرسية؟','الزمان والمكان والحدث والنتيجة','خيال الكاتب دون أحداث','الانطباعات بلا زمان أو مكان','عنوان لا صلة له بالنشاط','اكتب تقريرًا موجزًا عن زيارة تعليمية يبين أين ومتى حدثت ومن شارك وما النتيجة.'),
(166,'كتابة بطاقة الدعوة','أي عناصر يجب أن تتضمنها بطاقة دعوة مناسبة؟','المناسبة والزمان والمكان والجهة الداعية','لون البطاقة فقط','اسم شخص بلا موعد','معلومات غير متصلة بالحدث','صمم نص بطاقة دعوة إلى معرض قراءة، مع موعد ومكان وعبارة ترحيب واضحة.')
), scoped AS (SELECT l.id,qa.* FROM qa
JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
JOIN public.units u ON u.id=l.unit_id AND u.title='التعبير والكتابة' AND u.semester=1
JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=7
JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
WHERE length(coalesce(l.content,''))>400 AND l.content LIKE '%ضاديوم%'
)
INSERT INTO public.lesson_activities(lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'مهمة أداء يتابعها المعلم','writing','practice',s.practice,
jsonb_build_object('origin','DADYOOM_BH_G7_T1_ORIGINAL_ACTIVITY_COMPLETENESS_20261008','notMinistryBookText',true,'humanReviewRequired',true,'text',s.practice,'skillQualityAutoVerified',false),
jsonb_build_object('grading_mode','completion_only_reference','model_answer','تنفذ المهمة ثم تُراجع جودة الإنتاج الكتابي أو الخط على يد المعلم؛ الإكمال ليس تصحيحًا آليًا لمهارة الكتابة.'),2,5,true,true FROM scoped s
WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G7_T1_ORIGINAL_ACTIVITY_COMPLETENESS_20261008' AND a.activity_type='writing');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(11,'النكرة والمعرفة وأنواع المعارف','أي كلمة نكرة بين الخيارات؟','كتابٌ','الكتابُ','أحمدُ','هذا'),
(22,'من أنواع المعارف: الضمائر','أي كلمة من المعارف لأنها ضمير؟','هو','كتابٌ','قلمٌ','طائرٌ'),
(33,'من أنواع المعارف: أسماء الإشارة','أي كلمة اسم إشارة؟','هذا','قلمٌ','كتابٌ','سريعٌ'),
(34,'من أنواع المعارف: اسم العلم','أي كلمة اسم علم؟','مريم','مدينةٌ','طالبٌ','كتابٌ'),
(35,'من أنواع المعارف: المعرف بأل','أي كلمة معرفة بأل؟','البيتُ','بيتٌ','قلمٌ','طالبٌ'),
(46,'من أنواع المعارف: الأسماء الموصولة','أي كلمة اسم موصول للمفرد المذكر؟','الذي','هذا','هناك','أين'),
(47,'من أنواع المعارف: المضاف إلى معرفة','في «كتابُ الطالبِ»، لماذا يُعد «كتاب» معرفة من حيث الإضافة؟','لأنه مضاف إلى اسم معرفة','لأنه منون دائمًا','لأنه فعل ماض','لأنه حرف جر'),
(48,'الاسم النكرة المنادى','ما حكم المنادى النكرة غير المقصودة في «يا طالبًا، انتبه»؟','منصوب','مرفوع دائمًا','مجرور دائمًا','مجزوم'),
(59,'الإعراب والبناء: المبني من الأسماء','أي اسم مبني في أغلب استعمالاته؟','هذا','كتابٌ','طالبٌ','مجتهدٌ'),
(70,'أحوال بناء الفعل الماضي','على ماذا يُبنى الفعل الماضي «كتبَ» إذا لم يتصل به شيء؟','الفتح','الضم دائمًا','السكون دائمًا','حذف النون'),
(71,'أحوال بناء فعل الأمر','على ماذا يُبنى فعل الأمر «اكتبْ»؟','السكون','الفتح دائمًا','الكسرة','الألف'),
(72,'أحوال بناء الفعل المضارع','متى يُبنى المضارع على السكون؟','عند اتصاله بنون النسوة','عند سبقه بحرف جر','عند رفعه بالضمة','في كل الأحوال'),
(93,'علامات الإعراب الأصلية','ما علامة الرفع الأصلية للاسم المفرد المعرب؟','الضمة','الفتحة','الكسرة','السكون'),
(94,'علامات إعراب المثنى','بمَ يُرفع المثنى؟','الألف','الواو','الياء','الفتحة'),
(105,'جمع المذكر السالم','بمَ يُرفع جمع المذكر السالم؟','الواو','الألف','الياء','الكسرة'),
(116,'جمع المؤنث السالم','ما علامة نصب جمع المؤنث السالم؟','الكسرة نيابة عن الفتحة','الفتحة دائمًا','الواو','الألف'),
(117,'الأسماء الخمسة','ما علامة رفع «أبوك» حين تستوفي شروط الأسماء الخمسة؟','الواو','الياء','الألف','الفتحة'),
(128,'المبتدأ والخبر وأنواع الخبر','ما نوع الخبر في «الكتابُ فوقَ الطاولة»؟','شبه جملة ظرفية','اسم مفرد','جملة فعلية','جملة اسمية'),
(139,'الأفعال الناسخة: كان وأخواتها','أي جملة صحيحة في ضبط اسم كان وخبرها؟','كان الجوُّ معتدلًا','كان الجوَّ معتدلٌ','كان الجوُّ معتدلٌ','كان الجوَّ معتدلًا'),
(150,'الحروف الناسخة: إن وأخواتها','أي جملة صحيحة في ضبط اسم إن وخبرها؟','إنَّ العلمَ نافعٌ','إنَّ العلمُ نافعًا','إنَّ العلمُ نافعٌ','إنَّ العلمَ نافعًا')
), scoped AS (SELECT l.id,qa.* FROM qa
JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
JOIN public.units u ON u.id=l.unit_id AND u.title='القواعد والتراكيب — خطة الصف السابع الفصل الأول' AND u.semester=1
JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=7
JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
WHERE length(coalesce(l.content,''))>400 AND l.content LIKE '%ضاديوم%'
)
INSERT INTO public.lesson_activities(lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم أصلي من ضاديوم','multiple_choice','assessment',s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G7_T1_ORIGINAL_ACTIVITY_COMPLETENESS_20261008','notMinistryBookText',true,'bookFidelityNotAudited',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
jsonb_build_object('correct',s.correct),1,5,true,true FROM scoped s
WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G7_T1_ORIGINAL_ACTIVITY_COMPLETENESS_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(11,'رسم ألف التفريق بعد واو الجماعة','أي كلمة تتضمن ألفًا فارقة بعد واو الجماعة؟','كتبوا','يدعو','يسمو','يرجو'),
(33,'ما يلفظ ولا يكتب في أسماء الإشارة','أي اسم إشارة يُنطق فيه مد الألف بعد الهاء دون كتابة ألف مستقلة هناك؟','هذا','هناك','أولئك','أنا'),
(45,'الاسم المعرف بأل والمبدوء بلام','ما الصورة الإملائية الصحيحة للكلمة «ليل» بعد تعريفها بأل؟','الليل','اليل','الليلل','أليل'),
(56,'رسم الهمزة المتوسطة على النبرة','أي كلمة تتضمن همزة متوسطة على نبرة؟','بِئْر','بِأْر','بِؤْر','بِءْر'),
(68,'رسم الهمزة المتوسطة على الألف','أي رسم صحيح للفعل الذي يعني طلب المعرفة في صيغة الماضي؟','سَأَلَ','سَئَلَ','سَؤَلَ','سَءَلَ'),
(90,'رسم الهمزة المتوسطة الساكنة','على أي كرسي رُسمت الهمزة الساكنة في «رَأْس»؟','الألف','الواو','النبرة','السطر'),
(102,'ألف التفريق: تطبيق','ما الصياغة الصحيحة من «نجحو في الامتحان»؟','نجحوا في الامتحان','نجحو في الامتحان','نجحؤا في الامتحان','نجحاء في الامتحان'),
(114,'رسم الهمزة المتطرفة بعد مد بالألف','كيف تكتب الهمزة المتطرفة في «سماء»؟','على السطر','على النبرة','على واو','على ألف'),
(126,'مواضع حذف همزة ابن','أي كتابة صحيحة للاسم بين علمين يكون الثاني أبًا للأول وفق شروط الحذف؟','عمر بن الخطاب','عمر إبن الخطاب','عمر إِبن الخطاب','عمر أَبن الخطاب'),
(138,'رسم الهمزة المتطرفة','أي رسم صحيح لكلمة «جُزْء»؟','جزء','جزأ','جزؤ','جزئ'),
(150,'رسم الهمزة المتوسطة المكسورة','أي رسم صحيح للفعل «سُئِلَ»؟','سُئِلَ','سُؤِلَ','سُأِلَ','سُءِلَ')
), scoped AS (SELECT l.id,qa.* FROM qa
JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
JOIN public.units u ON u.id=l.unit_id AND u.title='الإملاء — الفصل الأول 2026–2027' AND u.semester=1
JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=7
JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
WHERE length(coalesce(l.content,''))>400 AND l.content LIKE '%ضاديوم%'
)
INSERT INTO public.lesson_activities(lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم أصلي من ضاديوم','multiple_choice','assessment',s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G7_T1_ORIGINAL_ACTIVITY_COMPLETENESS_20261008','notMinistryBookText',true,'bookFidelityNotAudited',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
jsonb_build_object('correct',s.correct),1,5,true,true FROM scoped s
WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G7_T1_ORIGINAL_ACTIVITY_COMPLETENESS_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,practice) AS (VALUES
(12,'الخط: كتابة حرف العين','أين يقع حرف العين في كلمة «شارع»؟','آخر الكلمة','أول الكلمة','وسط الكلمة','لا يوجد حرف عين','انسخ «عين، لعبة، شارع» بخط النسخ وأبرز اختلاف العين بحسب موقعه.'),
(34,'الخط: كتابة الحروف فوق السطر وتحته','كيف نراعي السطر الإرشادي عند الكتابة؟','نقارن امتداد أجزاء الحروف أعلى السطر وأسفله بنموذج صحيح','نضع كل الحروف بعيدًا عن السطر','نهمل ارتفاع أجزاء الحروف','نكتب دون تباعد بين الكلمات','انسخ «مدرسة، قلم» بخط النسخ على سطر إرشادي مع مراجعة ارتفاع الحروف وامتدادها.'),
(57,'الخط: كتابة حرف الواو','ما قاعدة اتصال الواو بالحرف الذي يأتي بعدها؟','لا تتصل الواو بما بعدها','تتصل الواو بما بعدها دائمًا','لها نقطتان فوقها','تحول الكلمات إلى جمع','انسخ «ورد، حلو، ضوء» مع الانتباه إلى عدم اتصال الواو بما بعدها.'),
(69,'الخط: كتابة حرف الفاء','كم نقطة فوق الفاء في خط النسخ المعتاد؟','نقطة واحدة','نقطتان','ثلاث نقاط','لا نقطة','اكتب «فجر، دفتر، حرف» مع ضبط نقطة الفاء وحجم الحرف.'),
(91,'الخط: كتابة حرف الدال','هل يتصل حرف الدال بما بعده؟','لا يتصل بما بعده','يتصل دائمًا بما بعده','يتغير إلى ذال عند الاتصال','يكتب بنقطتين','اكتب «دار، هدية، يد» بخط واضح، ولاحظ انقطاع الاتصال بعد الدال.'),
(103,'الخط: كتابة حرف القاف','كم نقطة فوق القاف في رسم النسخ المعتاد؟','نقطتان','نقطة واحدة','ثلاث نقاط','لا نقاط','اكتب «قمر، مقعد، طريق» وراجع نقطتي القاف واتصال الحرف.'),
(115,'الخط: كتابة حرف الغين','ما العلامة التي تميز الغين عن العين في الرسم؟','نقطة فوق الغين','نقطة أسفل الغين','نقطتان فوق الغين','نقطتان أسفل العين','انسخ «غزال، مغارة، فراغ» مع تحديد نقطة الغين في مواضع مختلفة.'),
(127,'الخط: كتابة حرف الجيم','أين تقع نقطة حرف الجيم؟','تحت الحرف','فوق الحرف','نقطتان فوقه','بلا نقطة','انسخ «جمل، نجم، برج» مع رسم الجيم ونقطته في مواقع مختلفة.'),
(139,'الخط: كتابة حرف الحاء','ما الفرق بين الحاء والخاء في الرسم المعتاد؟','الحاء بلا نقطة والخاء فوقها نقطة','الحاء فوقها نقطتان','الحاء تحتها نقطة','الحاء والخاء لهما النقاط نفسها','اكتب «حبل، نحلة، صباح» وحدد موضع الحاء وامتداده على السطر.'),
(151,'الخط: كتابة حرف الهاء','أي كلمة تنتهي بهاء وليست تاء مربوطة؟','وجه','مدرسة','شجرة','وردة','اكتب «هلال، نهر، وجه» ثم قارن الهاء بالتاء المربوطة في «مدرسة».')
), scoped AS (SELECT l.id,qa.* FROM qa
JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
JOIN public.units u ON u.id=l.unit_id AND u.title='الخط العربي — الفصل الأول 2026–2027' AND u.semester=1
JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=7
JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
WHERE length(coalesce(l.content,''))>400 AND l.content LIKE '%ضاديوم%'
)
INSERT INTO public.lesson_activities(lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم أصلي من ضاديوم','multiple_choice','assessment',s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G7_T1_ORIGINAL_ACTIVITY_COMPLETENESS_20261008','notMinistryBookText',true,'bookFidelityNotAudited',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
jsonb_build_object('correct',s.correct),1,5,true,true FROM scoped s
WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G7_T1_ORIGINAL_ACTIVITY_COMPLETENESS_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,practice) AS (VALUES
(12,'الخط: كتابة حرف العين','أين يقع حرف العين في كلمة «شارع»؟','آخر الكلمة','أول الكلمة','وسط الكلمة','لا يوجد حرف عين','انسخ «عين، لعبة، شارع» بخط النسخ وأبرز اختلاف العين بحسب موقعه.'),
(34,'الخط: كتابة الحروف فوق السطر وتحته','كيف نراعي السطر الإرشادي عند الكتابة؟','نقارن امتداد أجزاء الحروف أعلى السطر وأسفله بنموذج صحيح','نضع كل الحروف بعيدًا عن السطر','نهمل ارتفاع أجزاء الحروف','نكتب دون تباعد بين الكلمات','انسخ «مدرسة، قلم» بخط النسخ على سطر إرشادي مع مراجعة ارتفاع الحروف وامتدادها.'),
(57,'الخط: كتابة حرف الواو','ما قاعدة اتصال الواو بالحرف الذي يأتي بعدها؟','لا تتصل الواو بما بعدها','تتصل الواو بما بعدها دائمًا','لها نقطتان فوقها','تحول الكلمات إلى جمع','انسخ «ورد، حلو، ضوء» مع الانتباه إلى عدم اتصال الواو بما بعدها.'),
(69,'الخط: كتابة حرف الفاء','كم نقطة فوق الفاء في خط النسخ المعتاد؟','نقطة واحدة','نقطتان','ثلاث نقاط','لا نقطة','اكتب «فجر، دفتر، حرف» مع ضبط نقطة الفاء وحجم الحرف.'),
(91,'الخط: كتابة حرف الدال','هل يتصل حرف الدال بما بعده؟','لا يتصل بما بعده','يتصل دائمًا بما بعده','يتغير إلى ذال عند الاتصال','يكتب بنقطتين','اكتب «دار، هدية، يد» بخط واضح، ولاحظ انقطاع الاتصال بعد الدال.'),
(103,'الخط: كتابة حرف القاف','كم نقطة فوق القاف في رسم النسخ المعتاد؟','نقطتان','نقطة واحدة','ثلاث نقاط','لا نقاط','اكتب «قمر، مقعد، طريق» وراجع نقطتي القاف واتصال الحرف.'),
(115,'الخط: كتابة حرف الغين','ما العلامة التي تميز الغين عن العين في الرسم؟','نقطة فوق الغين','نقطة أسفل الغين','نقطتان فوق الغين','نقطتان أسفل العين','انسخ «غزال، مغارة، فراغ» مع تحديد نقطة الغين في مواضع مختلفة.'),
(127,'الخط: كتابة حرف الجيم','أين تقع نقطة حرف الجيم؟','تحت الحرف','فوق الحرف','نقطتان فوقه','بلا نقطة','انسخ «جمل، نجم، برج» مع رسم الجيم ونقطته في مواقع مختلفة.'),
(139,'الخط: كتابة حرف الحاء','ما الفرق بين الحاء والخاء في الرسم المعتاد؟','الحاء بلا نقطة والخاء فوقها نقطة','الحاء فوقها نقطتان','الحاء تحتها نقطة','الحاء والخاء لهما النقاط نفسها','اكتب «حبل، نحلة، صباح» وحدد موضع الحاء وامتداده على السطر.'),
(151,'الخط: كتابة حرف الهاء','أي كلمة تنتهي بهاء وليست تاء مربوطة؟','وجه','مدرسة','شجرة','وردة','اكتب «هلال، نهر، وجه» ثم قارن الهاء بالتاء المربوطة في «مدرسة».')
), scoped AS (SELECT l.id,qa.* FROM qa
JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
JOIN public.units u ON u.id=l.unit_id AND u.title='الخط العربي — الفصل الأول 2026–2027' AND u.semester=1
JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=7
JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
WHERE length(coalesce(l.content,''))>400 AND l.content LIKE '%ضاديوم%'
)
INSERT INTO public.lesson_activities(lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'مهمة أداء يتابعها المعلم','writing','practice',s.practice,
jsonb_build_object('origin','DADYOOM_BH_G7_T1_ORIGINAL_ACTIVITY_COMPLETENESS_20261008','notMinistryBookText',true,'humanReviewRequired',true,'text',s.practice,'skillQualityAutoVerified',false),
jsonb_build_object('grading_mode','completion_only_reference','model_answer','تنفذ المهمة ثم تُراجع جودة الإنتاج الكتابي أو الخط على يد المعلم؛ الإكمال ليس تصحيحًا آليًا لمهارة الكتابة.'),2,5,true,true FROM scoped s
WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G7_T1_ORIGINAL_ACTIVITY_COMPLETENESS_20261008' AND a.activity_type='writing');
