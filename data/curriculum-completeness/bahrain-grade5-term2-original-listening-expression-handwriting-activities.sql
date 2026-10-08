-- All activities below are ORIGINAL Dadyoom pedagogy. No claim of 2026/27 official textbook parity. Human review required for output quality.
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(1,'النفايات الإلكترونية','لماذا لم ترمِ الأسرة الهاتف القديم مع النفايات العادية؟','لحماية البيئة والبيانات عبر جهة مختصة','لتركه في الطريق','لمشاركة بياناته علنًا','لأن الهواتف لا تُعطل أبدًا'),
(2,'الفروسية','أي قيمة ذكرها مشرف مركز الخيل؟','الرفق بالحيوان والانضباط','تجاهل تعليمات المختص','الاقتراب من الخيل دون إذن','الاستغناء عن أدوات الحماية'),
(3,'الخديعة','ما الخطأ الذي ارتكبه عمر في النص المسموع؟','نقل خبرًا لم يتحقق من صحته','انتظر الإعلان الرسمي','سأل المعلم عن مصدر موثوق','اعتذر قبل إرسال الخبر')
), scoped AS (
SELECT l.id,qa.* FROM qa
JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
JOIN public.units u ON u.id=l.unit_id AND u.semester=2 AND u.title='الجزء الثاني — الاستماع'
JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=5 AND g.name_ar='الصف الخامس'
JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'اختبار فهم أصلي من ضاديوم','multiple_choice','assessment','بعد سماع النص الأصلي الذي يقرؤه المعلم مرتين: '||s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G5_T2_LISTEN_ORIGINAL_20261008','sourceStatus','BH_2025_2026_T2_HISTORICAL_UNVERIFIED_2026_2027','notOfficialBook',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3),'teacherReadAloudTwice',true,'officialAudioAvailable',false),
jsonb_build_object('correct',s.correct),1,5,true,true FROM scoped s
WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G5_T2_LISTEN_ORIGINAL_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,practice) AS (VALUES
(1,'التعبير الشفوي — الأسبوع الأول','بماذا اختتمت هند حديثها عن القراءة؟','بدعوة زملائها إلى القراءة','برفض مشاركة الأفكار','بذكر أسماء الكتب دون موضوع','بنسيان هدف حديثها','تحدث عن هوايتك في أربع جمل: مقدمة وسبب ومثال وخاتمة، ودوّن مخطط حديثك.'),
(2,'التعبير الشفوي — الأسبوع الثاني','أي قيمة شرحها سامي بعد اعتذاره لزميله؟','الصدق وإصلاح الخطأ','المبالغة في الأعذار','إخفاء الحقيقة دائمًا','السخرية من الزملاء','احك موقفًا يصلح فيه شخص خطأ ارتكبه، واذكر الدرس المستفاد منه باحترام.'),
(3,'التعبير الشفوي — الأسبوع الثالث','كيف وصف سالم مكتبة حيّه؟','مبنى هادئ برفوف منظمة وكتب للاستعارة','مكان خالٍ من الكتب','ملعب مزدحم','حديقة بها قوارب','صف مكانًا تحب زيارته بثلاث صفات محددة، ثم اشرح سبب اختيارك له.'),
(4,'التعبير الشفوي — الأسبوع الخامس','ما الإجراء الآمن الذي ذكرته فاطمة عند التخلص من جهاز قديم؟','حماية البيانات وتسليمه لجهة مختصة','رميه في أي حاوية بلا مراجعة','نشر الملفات المخزنة عليه','تفكيكه دون إشراف','اعرض نصيحتين عن حماية البيانات عند التخلص من جهاز إلكتروني مستعمل.'),
(5,'التعبير الشفوي — الأسبوع السادس','ما التسلسل الأفضل لسرد رحلة خالد؟','الزمان والمكان ثم ما شاهده ثم ما تعلمه','الخاتمة قبل المقدمة','تفاصيل غير متصلة بلا ترتيب','حذف المكان والزمان','احك رحلة قصيرة بترتيب: متى وأين، ماذا شاهدت، وماذا تعلمت؟'),
(6,'التعبير الشفوي — الأسبوع السابع','كيف تعامل ياسر مع رأي زميله المختلف؟','استمع إليه باحترام رغم اختلاف الهواية','سخر من اختياره','قاطعه قبل أن يبدأ','رفض سماع رأيه','اذكر هواية تفضلها مع سببين، ثم صغ جملة محترمة للتعليق على رأي مختلف.'),
(7,'التعبير الشفوي — الأسبوع التاسع','أي سلوكين اقترحتهما منى لتقليل هدر الماء؟','إغلاق الصنبور وإبلاغ الكبار عن التسرب','ترك الصنبور مفتوحًا','تجاهل التسرب','غسل الأشياء بلا حاجة','قدم إرشادين عمليين لتقليل هدر الماء في المنزل، مع مثال من الحياة اليومية.'),
(8,'التعبير الشفوي — الأسبوع الحادي عشر','لماذا فرقت مها بين ما تراه في الصورة وتوقعاتها؟','كي لا تعتبر التخمين حقيقة مؤكدة','لكي تختلق تفاصيل الصورة','لكي تمنع طرح الأسئلة','لأن الملاحظة والتخمين متطابقان','صف صورة متخيلة: جملتان عن مشاهدات مؤكدة وجملة تبدأ بـ«أتوقع».')
), scoped AS (
SELECT l.id,qa.* FROM qa
JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
JOIN public.units u ON u.id=l.unit_id AND u.semester=2 AND u.title='الجزء الثاني — التعبير الشفوي والكتابي'
JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=5 AND g.name_ar='الصف الخامس'
JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'اختبار فهم أصلي من ضاديوم','multiple_choice','assessment',s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G5_T2_ORAL_ORIGINAL_20261008','sourceStatus','BH_2025_2026_T2_HISTORICAL_UNVERIFIED_2026_2027','notOfficialBook',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
jsonb_build_object('correct',s.correct),1,5,true,true FROM scoped s
WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G5_T2_ORAL_ORIGINAL_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,practice) AS (VALUES
(1,'التعبير الشفوي — الأسبوع الأول','بماذا اختتمت هند حديثها عن القراءة؟','بدعوة زملائها إلى القراءة','برفض مشاركة الأفكار','بذكر أسماء الكتب دون موضوع','بنسيان هدف حديثها','تحدث عن هوايتك في أربع جمل: مقدمة وسبب ومثال وخاتمة، ودوّن مخطط حديثك.'),
(2,'التعبير الشفوي — الأسبوع الثاني','أي قيمة شرحها سامي بعد اعتذاره لزميله؟','الصدق وإصلاح الخطأ','المبالغة في الأعذار','إخفاء الحقيقة دائمًا','السخرية من الزملاء','احك موقفًا يصلح فيه شخص خطأ ارتكبه، واذكر الدرس المستفاد منه باحترام.'),
(3,'التعبير الشفوي — الأسبوع الثالث','كيف وصف سالم مكتبة حيّه؟','مبنى هادئ برفوف منظمة وكتب للاستعارة','مكان خالٍ من الكتب','ملعب مزدحم','حديقة بها قوارب','صف مكانًا تحب زيارته بثلاث صفات محددة، ثم اشرح سبب اختيارك له.'),
(4,'التعبير الشفوي — الأسبوع الخامس','ما الإجراء الآمن الذي ذكرته فاطمة عند التخلص من جهاز قديم؟','حماية البيانات وتسليمه لجهة مختصة','رميه في أي حاوية بلا مراجعة','نشر الملفات المخزنة عليه','تفكيكه دون إشراف','اعرض نصيحتين عن حماية البيانات عند التخلص من جهاز إلكتروني مستعمل.'),
(5,'التعبير الشفوي — الأسبوع السادس','ما التسلسل الأفضل لسرد رحلة خالد؟','الزمان والمكان ثم ما شاهده ثم ما تعلمه','الخاتمة قبل المقدمة','تفاصيل غير متصلة بلا ترتيب','حذف المكان والزمان','احك رحلة قصيرة بترتيب: متى وأين، ماذا شاهدت، وماذا تعلمت؟'),
(6,'التعبير الشفوي — الأسبوع السابع','كيف تعامل ياسر مع رأي زميله المختلف؟','استمع إليه باحترام رغم اختلاف الهواية','سخر من اختياره','قاطعه قبل أن يبدأ','رفض سماع رأيه','اذكر هواية تفضلها مع سببين، ثم صغ جملة محترمة للتعليق على رأي مختلف.'),
(7,'التعبير الشفوي — الأسبوع التاسع','أي سلوكين اقترحتهما منى لتقليل هدر الماء؟','إغلاق الصنبور وإبلاغ الكبار عن التسرب','ترك الصنبور مفتوحًا','تجاهل التسرب','غسل الأشياء بلا حاجة','قدم إرشادين عمليين لتقليل هدر الماء في المنزل، مع مثال من الحياة اليومية.'),
(8,'التعبير الشفوي — الأسبوع الحادي عشر','لماذا فرقت مها بين ما تراه في الصورة وتوقعاتها؟','كي لا تعتبر التخمين حقيقة مؤكدة','لكي تختلق تفاصيل الصورة','لكي تمنع طرح الأسئلة','لأن الملاحظة والتخمين متطابقان','صف صورة متخيلة: جملتان عن مشاهدات مؤكدة وجملة تبدأ بـ«أتوقع».')
), scoped AS (
SELECT l.id,qa.* FROM qa
JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
JOIN public.units u ON u.id=l.unit_id AND u.semester=2 AND u.title='الجزء الثاني — التعبير الشفوي والكتابي'
JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=5 AND g.name_ar='الصف الخامس'
JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'مهمة أصلية تحتاج تقويم المعلم','speaking','practice',s.practice,
jsonb_build_object('origin','DADYOOM_BH_G5_T2_ORAL_ORIGINAL_20261008','sourceStatus','BH_2025_2026_T2_HISTORICAL_UNVERIFIED_2026_2027','notOfficialBook',true,'reviewStatus','required','humanReviewRequired',true,'text',s.practice,'skillQualityAutoVerified',false),
jsonb_build_object('grading_mode','completion_only_reference','model_answer','يلزم أن يراجع المعلم صحة الإجابة ومهارة المتحدث أو الخط والكتابة؛ إكمال النشاط ليس تقييمًا آليًا لجودة الأداء.'),2,5,true,true
FROM scoped s
WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G5_T2_ORAL_ORIGINAL_20261008' AND a.activity_type='speaking');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,practice) AS (VALUES
(101,'المذكرات اليومية — أكتشف','أي ثلاثة عناصر تظهر في المذكرة التي كتبتها دانة؟','الوقت والحدث والشعور','العنوان فقط','المكان من دون الحدث','الرأي دون ذكر ما حدث','اكتب يومية أصلية من أربع جمل تتضمن وقتًا وحدثًا وشعورًا.'),
(102,'المذكرات اليومية — أتدرب','أين ذهبت كاتبة المذكرة مع أمها يوم الجمعة؟','المكتبة','المطار','الشاطئ','الملعب','اكتب مذكرة عن زيارة قصيرة تذكر فيها اليوم ومكان الزيارة وما تعلمته.'),
(103,'المذكرات اليومية — أنتج','أي ضمير يناسب كتابة المذكرات الشخصية؟','ضمير المتكلم','ضمير الغائب دائمًا','ضمير المخاطب فقط','ضمير الجمع فقط','اكتب يومية شخصية قصيرة بصيغة المتكلم، تتضمن الحدث والشعور والخاتمة.'),
(104,'تثرية النص السردي بالحوار — أكتشف','ما المشكلة التي ظهرت في حوار سلمى وهند؟','فقدان بطاقة المكتبة','نسيان موعد الحافلة','ضياع كرة','تأخر بدء المباراة','أنشئ حوارًا قصيرًا يكشف مشكلة ثم يقترح حلًا مهذبًا.'),
(105,'تثرية النص السردي بالحوار — أتدرب','ما السؤال الذي وجهته مريم إلى صديقتها؟','هل قرأتِ الكتاب؟','متى تبدأ المباراة؟','أين حقيبتي؟','هل سافرنا أمس؟','حوّل جملة سردية عن استعارة كتاب إلى تبادل حواري من أربعة أسطر.'),
(106,'تثرية النص السردي بالحوار — أنتج','ماذا سأل الطالب الجديد المعلم عند دخوله الصف؟','أين أجلس؟','هل انتهت الرحلة؟','أين القلم الأحمر؟','لماذا تأخرت الطائرة؟','اكتب حوارًا من أربعة أسطر يُظهر استقبال طالب جديد ومساعدته في الصف.'),
(107,'تلخيص قصة — أكتشف','ما العناصر الأساسية التي احتفظ بها ملخص قصة سالم؟','زيارة المكتبة واستعارة الكتاب وإعادته','لون الحقيبة وحده','جميع الأوصاف الثانوية','أسماء غير واردة في القصة','لخص قصة قصيرة في ثلاث جمل تذكر الحدث الرئيس وتسلسله.'),
(108,'تلخيص قصة — أتدرب','ما المشكلة الأساسية في قصة القطة الصغيرة؟','العثور على قطة قرب باب المنزل والحاجة إلى مساعدتها','ضياع كتاب من المكتبة','انقطاع الكهرباء','فقدان بطاقة مدرسية','لخص القصة الأصلية عن القطة بذكر الشخصية والمشكلة والحل من غير تفاصيل زائدة.'),
(109,'تلخيص قصة — أنتج','ماذا فعل فريق الزراعة بعد غرس الشتلة؟','اعتنى بها حتى كبرت','تركها من دون متابعة','اقتلعها فورًا','أهمل سقيها متعمدًا','لخص قصة زراعة شتلة في ثلاث جمل متتابعة.'),
(110,'بطاقة الدعوة — أكتشف','أين يقام معرض القراءة المذكور في بطاقة الدعوة؟','مكتبة المدرسة','مطار البحرين','قاعة الرياضة','شاطئ البحر','اكتب بطاقة دعوة لمعرض قراءة موضحًا اسم المناسبة والوقت والمكان.'),
(111,'بطاقة الدعوة — أتدرب','ما المعلومات الضرورية في بطاقة الدعوة؟','اسم المناسبة والموعد والمكان والجهة الداعية','لون الورقة فقط','اسم المدعو دون موعد','عبارة ترحيب دون مكان','اكتب بطاقة دعوة مدرسية متكاملة بمناسبة وموعد ومكان وجهة داعية.'),
(112,'بطاقة الدعوة — أنتج','ما فائدة عبارة الترحيب في بطاقة الدعوة؟','دعوة المتلقي بلغة مهذبة وواضحة','إخفاء موعد المناسبة','تغيير مكان الفعالية','ملء المساحة بكلمات لا معنى لها','أنشئ بطاقة دعوة لأسرتك إلى فعالية مدرسية مع ترحيب وموعد ومكان واضح.')
), scoped AS (
SELECT l.id,qa.* FROM qa
JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
JOIN public.units u ON u.id=l.unit_id AND u.semester=2 AND u.title='الجزء الثاني — التعبير الشفوي والكتابي'
JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=5 AND g.name_ar='الصف الخامس'
JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'اختبار فهم أصلي من ضاديوم','multiple_choice','assessment',s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G5_T2_WRITE_ORIGINAL_20261008','sourceStatus','BH_2025_2026_T2_HISTORICAL_UNVERIFIED_2026_2027','notOfficialBook',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
jsonb_build_object('correct',s.correct),1,5,true,true FROM scoped s
WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G5_T2_WRITE_ORIGINAL_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,practice) AS (VALUES
(101,'المذكرات اليومية — أكتشف','أي ثلاثة عناصر تظهر في المذكرة التي كتبتها دانة؟','الوقت والحدث والشعور','العنوان فقط','المكان من دون الحدث','الرأي دون ذكر ما حدث','اكتب يومية أصلية من أربع جمل تتضمن وقتًا وحدثًا وشعورًا.'),
(102,'المذكرات اليومية — أتدرب','أين ذهبت كاتبة المذكرة مع أمها يوم الجمعة؟','المكتبة','المطار','الشاطئ','الملعب','اكتب مذكرة عن زيارة قصيرة تذكر فيها اليوم ومكان الزيارة وما تعلمته.'),
(103,'المذكرات اليومية — أنتج','أي ضمير يناسب كتابة المذكرات الشخصية؟','ضمير المتكلم','ضمير الغائب دائمًا','ضمير المخاطب فقط','ضمير الجمع فقط','اكتب يومية شخصية قصيرة بصيغة المتكلم، تتضمن الحدث والشعور والخاتمة.'),
(104,'تثرية النص السردي بالحوار — أكتشف','ما المشكلة التي ظهرت في حوار سلمى وهند؟','فقدان بطاقة المكتبة','نسيان موعد الحافلة','ضياع كرة','تأخر بدء المباراة','أنشئ حوارًا قصيرًا يكشف مشكلة ثم يقترح حلًا مهذبًا.'),
(105,'تثرية النص السردي بالحوار — أتدرب','ما السؤال الذي وجهته مريم إلى صديقتها؟','هل قرأتِ الكتاب؟','متى تبدأ المباراة؟','أين حقيبتي؟','هل سافرنا أمس؟','حوّل جملة سردية عن استعارة كتاب إلى تبادل حواري من أربعة أسطر.'),
(106,'تثرية النص السردي بالحوار — أنتج','ماذا سأل الطالب الجديد المعلم عند دخوله الصف؟','أين أجلس؟','هل انتهت الرحلة؟','أين القلم الأحمر؟','لماذا تأخرت الطائرة؟','اكتب حوارًا من أربعة أسطر يُظهر استقبال طالب جديد ومساعدته في الصف.'),
(107,'تلخيص قصة — أكتشف','ما العناصر الأساسية التي احتفظ بها ملخص قصة سالم؟','زيارة المكتبة واستعارة الكتاب وإعادته','لون الحقيبة وحده','جميع الأوصاف الثانوية','أسماء غير واردة في القصة','لخص قصة قصيرة في ثلاث جمل تذكر الحدث الرئيس وتسلسله.'),
(108,'تلخيص قصة — أتدرب','ما المشكلة الأساسية في قصة القطة الصغيرة؟','العثور على قطة قرب باب المنزل والحاجة إلى مساعدتها','ضياع كتاب من المكتبة','انقطاع الكهرباء','فقدان بطاقة مدرسية','لخص القصة الأصلية عن القطة بذكر الشخصية والمشكلة والحل من غير تفاصيل زائدة.'),
(109,'تلخيص قصة — أنتج','ماذا فعل فريق الزراعة بعد غرس الشتلة؟','اعتنى بها حتى كبرت','تركها من دون متابعة','اقتلعها فورًا','أهمل سقيها متعمدًا','لخص قصة زراعة شتلة في ثلاث جمل متتابعة.'),
(110,'بطاقة الدعوة — أكتشف','أين يقام معرض القراءة المذكور في بطاقة الدعوة؟','مكتبة المدرسة','مطار البحرين','قاعة الرياضة','شاطئ البحر','اكتب بطاقة دعوة لمعرض قراءة موضحًا اسم المناسبة والوقت والمكان.'),
(111,'بطاقة الدعوة — أتدرب','ما المعلومات الضرورية في بطاقة الدعوة؟','اسم المناسبة والموعد والمكان والجهة الداعية','لون الورقة فقط','اسم المدعو دون موعد','عبارة ترحيب دون مكان','اكتب بطاقة دعوة مدرسية متكاملة بمناسبة وموعد ومكان وجهة داعية.'),
(112,'بطاقة الدعوة — أنتج','ما فائدة عبارة الترحيب في بطاقة الدعوة؟','دعوة المتلقي بلغة مهذبة وواضحة','إخفاء موعد المناسبة','تغيير مكان الفعالية','ملء المساحة بكلمات لا معنى لها','أنشئ بطاقة دعوة لأسرتك إلى فعالية مدرسية مع ترحيب وموعد ومكان واضح.')
), scoped AS (
SELECT l.id,qa.* FROM qa
JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
JOIN public.units u ON u.id=l.unit_id AND u.semester=2 AND u.title='الجزء الثاني — التعبير الشفوي والكتابي'
JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=5 AND g.name_ar='الصف الخامس'
JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'مهمة أصلية تحتاج تقويم المعلم','writing','practice',s.practice,
jsonb_build_object('origin','DADYOOM_BH_G5_T2_WRITE_ORIGINAL_20261008','sourceStatus','BH_2025_2026_T2_HISTORICAL_UNVERIFIED_2026_2027','notOfficialBook',true,'reviewStatus','required','humanReviewRequired',true,'text',s.practice,'skillQualityAutoVerified',false),
jsonb_build_object('grading_mode','completion_only_reference','model_answer','يلزم أن يراجع المعلم صحة الإجابة ومهارة المتحدث أو الخط والكتابة؛ إكمال النشاط ليس تقييمًا آليًا لجودة الأداء.'),2,5,true,true
FROM scoped s
WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G5_T2_WRITE_ORIGINAL_20261008' AND a.activity_type='writing');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,practice) AS (VALUES
(1,'حرف (ض)','أين تقع نقطة حرف الضاد في الرسم المعتاد؟','فوق الحرف','تحت الحرف','لا توجد نقطة','نقطتان فوقه','انسخ «ضوء، أرض، مريض» وراجع النقطة واتصال الضاد ثم اكتب مثالًا جديدًا.'),
(2,'حرف (ط)','أي كلمة تبدأ بحرف الطاء؟','طائر','ظاهر','ضروري','صباح','انسخ «طائر، مطر، خيط» مع تمييز الطاء عن الظاء في سطر واضح.'),
(3,'حرف (ظ)','ما الفرق بين الطاء والظاء في الرسم المعتاد؟','وجود نقطة فوق الظاء','وجود نقطتين تحت الظاء','وجود نقطة تحت الطاء','زيادة حرف الألف','انسخ «ظرف، نظيف، حظ» مع تحديد نقطة الظاء.'),
(4,'حرف (ع)','أين يقع حرف العين في «شارع»؟','في آخر الكلمة','في أول الكلمة','في وسط الكلمة','لا يوجد حرف عين','انسخ «عين، لعبة، شارع» واضبط شكل العين في المواقع المختلفة.'),
(5,'حرف (ف)','كم نقطة فوق الفاء في الرسم المعتاد؟','نقطة واحدة','نقطتان','ثلاث نقاط','لا نقاط','اكتب «فم، دفتر، حرف» مع الحفاظ على النقطة الواحدة.'),
(6,'حرف (ق)','كم نقطة فوق القاف في خط النسخ الشائع؟','نقطتان','نقطة واحدة','ثلاث نقاط','لا نقاط','انسخ «قمر، مقعد، طريق» ثم راجع نقطتي القاف.'),
(7,'حرف (ك)','أين يقع حرف الكاف في كلمة «سمك»؟','آخر الكلمة','أول الكلمة','وسط الكلمة','غير موجود','اكتب «كتاب، مكتب، سمك» مع توضيح مواضع الكاف.'),
(8,'حرف (ل)','أي كلمة من أمثلة الدرس تنتهي بحرف اللام؟','جبل','ليل','ملعب','لعبة','انسخ «ليل، ملعب، جبل» مع متابعة طول اللام واتصاله.'),
(9,'حرف (م)','أين يقع حرف الميم في «قلم»؟','آخر الكلمة','أول الكلمة','وسط الكلمة','لا يوجد','انسخ «مدرسة، سماء، قلم» وأبرز حرف الميم حسب موقعه.'),
(10,'حرف (ن)','أين يقع حرف النون في كلمة «لون»؟','آخر الكلمة','أول الكلمة','وسط الكلمة','لا يوجد','انسخ «نور، منزل، لون» وراجع النقطة فوق النون.'),
(11,'حرف (هـ)','أي كلمة تنتهي بحرف الهاء لا التاء المربوطة؟','وجه','شجرة','مدرسة','وردة','انسخ «هدية، نهر، وجه» مع المقارنة بين الهاء والتاء المربوطة.'),
(12,'حرفا (و) و(ي)','أي كلمة تبدأ بحرف الواو؟','ورد','يد','كرسي','حلو','انسخ «ورد، حلو، يد، كرسي» وقارن اتصال الواو وشكل الياء.')
), scoped AS (
SELECT l.id,qa.* FROM qa
JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
JOIN public.units u ON u.id=l.unit_id AND u.semester=2 AND u.title='الجزء الثاني — الخط العربي'
JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=5 AND g.name_ar='الصف الخامس'
JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'اختبار فهم أصلي من ضاديوم','multiple_choice','assessment',s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G5_T2_HAND_ORIGINAL_20261008','sourceStatus','BH_2025_2026_T2_HISTORICAL_UNVERIFIED_2026_2027','notOfficialBook',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
jsonb_build_object('correct',s.correct),1,5,true,true FROM scoped s
WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G5_T2_HAND_ORIGINAL_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,practice) AS (VALUES
(1,'حرف (ض)','أين تقع نقطة حرف الضاد في الرسم المعتاد؟','فوق الحرف','تحت الحرف','لا توجد نقطة','نقطتان فوقه','انسخ «ضوء، أرض، مريض» وراجع النقطة واتصال الضاد ثم اكتب مثالًا جديدًا.'),
(2,'حرف (ط)','أي كلمة تبدأ بحرف الطاء؟','طائر','ظاهر','ضروري','صباح','انسخ «طائر، مطر، خيط» مع تمييز الطاء عن الظاء في سطر واضح.'),
(3,'حرف (ظ)','ما الفرق بين الطاء والظاء في الرسم المعتاد؟','وجود نقطة فوق الظاء','وجود نقطتين تحت الظاء','وجود نقطة تحت الطاء','زيادة حرف الألف','انسخ «ظرف، نظيف، حظ» مع تحديد نقطة الظاء.'),
(4,'حرف (ع)','أين يقع حرف العين في «شارع»؟','في آخر الكلمة','في أول الكلمة','في وسط الكلمة','لا يوجد حرف عين','انسخ «عين، لعبة، شارع» واضبط شكل العين في المواقع المختلفة.'),
(5,'حرف (ف)','كم نقطة فوق الفاء في الرسم المعتاد؟','نقطة واحدة','نقطتان','ثلاث نقاط','لا نقاط','اكتب «فم، دفتر، حرف» مع الحفاظ على النقطة الواحدة.'),
(6,'حرف (ق)','كم نقطة فوق القاف في خط النسخ الشائع؟','نقطتان','نقطة واحدة','ثلاث نقاط','لا نقاط','انسخ «قمر، مقعد، طريق» ثم راجع نقطتي القاف.'),
(7,'حرف (ك)','أين يقع حرف الكاف في كلمة «سمك»؟','آخر الكلمة','أول الكلمة','وسط الكلمة','غير موجود','اكتب «كتاب، مكتب، سمك» مع توضيح مواضع الكاف.'),
(8,'حرف (ل)','أي كلمة من أمثلة الدرس تنتهي بحرف اللام؟','جبل','ليل','ملعب','لعبة','انسخ «ليل، ملعب، جبل» مع متابعة طول اللام واتصاله.'),
(9,'حرف (م)','أين يقع حرف الميم في «قلم»؟','آخر الكلمة','أول الكلمة','وسط الكلمة','لا يوجد','انسخ «مدرسة، سماء، قلم» وأبرز حرف الميم حسب موقعه.'),
(10,'حرف (ن)','أين يقع حرف النون في كلمة «لون»؟','آخر الكلمة','أول الكلمة','وسط الكلمة','لا يوجد','انسخ «نور، منزل، لون» وراجع النقطة فوق النون.'),
(11,'حرف (هـ)','أي كلمة تنتهي بحرف الهاء لا التاء المربوطة؟','وجه','شجرة','مدرسة','وردة','انسخ «هدية، نهر، وجه» مع المقارنة بين الهاء والتاء المربوطة.'),
(12,'حرفا (و) و(ي)','أي كلمة تبدأ بحرف الواو؟','ورد','يد','كرسي','حلو','انسخ «ورد، حلو، يد، كرسي» وقارن اتصال الواو وشكل الياء.')
), scoped AS (
SELECT l.id,qa.* FROM qa
JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
JOIN public.units u ON u.id=l.unit_id AND u.semester=2 AND u.title='الجزء الثاني — الخط العربي'
JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=5 AND g.name_ar='الصف الخامس'
JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'مهمة أصلية تحتاج تقويم المعلم','writing','practice',s.practice,
jsonb_build_object('origin','DADYOOM_BH_G5_T2_HAND_ORIGINAL_20261008','sourceStatus','BH_2025_2026_T2_HISTORICAL_UNVERIFIED_2026_2027','notOfficialBook',true,'reviewStatus','required','humanReviewRequired',true,'text',s.practice,'skillQualityAutoVerified',false),
jsonb_build_object('grading_mode','completion_only_reference','model_answer','يلزم أن يراجع المعلم صحة الإجابة ومهارة المتحدث أو الخط والكتابة؛ إكمال النشاط ليس تقييمًا آليًا لجودة الأداء.'),2,5,true,true
FROM scoped s
WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G5_T2_HAND_ORIGINAL_20261008' AND a.activity_type='writing');
