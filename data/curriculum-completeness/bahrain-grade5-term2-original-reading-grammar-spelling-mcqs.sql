-- Original Dadyoom comprehension/grammar/spelling MCQs only. Source topics are a historical 2025/26 Bahrain plan; official 2026/27 parity is NOT verified.
-- Fail closed on mismatching lesson title/order/grade/term and never duplicate an origin.
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(1,'الكهرباء في وطني','أي تصرف آمن ذكرته ليان في فقرة ضاديوم عن الكهرباء؟','إطفاء الأنوار غير الضرورية وتجنب الأسلاك المكشوفة','لمس الأسلاك المكشوفة لاختبارها','ترك الأجهزة دون مراقبة','تشغيل جميع الأنوار طوال النهار'),
(2,'نزهة في أحضان الطبيعة','كيف نظّم الطلاب ملاحظات النزهة بعد العودة؟','في جدول يسجل الاسم والمكان ووصفًا مختصرًا','على شكل تخمينات غير موثقة','بتمزيق أوراق الأشجار','بنسيان ما لاحظوه'),
(3,'بيئتنا حياتنا','كيف قاس الفريق نجاح حملة فرز الورق؟','بملاحظة نظافة المكان بعد أسبوع','بعدّ الصور المنشورة فقط','بترك الأوراق في الممرات','بتجاهل حالة المكتبة'),
(4,'الفارس العربي','ما الفكرة التي تعلمها سالم عن الفروسية؟','أن القوة ترتبط بالمسؤولية والرحمة والسلامة','أن الانضباط غير مهم','أن رعاية الخيل لا علاقة لها بالفروسية','أن الفوز يبرر تعريض الآخرين للخطر'),
(5,'الممثل البارع','ما الذي ساعد راشد على تحسين أدائه المسرحي؟','التدرب على نبرة الصوت والوقفات المناسبة','الصراخ المستمر بدل فهم الدور','تجاهل زملائه','ترك النص دون قراءة'),
(6,'إنها تحب التصميم','ما التعديل الذي أدخلته جود على لوحتها؟','كبّرت الخط بعد ملاحظة صغره واستشارة صديقتها','حذفت كل المعلومات','استخدمت ألوانًا غير متناسقة عمدًا','أوقفت العمل قبل المراجعة'),
(7,'على شواطئ البحرين','ماذا فعلت الأسرة بالمخلفات عند زيارة الشاطئ؟','حملتها معها لحماية المكان','تركتها قرب البحر','دفنتها حيث يلعب الأطفال','ألقتها بين القوارب'),
(8,'الكلب والحمامة','كيف ساعد الكلب الحمامة المتعبة في القصة الأصلية؟','نبح لاستدعاء الحارس الذي أحضر مختصًا','أخافها حتى طارت','اقترب منها بعنف','تركها دون تنبيه أحد'),
(9,'سابق الريح','ماذا فعل فهد عندما تعثر أحد المشاركين؟','أبلغ المشرف للمساعدة بأمان','أكمل السباق من دون إخبار أحد','دفع المشاركين بعيدًا','حاول تحريكه بعنف'),
(10,'صدى الحياة','كيف فرقت نور بين الملاحظة والخيال؟','ميزت الأصوات التي سمعتها فعلًا عما تخيلته','قدمت الخيال على أنه صوت مسموع','لم تكتب شيئًا','اعتبرت كل الأصوات متشابهة'),
(11,'مراجعة عامة للفصل الثاني','في العبارة «دخلت هند المكتبة صباحًا»، متى دخلت هند المكتبة؟','صباحًا','مساءً','منتصف الليل','وقت الغروب')
), scoped AS (
 SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
 JOIN public.units u ON u.id=l.unit_id AND u.semester=2 AND u.title='الجزء الثاني — القراءة والنصوص'
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=5 AND g.name_ar='الصف الخامس'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم ضاديوم الأصلي — القراءة والنصوص','multiple_choice','assessment',s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G5_T2_RGS_ORIGINAL_20261008','historicalSource','BH_2025_2026_TERM_2_UNVERIFIED_2026_2027','notOfficialBook',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
jsonb_build_object('correct',s.correct),1,5,true,true FROM scoped s
WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G5_T2_RGS_ORIGINAL_20261008' AND a.activity_type='multiple_choice');

WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(1,'الحروف الناسخة','ما اسم «إنَّ» في «إنَّ الصدقَ فضيلةٌ»؟','الصدقَ','فضيلةٌ','إنَّ','الجملة كلها'),
(2,'الأسماء المجرورة بحروف الجر','ما الاسم المجرور في «جلستُ في الحديقةِ»؟','الحديقةِ','جلستُ','في','ضمير المتكلم'),
(3,'الأسماء المجرورة بالإضافة','ما المضاف إليه في «بابُ المدرسةِ»؟','المدرسةِ','بابُ','لا يوجد','بابُ المدرسة'),
(4,'الصفة والموصوف','أي تعبير يطابق فيه النعت المنعوت؟','الشجرةُ الطويلةُ','الشجرةُ الطويلُ','الطالبُ المجتهدةُ','قصةٌ مفيدٌ'),
(5,'ظرفا الزمان والمكان','حدد ظرف المكان في «وقفتُ خلفَ الشجرة»؟','خلفَ','وقفتُ','الشجرة','ضمير المتكلم'),
(6,'ضمائر الرفع المتصلة (1)','ما ضمير الرفع المتصل بالفعل «كتبْنا»؟','نا الفاعلين','تاء التأنيث','واو الجماعة','ياء المتكلم'),
(7,'ضمائر الرفع المتصلة (2)','ما الضمير الذي يدل على جماعة الذكور في «ذهبُوا»؟','واو الجماعة','نون النسوة','ياء المخاطبة','ألف الاثنين'),
(8,'النفي بـ(ما - لم - لن - لا - ليس) (1)','أي أداة تجزم الفعل المضارع في «لم يذهبْ»؟','لم','لن','ما','ليس'),
(9,'النفي بـ(ما - لم - لن - لا - ليس) (2)','ما اسم «ليس» في «ليس العملُ صعبًا»؟','العملُ','صعبًا','ليس','الجملة كلها'),
(10,'العطف بـ(الواو - ثم - أو) (1)','ما حرف العطف في «قرأ أحمد ثم كتب»؟','ثم','قرأ','أحمد','كتب'),
(11,'العطف بـ(الواو - ثم - أو) (2)','أي أداة تعطف الهوايتين للدلالة على الجمع في «أحب الرسم __ القراءة»؟','و','ثم','أو','لكن'),
(12,'أنشطة تقويمية في القواعد النحوية','ما اسم إنَّ في «إنَّ الطالبَ مجتهدٌ»؟','الطالبَ','مجتهدٌ','إنَّ','العبارة كاملة')
), scoped AS (
 SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
 JOIN public.units u ON u.id=l.unit_id AND u.semester=2 AND u.title='الجزء الثاني — القواعد والتراكيب'
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=5 AND g.name_ar='الصف الخامس'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم ضاديوم الأصلي — القواعد والتراكيب','multiple_choice','assessment',s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G5_T2_RGS_ORIGINAL_20261008','historicalSource','BH_2025_2026_TERM_2_UNVERIFIED_2026_2027','notOfficialBook',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
jsonb_build_object('correct',s.correct),1,5,true,true FROM scoped s
WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G5_T2_RGS_ORIGINAL_20261008' AND a.activity_type='multiple_choice');

WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(1,'الهمزة المتوسطة المكسورة (1)','ما الرسم الصحيح للكلمة الدالة على قائد في العمل: «رئيس»؟','رئيس','رأيس','رؤيس','رءيس'),
(2,'الهمزة المتوسطة المكسورة (2)','ما الكتابة الصحيحة للفعل «سُئِلَ»؟','سُئِلَ','سُؤِلَ','سُأِلَ','سُءِلَ'),
(3,'الهمزة المتوسطة المكسور ما قبلها','أي كلمة رُسمت همزتها المتوسطة على نبرة بعد كسر؟','بِئْر','بِأْر','بِؤْر','بِءْر'),
(4,'الهمزة المتطرفة المفتوح ما قبلها','أي رسم صحيح للفعل الماضي الدال على الشروع؟','بدأَ','بدء','بدؤ','بدئ'),
(5,'الهمزة المتطرفة المكسور ما قبلها','ما الرسم الصحيح للكلمة الدالة على من يقرأ؟','قارِئ','قارِأ','قارِؤ','قارِء'),
(6,'الهمزة المتطرفة المسبوقة بحرف ساكن صحيح أو حرف علة','كيف تُكتب الهمزة في نهاية كلمة «جُزْء»؟','على السطر','على واو','على ألف','على نبرة'),
(7,'الألف الفارقة','ما الرسم الصحيح لفعل ماضٍ مسند إلى واو الجماعة؟','لعبوا','لعبو','لعبؤا','لعبأ'),
(8,'أنشطة تقويمية في الإملاء','أي كلمة تدل على مكان التعلم مكتوبة إملائيًا بصورة صحيحة؟','مدرسة','مدرسه','مدرست','مدرسا')
), scoped AS (
 SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
 JOIN public.units u ON u.id=l.unit_id AND u.semester=2 AND u.title='الجزء الثاني — الإملاء'
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=5 AND g.name_ar='الصف الخامس'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%'
)
INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم ضاديوم الأصلي — الإملاء','multiple_choice','assessment',s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G5_T2_RGS_ORIGINAL_20261008','historicalSource','BH_2025_2026_TERM_2_UNVERIFIED_2026_2027','notOfficialBook',true,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
jsonb_build_object('correct',s.correct),1,5,true,true FROM scoped s
WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G5_T2_RGS_ORIGINAL_20261008' AND a.activity_type='multiple_choice');

