-- Pedagogically authored Dadyoom practice for the historical Bahrain 2025-26 T2 topics. Unverified against official book 2026-27; not copied from textbook.
-- Restrict by country, term, year, exact lesson title+order, content provenance. Re-runs cannot duplicate the same origin.
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(1,'زرقاء اليمامة','ما الفرق الذي ناقشه المعلم بين الرواية الشعبية والمعلومة التاريخية؟','المعلومة التاريخية تحتاج أدلة ومصادر موثوقة','كل الروايات الشعبية حقائق مثبتة','لا حاجة إلى التحقق من أي خبر','يكفي العنوان لإثبات الحدث'),
(2,'صفية بنت عبد المطلب','ما القاعدة التي التزمت بها مريم عند إعداد بطاقتها التاريخية؟','لا تنسب أقوالًا أو أحداثًا إلى الشخصية بلا مصدر موثوق','تكتب أي حكاية على أنها حقيقة','تنقل الكلام بلا مراجعة','تستغني عن السؤال والبحث'),
(3,'عالم المفاجآت','لماذا لم يحدد بدر نوع الحجر من لونه فقط؟','لأن التعرف العلمي يحتاج ملاحظة ووسائل تحقق','لأن اللون يكفي دائمًا للتصنيف','لأن الحجر غير موجود','لأن المعلم طلب تجاهل الاكتشاف'),
(4,'راعي الميثاق','كيف تعامل الفريق عندما تأخر أحد أعضائه في أداء المهمة؟','ناقش الحل وأعاد تنظيم الوقت دون اتهامات','ألغى جميع القواعد','اتهم العضو بلا استماع','توقف عن التعاون نهائيًا'),
(5,'النخلة المعوجة','لماذا لم يحاول حمد تقويم النخلة بنفسه؟','لأن سلامة النبات تتطلب ملاحظة رأي مختص','لأن كسر الفروع مفيد دائمًا','لأن النباتات لا تحتاج رعاية','لأنه أراد قلعها'),
(6,'قصة نجاح','أي سلوك ساعد سارة على تطوير ركن القراءة؟','التخطيط والمحاولة والتعاون مع الزميلات','رفض النصيحة والتجربة','التوقف عند أول مشكلة','ترك الكتب بلا ترتيب'),
(7,'أمنية تتحقق','بماذا بدأت هدى تدريبها على إلقاء القصص؟','بقراءة فقرة قصيرة أمام أسرتها','بإلقاء عرض كبير بلا تدريب','بتجاهل نقاط الضعف','بعدم قراءة النص مطلقًا'),
(8,'الإحسان إلى الخلق','كيف تصرف يوسف عندما وجد حيوانًا متعبًا؟','أخبر بالغًا وطلب المساعدة من مختص دون اقتراب غير آمن','لمس الحيوان دون حذر','أزعج الحيوان ليهرب','تجاهل سلامته وسلامة الآخرين'),
(9,'أخلاق كريمة','كيف ساعدت سلمى زميلتها في ركن المطالعة؟','أرشدتها إلى رف القصص مع ترك حرية الاختيار لها','اختارت الكتاب بدلًا منها رغم رفضها','منعتها من القراءة','تجاهلت سؤالها'),
(10,'مثل وقصة','لماذا طلب المعلم من الطلاب كتابة قصة جديدة بعد مناقشة المثل؟','لتطبيق الفكرة في موقف مبتكر بدل نقل حكاية جاهزة','لنسخ قصة قديمة حرفيًا','لإلغاء التفكير في المعنى','لإخفاء فكرة المثل'),
(11,'مراجعة عامة للقراءة والنحو والإملاء','ما الحال في العبارة «عادَ إلى البيت سعيدًا»؟','سعيدًا','عادَ','البيت','إلى')
), scoped AS (
 SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
 JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — القراءة والنصوص' AND u.semester=2
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=6 AND g.name_ar='الصف السادس'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content ILIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities
 (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم أصلي — القراءة والنصوص','multiple_choice','assessment',s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G6_T2_ORIGINAL_20261008','sourceStatus','BH_2025_2026_T2_HISTORICAL_NOT_VERIFIED_FOR_2026_2027','notOfficialBook',true,'reviewStatus','required','skill','القراءة والنصوص','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
jsonb_build_object('correct',s.correct),1,5,true,true
FROM scoped s WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G6_T2_ORIGINAL_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(1,'يونس في بطن الحوت','ما المصدر المناسب للتحقق من أحداث قصة نبي الله يونس عليه السلام؟','القرآن الكريم وتفسير موثوق','حكايات مختلقة بلا مصدر','تعليقات مجهولة على الإنترنت','تفاصيل يؤلفها التلميذ'),
(2,'مظلات الهبوط','كيف تعلم التلاميذ عن مظلات الهبوط بطريقة آمنة؟','شاهدوا عرضًا علميًا وناقشوه دون تجربة قفز','قفزوا دون تدريب','أجروا اختبارًا خطيرًا فوق المبنى','تجاهلوا تعليمات المختص'),
(3,'مستشفيات الأسماك','ما المثال العلمي الذي تعلمته ياسمين عن علاقة بعض الأسماك؟','تتغذى أسماك صغيرة على طفيليات أسماك أخرى فيستفيد الطرفان','تعيش كل الأسماك وحدها دائمًا','كل علاقة بين الكائنات ضارة','تحتاج الأسماك إلى هواء جاف للبقاء'),
(4,'الصدق منجاة','ماذا فعل بدر بعد أن كسر أداة المشروع؟','اعترف بالخطأ واعتذر وساعد في الإصلاح','اتهم زميلًا بريئًا','أخفى الأداة ولم يخبر أحدًا','ترك المشروع بلا محاولة للإصلاح'),
(5,'إن حاتمًا لم يمت','ما المعنى المقصود ببقاء الأثر الطيب للشخص؟','بقاء أثر أعماله في ذاكرة الناس','العيش الجسدي بلا نهاية','عدم الحاجة إلى التحقق من القصص التاريخية','أن كل حكاية منسوبة إليه صحيحة')
), scoped AS (
 SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
 JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — الاستماع' AND u.semester=2
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=6 AND g.name_ar='الصف السادس'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content ILIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities
 (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم أصلي — الاستماع','multiple_choice','assessment','بعد سماع النص الأصلي المقروء مرتين: '||s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G6_T2_ORIGINAL_20261008','sourceStatus','BH_2025_2026_T2_HISTORICAL_NOT_VERIFIED_FOR_2026_2027','notOfficialBook',true,'reviewStatus','required','skill','الاستماع','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3),'teacherReadAloudTwice',true,'officialAudioAvailable',false),
jsonb_build_object('correct',s.correct),1,5,true,true
FROM scoped s WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G6_T2_ORIGINAL_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(1,'التطابق بين المبتدأ والخبر','أي خبر يناسب المبتدأ المثنى المؤنث في «الطالبتانِ ___»؟','مجتهدتانِ','مجتهدٌ','مجتهدةٌ','مجتهدون'),
(2,'تدريبات على كان وأخواتها وإن وأخواتها','أي جملة استعملت «إنَّ» وضبطت اسمها وخبرها ضبطًا صحيحًا؟','إنَّ الجوَّ معتدلٌ','إنَّ الجوُّ معتدلًا','إنَّ الجوُّ معتدلٌ','إنَّ الجوَّ معتدلًا'),
(3,'النكرة والمعرفة','أي كلمة معرفة في الأمثلة التالية؟','الكتابُ','كتابٌ','قلمٌ','مدرسةٌ'),
(4,'النكرة والمعرفة — أطبق','ما الطريقة التي تحول «قلمٌ» إلى معرفة بـ«ال»؟','القلمُ','قلمٌ','قلمًا','قلمٍ'),
(5,'التطابق بين الصفة والموصوف','أي تركيب صحيح في مطابقة الصفة للموصوف؟','قصةٌ مفيدةٌ','قصةٌ مفيدٌ','كتابٌ مفيدةٌ','الطالبتانِ المجتهدُ'),
(6,'التطابق بين الصفة والموصوف — أطبق','أي صفة تكمل «اشتريتُ كتابًا ___» على نحو صحيح؟','جديدًا','جديدةً','جديدٌ','الجديدةُ'),
(7,'الحال','ما الحال في «عادَ الطالبُ مسرورًا»؟','مسرورًا','الطالبُ','عادَ','الجملة كلها'),
(8,'المفعول المطلق','ما المفعول المطلق في «شكرته شكرًا»؟','شكرًا','شكرته','الهاء','التاء'),
(9,'المفعول لأجله','ما المفعول لأجله في «ذاكرتُ رغبةً في التفوق»؟','رغبةً','ذاكرتُ','في','التفوق'),
(10,'الأسماء الخمسة','أي صيغة رفع صحيحة لاسم من الأسماء الخمسة مضاف إلى الكاف؟','جاء أبوك','جاء أباك','جاء أبيك','جاء أبك'),
(11,'تمييز العدد من 3 إلى 10','ما التمييز الصحيح للعدد في «ثلاثةُ ___»؟','كتبٍ','كتابًا','كتابٌ','كتبًا'),
(12,'تمييز العدد من 11 إلى 99','أي صيغة صحيحة لتمييز العدد 30؟','ثلاثون طالبًا','ثلاثون طلابٍ','ثلاثون طالبٌ','ثلاثون طلابًا'),
(13,'مراجعة القواعد النحوية','ما الحال في «عاد المسافرُ مسرورًا»؟','مسرورًا','المسافرُ','عاد','لا حال في الجملة')
), scoped AS (
 SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
 JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — القواعد والتراكيب' AND u.semester=2
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=6 AND g.name_ar='الصف السادس'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content ILIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities
 (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم أصلي — القواعد والتراكيب','multiple_choice','assessment',s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G6_T2_ORIGINAL_20261008','sourceStatus','BH_2025_2026_T2_HISTORICAL_NOT_VERIFIED_FOR_2026_2027','notOfficialBook',true,'reviewStatus','required','skill','القواعد والتراكيب','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
jsonb_build_object('correct',s.correct),1,5,true,true
FROM scoped s WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G6_T2_ORIGINAL_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(1,'تدريبات على الهمزة المتطرفة','أي كلمة رُسمت همزتها المتطرفة على واو لضم ما قبلها؟','تباطُؤ','قرَأ','شاطِئ','جزء'),
(2,'تدريبات على الهمزة','أين تظهر همزة الوصل بين الكلمات التالية؟','اسم','أمل','سؤال','شاطئ'),
(3,'القواعد الإملائية — الأسبوع السادس','أي كلمة تنتهي بألف لينة على صورة «ى»؟','سعى','دعا','قرأ','شاهد'),
(4,'القواعد الإملائية — الأسبوع السابع','أي كلمة فيها همزة قطع؟','إيمان','اسم','استمع','ابن'),
(5,'القواعد الإملائية — الأسبوع الثامن','أي كلمة من أمثلة الدرس تنتهي بتاء مربوطة؟','مدرسة','بيت','قراءةٌت','كتيب'),
(6,'دخول حروف الجر على ما الاستفهامية','ما الصورة الصحيحة لسؤال يبدأ بالباء و«ما» الاستفهامية؟','بِمَ تكتب؟','بما تكتب؟ إذا قصدتَ السؤال','بِما تكتب؟ بألف ما الاستفهامية','بَمَا تكتب؟'),
(7,'القواعد الإملائية — الأسبوع العاشر','أي رسم صحيح للفعل الماضي في عبارة «___ خالد قصةً»؟','قرأَ','قرء','قرئ','قرؤ'),
(8,'القواعد الإملائية — الأسبوع الحادي عشر','أي كلمة رُسمت همزتها المتطرفة على السطر بعد ساكن؟','جزء','شاطئ','بدأ','تباطؤ')
), scoped AS (
 SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
 JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — الإملاء' AND u.semester=2
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=6 AND g.name_ar='الصف السادس'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content ILIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities
 (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم أصلي — الإملاء','multiple_choice','assessment',s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G6_T2_ORIGINAL_20261008','sourceStatus','BH_2025_2026_T2_HISTORICAL_NOT_VERIFIED_FOR_2026_2027','notOfficialBook',true,'reviewStatus','required','skill','الإملاء','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
jsonb_build_object('correct',s.correct),1,5,true,true
FROM scoped s WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G6_T2_ORIGINAL_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,practice) AS (VALUES
(1,'تسلسل الأحداث في النص السردي — أتعرف وأكتشف','ماذا فعل خالد بعد اكتشاف نسيان كتابه؟','أخبر المعلم واستخدم نسخة من المكتبة','غادر المدرسة دون كلام','أخفى المشكلة عن الجميع','مزق نسخة المكتبة','اكتب قصة قصيرة من أربع جمل عن نسيان كتاب، مرتبة وفق البداية والمشكلة والحل والنهاية.'),
(2,'تسلسل الأحداث في النص السردي — أثري وأنتج جزئيًا','ما أول حدث في قصة القلم المفقود؟','وجد راشد قلمًا مفقودًا','أعاد المعلم القلم لصاحبه','شكر صاحب القلم زميله قبل العثور عليه','انتهت القصة قبل أن تبدأ','رتب قصة القلم في ثلاث جمل مستعملًا «ثم» و«بعد ذلك».'),
(3,'تسلسل الأحداث في النص السردي — أنتج وأقوم','ما الخطوة التي جاءت بعد أن بدأت هدى إعداد عرضها؟','اختارت الصور وأعادت ترتيب العناوين','ألقت العرض قبل إعداده','حذفت الصور دون مراجعة','تركت المشروع دون إكمال','اكتب عرضًا سرديًا موجزًا لأربع خطوات لإنجاز مشروع، ثم راجع ترابط الأحداث.'),
(4,'إغناء النص السردي بالوصف والحوار — أتعرف وأكتشف','أين وجد سامي قصص المغامرة بعد سؤاله أمينة المكتبة؟','في الرف الثالث','على سقف المكتبة','في الحديقة','في حقيبته','اكتب فقرة من خمس جمل تصف مكتبة وتضم حوارًا قصيرًا بين شخصين.'),
(5,'إغناء النص السردي بالوصف والحوار — أثري وأنتج جزئيًا','ما الذي اقترحته زميلة مريم قبل بدء النشاط؟','الاتفاق على الأدوار أولًا','إلغاء العمل الجماعي','تجاهل الحوار','إغلاق الحديقة','صف حديقة خضراء في جملتين، ثم أضف حوارًا من سطرين لتقسيم الأدوار.'),
(6,'إغناء النص السردي بالوصف والحوار — أنتج وأقوم','ما المهمة التي طلبها رفاق بدر منه في المشروع؟','مراجعة العنوان والرسوم','العودة إلى المنزل فورًا','عدم المشاركة','إتلاف اللوحة','اكتب قصة قصيرة تصف موقفًا دراسيًا ثم ضع حوارًا يعالج مشكلة المشروع.'),
(7,'تدريبات التعبير الكتابي — الأسبوع السابع','ما الذي يطل من نافذة الصف في الوصف الأصلي؟','ساحة منظمة','شاطئ بعيد','مطار','سوق شعبي','صف فصلًا أو مكتبة في أربع جمل مستعملًا ظروف المكان وبعض النعوت.'),
(8,'تدريبات التعبير الكتابي — الأسبوع الثامن','لماذا كتب حمد رسالة إلى يوسف؟','ليشكره على التعاون في لوحة العلوم','ليعاتبه على الغياب دون دليل','لدعوته إلى مباراة كرة قدم','ليسأله عن رحلة بحرية','اكتب رسالة شكر قصيرة لصديق على تعاونه تتضمن تحية وسببًا وخاتمة.'),
(9,'تدريبات التعبير الكتابي — الأسبوع التاسع','أي عنصر ينبغي أن يرد في تقرير سارة عن ترتيب المكتبة؟','الوقت والمكان والمشاركون والنتيجة','تخمينات غير موثقة','أسماء غير مشاركة','مبالغات عن حدث لم يحدث','اكتب تقريرًا من خمس جمل عن نشاط مدرسي تحدد فيه الزمان والمكان والعمل والنتيجة.'),
(10,'تدريبات التعبير الكتابي — الأسبوعان العاشر والحادي عشر','أين وجدت سلمى الصورة المفقودة من مشروعها؟','في حقيبة الأدوات','تحت شجرة الحديقة','داخل سيارة المعلم','في غرفة الرياضة','أنتج نصًا سرديًا في أربع جمل عن مشروع واجه مشكلة ثم حُلَّت.')
), scoped AS (
 SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
 JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — الإنتاج الكتابي' AND u.semester=2
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=6 AND g.name_ar='الصف السادس'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content ILIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities
 (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم أصلي — الإنتاج الكتابي','multiple_choice','assessment',s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G6_T2_ORIGINAL_20261008','sourceStatus','BH_2025_2026_T2_HISTORICAL_NOT_VERIFIED_FOR_2026_2027','notOfficialBook',true,'reviewStatus','required','skill','الإنتاج الكتابي','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
jsonb_build_object('correct',s.correct),1,5,true,true
FROM scoped s WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G6_T2_ORIGINAL_20261008' AND a.activity_type='multiple_choice');
WITH qa(sort_order,title,prompt,correct,w1,w2,w3,practice) AS (VALUES
(1,'تسلسل الأحداث في النص السردي — أتعرف وأكتشف','ماذا فعل خالد بعد اكتشاف نسيان كتابه؟','أخبر المعلم واستخدم نسخة من المكتبة','غادر المدرسة دون كلام','أخفى المشكلة عن الجميع','مزق نسخة المكتبة','اكتب قصة قصيرة من أربع جمل عن نسيان كتاب، مرتبة وفق البداية والمشكلة والحل والنهاية.'),
(2,'تسلسل الأحداث في النص السردي — أثري وأنتج جزئيًا','ما أول حدث في قصة القلم المفقود؟','وجد راشد قلمًا مفقودًا','أعاد المعلم القلم لصاحبه','شكر صاحب القلم زميله قبل العثور عليه','انتهت القصة قبل أن تبدأ','رتب قصة القلم في ثلاث جمل مستعملًا «ثم» و«بعد ذلك».'),
(3,'تسلسل الأحداث في النص السردي — أنتج وأقوم','ما الخطوة التي جاءت بعد أن بدأت هدى إعداد عرضها؟','اختارت الصور وأعادت ترتيب العناوين','ألقت العرض قبل إعداده','حذفت الصور دون مراجعة','تركت المشروع دون إكمال','اكتب عرضًا سرديًا موجزًا لأربع خطوات لإنجاز مشروع، ثم راجع ترابط الأحداث.'),
(4,'إغناء النص السردي بالوصف والحوار — أتعرف وأكتشف','أين وجد سامي قصص المغامرة بعد سؤاله أمينة المكتبة؟','في الرف الثالث','على سقف المكتبة','في الحديقة','في حقيبته','اكتب فقرة من خمس جمل تصف مكتبة وتضم حوارًا قصيرًا بين شخصين.'),
(5,'إغناء النص السردي بالوصف والحوار — أثري وأنتج جزئيًا','ما الذي اقترحته زميلة مريم قبل بدء النشاط؟','الاتفاق على الأدوار أولًا','إلغاء العمل الجماعي','تجاهل الحوار','إغلاق الحديقة','صف حديقة خضراء في جملتين، ثم أضف حوارًا من سطرين لتقسيم الأدوار.'),
(6,'إغناء النص السردي بالوصف والحوار — أنتج وأقوم','ما المهمة التي طلبها رفاق بدر منه في المشروع؟','مراجعة العنوان والرسوم','العودة إلى المنزل فورًا','عدم المشاركة','إتلاف اللوحة','اكتب قصة قصيرة تصف موقفًا دراسيًا ثم ضع حوارًا يعالج مشكلة المشروع.'),
(7,'تدريبات التعبير الكتابي — الأسبوع السابع','ما الذي يطل من نافذة الصف في الوصف الأصلي؟','ساحة منظمة','شاطئ بعيد','مطار','سوق شعبي','صف فصلًا أو مكتبة في أربع جمل مستعملًا ظروف المكان وبعض النعوت.'),
(8,'تدريبات التعبير الكتابي — الأسبوع الثامن','لماذا كتب حمد رسالة إلى يوسف؟','ليشكره على التعاون في لوحة العلوم','ليعاتبه على الغياب دون دليل','لدعوته إلى مباراة كرة قدم','ليسأله عن رحلة بحرية','اكتب رسالة شكر قصيرة لصديق على تعاونه تتضمن تحية وسببًا وخاتمة.'),
(9,'تدريبات التعبير الكتابي — الأسبوع التاسع','أي عنصر ينبغي أن يرد في تقرير سارة عن ترتيب المكتبة؟','الوقت والمكان والمشاركون والنتيجة','تخمينات غير موثقة','أسماء غير مشاركة','مبالغات عن حدث لم يحدث','اكتب تقريرًا من خمس جمل عن نشاط مدرسي تحدد فيه الزمان والمكان والعمل والنتيجة.'),
(10,'تدريبات التعبير الكتابي — الأسبوعان العاشر والحادي عشر','أين وجدت سلمى الصورة المفقودة من مشروعها؟','في حقيبة الأدوات','تحت شجرة الحديقة','داخل سيارة المعلم','في غرفة الرياضة','أنتج نصًا سرديًا في أربع جمل عن مشروع واجه مشكلة ثم حُلَّت.')
), scoped AS (
 SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
 JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — الإنتاج الكتابي' AND u.semester=2
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=6 AND g.name_ar='الصف السادس'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content ILIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities
 (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'إنتاج كتابي أصلي — يحتاج مراجعة المعلم','writing','practice',s.practice,
jsonb_build_object('origin','DADYOOM_BH_G6_T2_ORIGINAL_20261008','sourceStatus','BH_2025_2026_T2_HISTORICAL_NOT_VERIFIED_FOR_2026_2027','notOfficialBook',true,'reviewStatus','required','humanReviewRequired',true,'skillQualityAutoVerified',false,'text',s.practice),
jsonb_build_object('grading_mode','completion_only_reference','model_answer','تُراجع جودة النص وترابط الأحداث وسلامة اللغة من قبل المعلم، ولا يؤكد زر الإكمال تحقق جودة الكتابة.'),2,5,true,true
FROM scoped s WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G6_T2_ORIGINAL_20261008' AND a.activity_type='writing');
