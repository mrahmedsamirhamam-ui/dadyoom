-- Ten Dadyoom-original grade 2-3 term-one activities; matches the actual reviewed supporting passage,
-- not any Ministry book passage. No new curriculum title, no deletion, idempotent by origin.
WITH qa(grade_num,unit_title,sort_order,title,prompt,correct,w1,w2,w3,practice) AS (VALUES
(2,'المراجعة والمهارات',25,'أراجع الحروف (4)','أي كلمة تبدأ بحرف الضاد؟','ضوء','صبر','طائر','ظرف',NULL),
(2,'الوحدة الأولى: الحياة الاجتماعية',1,'الاستماع: السلحفاة والبطتان','كيف ساعدت السلحفاة والبطتان في الحفاظ على نظافة المكان؟','أخبرن المسؤول بوجود زجاجة قرب الماء','رمين النفايات في البحيرة','تركن المكان متسخًا','كسرن أغصان الأشجار',NULL),
(2,'الوحدة الثانية: تنظيم أوقات الفراغ',2,'الاستماع: عطلة نهاية الأسبوع','بماذا خطط خالد لوقت الصباح في عطلة نهاية الأسبوع؟','قراءة قصة قصيرة','اللعب بالكرة عصرًا','ترتيب الحقيبة مساءً','ترك الأنشطة دون تنظيم',NULL),
(2,'الوحدة الثالثة: المحافظة على الصحة',3,'الاستماع: الوقاية خير من العلاج','ماذا فعلت دانة قبل تناول الطعام بعد اللعب؟','غسلت يديها بالماء والصابون','تناولت الطعام بيدين متسختين','تركت الماء مفتوحًا','أخفت الحقيبة في ساحة اللعب',NULL),
(3,'الوحدة الأولى: قيم ومبادئ',1,'الاستماع: أريد أن ألعب معكم','كيف طلب سامر المشاركة في اللعب؟','انتظر انتهاء الجولة واستأذن بأدب','أخذ الكرة دون إذن','قاطع الجميع بصوت مرتفع','رفض تقسيم وقت اللعب',NULL),
(3,'الوحدة الأولى: قيم ومبادئ',2,'التحدث — الوحدة الأولى: قيم ومبادئ','أي سلوك يدل على الأمانة في الحوار الداعم؟','إعادة ما استعرته إلى صاحبه','الاحتفاظ بأغراض الآخرين','مقاطعة حديث الزميلة','عدم الاستئذان','كوّن حوارًا شفويًا من أربع جمل بين شخصين حول الأمانة واحترام حق الآخرين.'),
(3,'الوحدة الثانية: ألعاب وهوايات',3,'الاستماع: التصوير الفوتوغرافي','كيف احترمت لجين خصوصية زميلاتها عند التصوير؟','طلبت الإذن قبل التقاط الصورة','صورت الجميع دون سؤال','شاركت الصور دون موافقة','تجاهلت الخلفية والإضاءة',NULL),
(3,'الوحدة الثانية: ألعاب وهوايات',4,'التحدث — الوحدة الثانية: ألعاب وهوايات','كيف تعامل الطالبان مع اختلاف هواياتهما؟','احترما اهتمامات بعضهما','سخر كل منهما من الآخر','رفضا الحوار نهائيًا','منعا بعضهما من ممارسة الهواية','تحدث عن هوايتين مختلفتين، وقدم سببًا لحب كل واحدة منهما بلغة محترمة.'),
(3,'الوحدة الثالثة: مواقف وعبر',5,'الاستماع: حقيقة الكنز','ما الكنز غير المادي الذي وجدته هدى في الصندوق؟','رسائل وصور وذكريات الأسرة','قطعًا ذهبية فقط','ألعابًا إلكترونية','أوراقًا دراسية حديثة فقط',NULL),
(3,'الوحدة الثالثة: مواقف وعبر',6,'التحدث — الوحدة الثالثة: مواقف وعبر','ماذا فعل يوسف بالقلم الذي وجده؟','سلمه للمعلم ليعود إلى صاحبه','أخذه إلى البيت دون إذن','أخفاه عن زملائه','ألقاه بعيدًا','مثل حوارًا من أربع جمل يشرح كيف تعيد شيئًا مفقودًا إلى صاحبه وأهمية الأمانة.')
), scoped AS (
 SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.title=qa.unit_title AND u.semester=1
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=qa.grade_num
  AND g.name_ar=CASE qa.grade_num WHEN 2 THEN 'الصف الثاني' ELSE 'الصف الثالث' END
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%'
)
INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تقويم ضاديوم الأصلي — فهم الموقف','multiple_choice','assessment',s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G2_G3_T1_MISSING_ACTIVITY_20261008','notOfficialBookText',true,'reviewStatus','required',
 'options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3),
 'teacherReadAloudTwice',s.title LIKE 'الاستماع:%','officialAudioAvailable',false),
jsonb_build_object('correct',s.correct),1,5,true,true
FROM scoped s WHERE NOT EXISTS (
 SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G2_G3_T1_MISSING_ACTIVITY_20261008' AND a.activity_type='multiple_choice'
);

WITH qa(grade_num,unit_title,sort_order,title,prompt,correct,w1,w2,w3,practice) AS (VALUES
(2,'المراجعة والمهارات',25,'أراجع الحروف (4)','أي كلمة تبدأ بحرف الضاد؟','ضوء','صبر','طائر','ظرف',NULL),
(2,'الوحدة الأولى: الحياة الاجتماعية',1,'الاستماع: السلحفاة والبطتان','كيف ساعدت السلحفاة والبطتان في الحفاظ على نظافة المكان؟','أخبرن المسؤول بوجود زجاجة قرب الماء','رمين النفايات في البحيرة','تركن المكان متسخًا','كسرن أغصان الأشجار',NULL),
(2,'الوحدة الثانية: تنظيم أوقات الفراغ',2,'الاستماع: عطلة نهاية الأسبوع','بماذا خطط خالد لوقت الصباح في عطلة نهاية الأسبوع؟','قراءة قصة قصيرة','اللعب بالكرة عصرًا','ترتيب الحقيبة مساءً','ترك الأنشطة دون تنظيم',NULL),
(2,'الوحدة الثالثة: المحافظة على الصحة',3,'الاستماع: الوقاية خير من العلاج','ماذا فعلت دانة قبل تناول الطعام بعد اللعب؟','غسلت يديها بالماء والصابون','تناولت الطعام بيدين متسختين','تركت الماء مفتوحًا','أخفت الحقيبة في ساحة اللعب',NULL),
(3,'الوحدة الأولى: قيم ومبادئ',1,'الاستماع: أريد أن ألعب معكم','كيف طلب سامر المشاركة في اللعب؟','انتظر انتهاء الجولة واستأذن بأدب','أخذ الكرة دون إذن','قاطع الجميع بصوت مرتفع','رفض تقسيم وقت اللعب',NULL),
(3,'الوحدة الأولى: قيم ومبادئ',2,'التحدث — الوحدة الأولى: قيم ومبادئ','أي سلوك يدل على الأمانة في الحوار الداعم؟','إعادة ما استعرته إلى صاحبه','الاحتفاظ بأغراض الآخرين','مقاطعة حديث الزميلة','عدم الاستئذان','كوّن حوارًا شفويًا من أربع جمل بين شخصين حول الأمانة واحترام حق الآخرين.'),
(3,'الوحدة الثانية: ألعاب وهوايات',3,'الاستماع: التصوير الفوتوغرافي','كيف احترمت لجين خصوصية زميلاتها عند التصوير؟','طلبت الإذن قبل التقاط الصورة','صورت الجميع دون سؤال','شاركت الصور دون موافقة','تجاهلت الخلفية والإضاءة',NULL),
(3,'الوحدة الثانية: ألعاب وهوايات',4,'التحدث — الوحدة الثانية: ألعاب وهوايات','كيف تعامل الطالبان مع اختلاف هواياتهما؟','احترما اهتمامات بعضهما','سخر كل منهما من الآخر','رفضا الحوار نهائيًا','منعا بعضهما من ممارسة الهواية','تحدث عن هوايتين مختلفتين، وقدم سببًا لحب كل واحدة منهما بلغة محترمة.'),
(3,'الوحدة الثالثة: مواقف وعبر',5,'الاستماع: حقيقة الكنز','ما الكنز غير المادي الذي وجدته هدى في الصندوق؟','رسائل وصور وذكريات الأسرة','قطعًا ذهبية فقط','ألعابًا إلكترونية','أوراقًا دراسية حديثة فقط',NULL),
(3,'الوحدة الثالثة: مواقف وعبر',6,'التحدث — الوحدة الثالثة: مواقف وعبر','ماذا فعل يوسف بالقلم الذي وجده؟','سلمه للمعلم ليعود إلى صاحبه','أخذه إلى البيت دون إذن','أخفاه عن زملائه','ألقاه بعيدًا','مثل حوارًا من أربع جمل يشرح كيف تعيد شيئًا مفقودًا إلى صاحبه وأهمية الأمانة.')
), scoped AS (
 SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.title=qa.unit_title AND u.semester=1
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=qa.grade_num
  AND g.name_ar=CASE qa.grade_num WHEN 2 THEN 'الصف الثاني' ELSE 'الصف الثالث' END
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%'
)
INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'ممارسة تحدث — تقييم المعلم','speaking','practice',s.practice,
jsonb_build_object('origin','DADYOOM_BH_G2_G3_T1_MISSING_ACTIVITY_20261008','notOfficialBookText',true,'humanReviewRequired',true,'text',s.practice,'qualityAutoVerified',false),
jsonb_build_object('grading_mode','completion_only_reference','model_answer','يحتاج التحدث إلى تقويم بشري لسلامة التعبير والأداء؛ إكمال النشاط لا يثبت جودة الحديث.'),2,5,true,true
FROM scoped s WHERE s.practice IS NOT NULL AND NOT EXISTS (
 SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G2_G3_T1_MISSING_ACTIVITY_20261008' AND a.activity_type='speaking'
);