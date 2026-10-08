-- Source-cautious, original Dadyoom spelling activities for historical BH term 2 topics.
-- NOT a verified 2026/27 official-book contents list; insert only into the matching lessons.
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
    (1,'الهمزة المتطرفة بعد حرف مضموم','أي كتابة صحيحة للكلمة بعد ضم الحرف السابق للهمزة المتطرفة؟','تباطؤ','تباطئ','تباطأ','تباطء'),
    (2,'الهمزة المتطرفة بعد حرف مكسور','أي كتابة صحيحة لكلمة «شاطِئ»؟','شاطئ','شاطأ','شاطؤ','شاطء'),
    (3,'الهمزة المتطرفة المسبوقة بحرف ممدود أو ساكن','أكمل «سما_» برسم الهمزة الصحيح.','سماء','سمائ','سماؤ','سماأ'),
    (4,'دخول اللام على الاسم المبدوء باللام','كيف تكتب «اللّيل» بعد دخول لام الجر؟','للّيل','لالليل','لاللّيل','الليل'),
    (5,'دخول اللام والباء على الاسم المعرّف بـ(ال)','كيف تكتب «الحديقة» عند دخول حرف الجر الباء عليها؟','بالحديقة','ب الحديقة','بألحديقة','بلحديقة'),
    (6,'الألف اللينة','ما الكتابة الصحيحة للفعل الدال على المشي السريع نحو الهدف: «سعى»؟','سعى','سعا','سعاء','سعئ'),
    (7,'أصوات تنطق ولا تكتب وحروف تكتب ولا تنطق','أي صوت مد نسمعه بعد الهاء في كلمة «هذا» ولا نكتبه ألفًا مستقلة؟','صوت الألف','صوت الواو','صوت الياء','صوت الهمزة'),
    (8,'الهمزة المتوسطة الساكنة وما قبلها مفتوح','أي رسم للهمزة صحيح في كلمة «رَأْس»؟','رَأْس','رَؤْس','رَئْس','رَءْس'),
    (9,'الهمزة المتوسطة المفتوحة وما قبلها مفتوح','أي كتابة صحيحة للفعل الذي يعني طرح السؤال؟','سَأَلَ','سَؤَلَ','سَئَلَ','سَءَلَ'),
    (10,'تدريبات للمراجعة في الإملاء','ما التصحيح الصحيح لكلمة «مدرسه» إذا قصدنا مكان التعلم؟','مدرسة','مدرسه','مدرست','مدرسات')
), scoped AS (
 SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
 JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — الإملاء' AND u.semester=2
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=4 AND g.name_ar='الصف الرابع'
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content ILIKE '%ضاديوم%'
)
INSERT INTO public.lesson_activities
 (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تطبيق إملائي أصلي — ضاديوم','multiple_choice','assessment',s.prompt,
 jsonb_build_object('origin','DADYOOM_BH_G4_T2_SPELLING_MCQ_V1','sourceStatus','HISTORICAL_2025_2026_NOT_VERIFIED_FOR_2026_2027','bookTextCopied',false,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
 jsonb_build_object('correct',s.correct),1,5,true,true
FROM scoped s
WHERE NOT EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G4_T2_SPELLING_MCQ_V1');
