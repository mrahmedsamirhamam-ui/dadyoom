-- Dadyoom-original grade-seven term-two exercises. Historical 2025/26 topics, NOT official 2026/27 textbook texts.
-- Preserve existing lessons and never claim content from the Ministry. Unique origin makes migration idempotent.
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(1,'هذه أمنيتي','كيف تدربت سلمى قبل أن تقدم عرضها أمام الصف؟','بدأت بالقراءة أمام أسرتها ثم جربت أمام صديقة','انتظرت حتى يوم العرض دون تدريب','امتنعت عن قراءة النص','رفضت أي مساعدة'),
(2,'الأيدي الماهرة','ما التصرف الذي يدل على الدقة في عمل راشد اليدوي؟','راجع أبعاد القطع قبل تركيبها','جمع القطع دون قياس','استخدم أدوات خطرة دون إشراف','أهمل مراجعة المجسم'),
(3,'الفردوس الأخضر','كيف حافظ الطلاب على الحديقة في النص الداعم؟','لم يقطعوا الأزهار ولم يزعجوا الحيوانات','قطعوا أزهارها تذكارًا','ألقوا المخلفات في الممرات','أزعجوا الطيور عمدًا'),
(4,'قالت لي جدتي','كيف تأكدت نورة من فهم ذكريات جدتها؟','سألت عن التفاصيل وسجلت المفردات ثم عرضت فهمها','نقلت الأقوال دون الاستماع','قضت الوقت في التخمين','رفضت توضيح الكلمات'),
(5,'الأم','كيف عبرت مريم عن محبتها لأمها؟','ببطاقة شكر ومساعدة في ترتيب ركن القراءة','بإهمال مسؤوليات المنزل','بترك الكتب مبعثرة','بالكلمات الجارحة'),
(6,'المسيرة','ما الذي ساعد الطلاب على تنظيم مسيرة مشي آمنة؟','تحديد المسار ونقاط الراحة والمهام بإشراف المعلمين','الانطلاق دون خطة','تجاهل تعليمات السلامة','اختيار طريق غير آمن'),
(7,'انتبه... التلوث يغزو بيتك','ما الاقتراح الآمن للتعامل مع البطاريات المستعملة؟','السؤال عن نقاط جمعها المختصة','رميها مع كل المخلفات دون سؤال','فتحها دون أدوات حماية','حرقها في المنزل'),
(8,'الشباب أمل الغد','كيف حسنت الطالبات برنامج مبادرة تبادل الكتب؟','استطلعن اهتمامات المشاركين وعدلن الأنشطة','رفضن رأي المشاركين','أوقفن النشاط دون مراجعة','لم يضعن خطة'),
(9,'مراجعة عامة لدروس الفصل الثاني','ما حرف العطف الذي ربط الأحداث في «نظموا المكتبة ثم كتبوا تقريرًا»؟','ثم','عن','في','إلى')
), scoped AS (SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — القراءة والنصوص' AND u.semester=2
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=7
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>500 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities(lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم أصلي — القراءة والنصوص','multiple_choice','assessment',s.prompt,
 jsonb_build_object('origin','DADYOOM_BH_G7_T2_ORIGINAL_ACTIVITIES_20261008','sourceStatus','HISTORICAL_2025_2026_UNVERIFIED_2026_2027','notOfficialBook',true,'reviewStatus','required',
 'options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
 jsonb_build_object('correct',s.correct),1,5,true,true FROM scoped s
 WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G7_T2_ORIGINAL_ACTIVITIES_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(1,'الفاعل: مواضع إفراد الفعل وتأنيثه وجوبًا مع الفاعل','أي جملة فصيحة إذا تقدم الفعل على فاعل ظاهر مثنى؟','حضرَ الطالبانِ','حضرا الطالبانِ','حضروا الطالبانِ','حضرت الطالبانِ'),
(2,'نائب الفاعل: مواضع إفراد الفعل وتأنيثه وجوبًا مع نائب الفاعل','ما نائب الفاعل في «فُتِحَ البابُ»؟','البابُ','فُتِحَ','الفتحة','حرف جر'),
(3,'إعراب الفعل المضارع المعتل الآخر في حالتي الرفع والنصب','ما علامة رفع «يسعى» في الجملة «هو يسعى إلى الخير»؟','الضمة المقدرة على الألف','الضمة الظاهرة على الألف','حذف حرف العلة','ثبوت النون'),
(4,'جزم الفعل المضارع المعتل الآخر','أي صيغة صحيحة للجزم بـ«لم» من الفعل «يدعو»؟','لم يدعُ','لم يدعو','لم يدعوا','لم يدعون'),
(5,'الأفعال الخمسة','بمَ تُرفع الأفعال الخمسة؟','بثبوت النون','بحذف النون','بالفتحة دائمًا','بالكسرة'),
(6,'الفعل المجرد والفعل المزيد','أي فعل ثلاثي مجرد من هذه الكلمات؟','كتبَ','كاتَبَ','استكتبَ','أكرمَ'),
(7,'الميزان الصرفي','ما الوزن الصرفي للفعل «كَاتَبَ»؟','فَاعَلَ','فَعَلَ','استفعل','تفاعل'),
(8,'خطوات البحث في المعجم','ما الجذر الذي نبحث عنه لكلمة «مكتبة» في معجم الجذور؟','ك ت ب','م ك ت','ت ب ة','ك ب ة'),
(9,'أدوات الاستفهام','ما أداة الاستفهام المناسبة للسؤال عن المكان؟','أين','متى','من','كم'),
(10,'جمع التكسير','أي جمع يُعد جمع تكسير؟','كتب','معلمون','معلمات','عاملات')
), scoped AS (SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — القواعد والتراكيب' AND u.semester=2
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=7
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>500 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities(lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم أصلي — القواعد والتراكيب','multiple_choice','assessment',s.prompt,
 jsonb_build_object('origin','DADYOOM_BH_G7_T2_ORIGINAL_ACTIVITIES_20261008','sourceStatus','HISTORICAL_2025_2026_UNVERIFIED_2026_2027','notOfficialBook',true,'reviewStatus','required',
 'options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
 jsonb_build_object('correct',s.correct),1,5,true,true FROM scoped s
 WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G7_T2_ORIGINAL_ACTIVITIES_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(1,'علامات الترقيم: الفاصلة والنقطة','أي علامة توضع عادة في نهاية الجملة التامة الخبرية؟','النقطة (.)','الفاصلة (،)','النقطتان (:)','علامة الاستفهام (؟)'),
(2,'علامات الترقيم: علامة الاستفهام والفاصلة المنقوطة','ما العلامة المناسبة في نهاية سؤال «أين الكتاب»؟','؟','.','،','؛'),
(3,'كتابة التاء في آخر جمع الاسم المنقوص','ما الجمع الصحيح لكلمة «قاضٍ» في العربية؟','قضاة','قاضات','قاضونَة','قاضيةون'),
(4,'التنوين بالفتح: رسم ألف التنوين','كيف يُكتب تنوين الفتح في كلمة «كتاب» منصوبة نكرة؟','كتابًا','كتابٌ','كتابٍ','كتابَ'),
(5,'رسم الهمزة المتوسطة المفتوحة وما قبلها مد بالألف','أي كلمة رسمت فيها الهمزة المفتوحة بعد ألف مد على السطر؟','قراءة','قرأة','قرائة','قرؤة'),
(6,'الياء والألف المقصورة آخر الكلمة','أي كلمة تدل على الفتى وتنتهي بألف مقصورة؟','فتى','فتي','فتو','فتأ'),
(7,'رسم الهمزة المتوسطة على الواو (1)','أي رسم صحيح للكلمة الدالة على الشخص الذي يصدق؟','مؤمن','مأمن','مئمن','مءمن'),
(8,'رسم الهمزة المتوسطة على الواو (2)','أي كلمة كُتبت همزتها المتوسطة على الواو على نحو صحيح؟','رؤوس','رأوس','رئوس','رءوس')
), scoped AS (SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — الإملاء' AND u.semester=2
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=7
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>500 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities(lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم أصلي — الإملاء','multiple_choice','assessment',s.prompt,
 jsonb_build_object('origin','DADYOOM_BH_G7_T2_ORIGINAL_ACTIVITIES_20261008','sourceStatus','HISTORICAL_2025_2026_UNVERIFIED_2026_2027','notOfficialBook',true,'reviewStatus','required',
 'options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
 jsonb_build_object('correct',s.correct),1,5,true,true FROM scoped s
 WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G7_T2_ORIGINAL_ACTIVITIES_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,task) AS (VALUES
(1,'كتابة قصة تتضمن حوارًا بين طرفين','أي عنصر يوضح المتكلم في قصة حوارية؟','إسناد الكلام إلى الشخصية بوضوح','ترك كل الأقوال بلا متحدث','حذف الحوار كاملًا','سرد أحداث غير مرتبطة','اكتب قصة قصيرة ذات بداية ومشكلة وحل، وأدخل حوارًا من أربعة أسطر بين شخصيتين مع علامات ترقيم مناسبة.'),
(2,'تلخيص قصة قصيرة','ما الذي يُحافظ عليه الملخص الجيد عادةً؟','الأحداث الأساسية بترتيب واضح','كل الأوصاف الثانوية حرفيًا','تفاصيل لم ترد بالقصة','نسخ النص كله دون اختصار','لخص قصة قصيرة أصلية في أربع جمل مع توضيح الشخصية والحدث والحل.'),
(3,'كتابة رسالة تتضمن سرد أحداث (1)','ما الذي يليق ببداية رسالة شخصية تحكي حدثًا؟','تحية مناسبة وتمهيد للحدث','حذف اسم المرسل إليه دائمًا','الانتقال إلى النهاية مباشرة','ترك الفكرة دون سياق','اكتب بداية رسالة شخصية تتضمن تحية وجملتين عن حدث مدرسي.'),
(4,'كتابة رسالة تتضمن سرد أحداث (2)','كيف نختم رسالة سردية بعد عرض الأحداث؟','خاتمة تلخص الأثر مع توقيع مناسب','بإضافة حدث غير متعلق','من دون أي جملة ختامية','بتكرار أول الرسالة فقط','أكمل رسالة عن رحلة مدرسية بجمل مرتبة وخاتمة وتوقيع مناسبين.'),
(5,'كتابة قصة تتضمن سردًا غير خطي','ما أسلوب السرد غير الخطي في القصة؟','الانتقال إلى ذكرى سابقة ثم العودة إلى الزمن الحالي','الالتزام بترتيب واحد دائمًا','حذف العلاقة بين الأحداث','عرض أسماء بلا قصة','اكتب فقرة سردية تبدأ بالحاضر ثم تعود إلى ذكرى سابقة باستخدام عبارة «تذكرت يوم...».'),
(6,'كتابة الرسالة الرسمية','ما أبرز ما يميز الرسالة الرسمية؟','موضوع واضح وتحية ملائمة ولغة مهذبة','ألفاظ عامية مسيئة','عدم تحديد الجهة المرسل إليها','خاتمة بلا غرض','اكتب رسالة رسمية قصيرة إلى إدارة المدرسة تقترح نشاطًا قرائيًا، مع موضوع واضح وخاتمة مناسبة.')
), scoped AS (SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — الإنتاج الكتابي' AND u.semester=2
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=7
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>500 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities(lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم أصلي — الإنتاج الكتابي','multiple_choice','assessment',s.prompt,
 jsonb_build_object('origin','DADYOOM_BH_G7_T2_ORIGINAL_ACTIVITIES_20261008','sourceStatus','HISTORICAL_2025_2026_UNVERIFIED_2026_2027','notOfficialBook',true,'reviewStatus','required',
 'options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
 jsonb_build_object('correct',s.correct),1,5,true,true FROM scoped s
 WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G7_T2_ORIGINAL_ACTIVITIES_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,task) AS (VALUES
(1,'كتابة قصة تتضمن حوارًا بين طرفين','أي عنصر يوضح المتكلم في قصة حوارية؟','إسناد الكلام إلى الشخصية بوضوح','ترك كل الأقوال بلا متحدث','حذف الحوار كاملًا','سرد أحداث غير مرتبطة','اكتب قصة قصيرة ذات بداية ومشكلة وحل، وأدخل حوارًا من أربعة أسطر بين شخصيتين مع علامات ترقيم مناسبة.'),
(2,'تلخيص قصة قصيرة','ما الذي يُحافظ عليه الملخص الجيد عادةً؟','الأحداث الأساسية بترتيب واضح','كل الأوصاف الثانوية حرفيًا','تفاصيل لم ترد بالقصة','نسخ النص كله دون اختصار','لخص قصة قصيرة أصلية في أربع جمل مع توضيح الشخصية والحدث والحل.'),
(3,'كتابة رسالة تتضمن سرد أحداث (1)','ما الذي يليق ببداية رسالة شخصية تحكي حدثًا؟','تحية مناسبة وتمهيد للحدث','حذف اسم المرسل إليه دائمًا','الانتقال إلى النهاية مباشرة','ترك الفكرة دون سياق','اكتب بداية رسالة شخصية تتضمن تحية وجملتين عن حدث مدرسي.'),
(4,'كتابة رسالة تتضمن سرد أحداث (2)','كيف نختم رسالة سردية بعد عرض الأحداث؟','خاتمة تلخص الأثر مع توقيع مناسب','بإضافة حدث غير متعلق','من دون أي جملة ختامية','بتكرار أول الرسالة فقط','أكمل رسالة عن رحلة مدرسية بجمل مرتبة وخاتمة وتوقيع مناسبين.'),
(5,'كتابة قصة تتضمن سردًا غير خطي','ما أسلوب السرد غير الخطي في القصة؟','الانتقال إلى ذكرى سابقة ثم العودة إلى الزمن الحالي','الالتزام بترتيب واحد دائمًا','حذف العلاقة بين الأحداث','عرض أسماء بلا قصة','اكتب فقرة سردية تبدأ بالحاضر ثم تعود إلى ذكرى سابقة باستخدام عبارة «تذكرت يوم...».'),
(6,'كتابة الرسالة الرسمية','ما أبرز ما يميز الرسالة الرسمية؟','موضوع واضح وتحية ملائمة ولغة مهذبة','ألفاظ عامية مسيئة','عدم تحديد الجهة المرسل إليها','خاتمة بلا غرض','اكتب رسالة رسمية قصيرة إلى إدارة المدرسة تقترح نشاطًا قرائيًا، مع موضوع واضح وخاتمة مناسبة.')
), scoped AS (SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — الإنتاج الكتابي' AND u.semester=2
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=7
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>500 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities(lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تطبيق يحتاج مراجعة المعلم','writing','practice',s.task,
jsonb_build_object('origin','DADYOOM_BH_G7_T2_ORIGINAL_ACTIVITIES_20261008','sourceStatus','HISTORICAL_2025_2026_UNVERIFIED_2026_2027',
 'notOfficialBook',true,'humanReviewRequired',true,'skillQualityAutoVerified',false,'text',s.task),
jsonb_build_object('grading_mode','completion_only_reference','model_answer','يقوّم المعلم جودة الكتابة أو الخط ويعطي ملاحظات؛ إكمال المهمة ليس تصحيحًا آليًا لجودة الأداء.'),2,5,true,true
FROM scoped s WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G7_T2_ORIGINAL_ACTIVITIES_20261008' AND a.activity_type='writing');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,task) AS (VALUES
(1,'كتابة حرف الراء','أي خاصية من خصائص الراء في الكتابة العربية؟','لا يتصل بما بعده','يحتاج نقطتين فوقه','يتصل دائمًا بما بعده','يكتب بنقطة تحت الحرف','انسخ «رسم، مدرسة، قمر» بخط النسخ، وراجع شكل الراء واتصاله ثم اكتب مثالًا من عندك.'),
(2,'كتابة حرف الخاء','ما الذي يميز الخاء عن الحاء في الرسم المعتاد؟','نقطة فوق الخاء','نقطة تحت الخاء','نقطتان فوق الحاء','لا فرق بينهما','انسخ «خالد، بخور، تاريخ» وراجع نقطة الخاء وموضعه في الكلمة.'),
(3,'كتابة حرف اللام','أي كلمة تنتهي بحرف اللام؟','جبل','كتاب','كرسي','حقيبة','اكتب «ليل، ملعب، جبل» بخط واضح ولاحظ امتداد اللام واتصالها بالحروف.'),
(4,'كتابة حرف الضاد','ما العلامة التي تميز حرف الضاد عن الصاد؟','نقطة فوق الضاد','نقطة تحت الصاد','نقطتان فوق الصاد','نقطة فوق الصاد','اكتب «ضوء، أرض، مريض» بخط النسخ وراجع شكل الضاد ونقطته.')
), scoped AS (SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — الخط العربي' AND u.semester=2
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=7
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>500 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities(lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم أصلي — الخط العربي','multiple_choice','assessment',s.prompt,
 jsonb_build_object('origin','DADYOOM_BH_G7_T2_ORIGINAL_ACTIVITIES_20261008','sourceStatus','HISTORICAL_2025_2026_UNVERIFIED_2026_2027','notOfficialBook',true,'reviewStatus','required',
 'options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
 jsonb_build_object('correct',s.correct),1,5,true,true FROM scoped s
 WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G7_T2_ORIGINAL_ACTIVITIES_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,task) AS (VALUES
(1,'كتابة حرف الراء','أي خاصية من خصائص الراء في الكتابة العربية؟','لا يتصل بما بعده','يحتاج نقطتين فوقه','يتصل دائمًا بما بعده','يكتب بنقطة تحت الحرف','انسخ «رسم، مدرسة، قمر» بخط النسخ، وراجع شكل الراء واتصاله ثم اكتب مثالًا من عندك.'),
(2,'كتابة حرف الخاء','ما الذي يميز الخاء عن الحاء في الرسم المعتاد؟','نقطة فوق الخاء','نقطة تحت الخاء','نقطتان فوق الحاء','لا فرق بينهما','انسخ «خالد، بخور، تاريخ» وراجع نقطة الخاء وموضعه في الكلمة.'),
(3,'كتابة حرف اللام','أي كلمة تنتهي بحرف اللام؟','جبل','كتاب','كرسي','حقيبة','اكتب «ليل، ملعب، جبل» بخط واضح ولاحظ امتداد اللام واتصالها بالحروف.'),
(4,'كتابة حرف الضاد','ما العلامة التي تميز حرف الضاد عن الصاد؟','نقطة فوق الضاد','نقطة تحت الصاد','نقطتان فوق الصاد','نقطة فوق الصاد','اكتب «ضوء، أرض، مريض» بخط النسخ وراجع شكل الضاد ونقطته.')
), scoped AS (SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — الخط العربي' AND u.semester=2
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=7
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>500 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities(lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تطبيق يحتاج مراجعة المعلم','writing','practice',s.task,
jsonb_build_object('origin','DADYOOM_BH_G7_T2_ORIGINAL_ACTIVITIES_20261008','sourceStatus','HISTORICAL_2025_2026_UNVERIFIED_2026_2027',
 'notOfficialBook',true,'humanReviewRequired',true,'skillQualityAutoVerified',false,'text',s.task),
jsonb_build_object('grading_mode','completion_only_reference','model_answer','يقوّم المعلم جودة الكتابة أو الخط ويعطي ملاحظات؛ إكمال المهمة ليس تصحيحًا آليًا لجودة الأداء.'),2,5,true,true
FROM scoped s WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G7_T2_ORIGINAL_ACTIVITIES_20261008' AND a.activity_type='writing');
UPDATE public.lessons l SET content='مادة إثرائية أصلية من ضاديوم وليست نص الكتاب المدرسي الرسمي. موضوعات هذا القسم مستندة إلى قائمة تاريخية للفصل الثاني 2025–2026؛ ولم تتحقق بعد مطابقة فهرس 2026–2027.' || substring(l.content from char_length('محتوى من كتاب رسمي مقرر. خريطة التفصيل من خطة الوزارة للفصل الثاني 2025-2026، ولا تعني أنه مجدول حاليًا في 2026-2027 قبل نشر الخطة الجديدة.')+1),updated_at=now()
FROM public.units u JOIN public.grades g ON g.id=u.grade_id JOIN public.curricula cu ON cu.id=g.curriculum_id JOIN public.countries c ON c.id=cu.country_id
WHERE l.unit_id=u.id AND u.semester=2 AND g.grade_number=7 AND c.code='BH' AND cu.academic_year='2026-2027'
AND left(l.content,char_length('محتوى من كتاب رسمي مقرر. خريطة التفصيل من خطة الوزارة للفصل الثاني 2025-2026، ولا تعني أنه مجدول حاليًا في 2026-2027 قبل نشر الخطة الجديدة.'))='محتوى من كتاب رسمي مقرر. خريطة التفصيل من خطة الوزارة للفصل الثاني 2025-2026، ولا تعني أنه مجدول حاليًا في 2026-2027 قبل نشر الخطة الجديدة.'
AND l.content LIKE '%ضاديوم%' AND l.status='published';