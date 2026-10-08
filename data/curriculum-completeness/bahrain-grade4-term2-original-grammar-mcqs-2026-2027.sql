-- Original Dadyoom grammar drills, not sourced from official book text.
-- Historical Bahrain 2025/26 scope has not been validated as the 2026/27 textbook TOC.
WITH qa(sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
    (1,'أنواع الفعل','ما نوع الفعل «يكتبُ»؟','مضارع','ماضٍ','أمر','اسم'),
    (2,'ضمائر الرفع المنفصلة','أي ضمير يناسب الجملة «____ نعمل معًا»؟','نحن','أنا','هو','هي'),
    (3,'أدوات الاستفهام','أي أداة استفهام نسأل بها عن المكان؟','أين','متى','من','لماذا'),
    (4,'حروف الجر','ما حرف الجر في «ذهبتُ إلى المدرسة»؟','إلى','ذهبتُ','المدرسة','الـ'),
    (5,'أدوات النفي: لا، لن','ما الأداة المناسبة لنفي فعل مستقبلي في «____ أتأخرَ غدًا»؟','لن','هل','من','يا'),
    (6,'أسماء الإشارة','أي جملة تستخدم اسم الإشارة المناسب؟','هذه شجرة','هذا شجرة','هؤلاء شجرة','ذلك شجرتان قريبتان'),
    (7,'الاسم الموصول','أكمل «الطالبة ____ كتبت الرسالة» باسم موصول صحيح.','التي','الذي','اللذان','الذين'),
    (8,'مطابقة الصفة للموصوف','أي عبارة فيها صفة مطابقة للموصوف؟','الوردة الجميلة','الوردة الجميل','كتاب مفيدة','قصة مفيد'),
    (9,'ظرف الزمان وظرف المكان','ما ظرف المكان في «جلس سامر خلفَ الشجرة»؟','خلفَ','سامر','جلس','الشجرة'),
    (10,'النداء','ما أداة النداء في «يا مريمُ، تعالي»؟','يا','مريم','تعالي','الفاصلة'),
    (11,'مراجعة القواعد النحوية والإملائية','ما حرف الجر في «هذا الطالب يكتبُ في الدفتر»؟','في','هذا','الطالب','يكتبُ')
), scoped AS (
  SELECT l.id,qa.* FROM qa
  JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order
  JOIN public.units u ON u.id=l.unit_id AND u.title='الجزء الثاني — القواعد والتراكيب' AND u.semester=2
  JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=4 AND g.name_ar='الصف الرابع'
  JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
  JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
  WHERE length(coalesce(l.content,''))>350 AND l.content ILIKE '%ضاديوم%'
)
INSERT INTO public.lesson_activities
 (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'تطبيق نحوي أصلي — ضاديوم','multiple_choice','assessment',s.prompt,
 jsonb_build_object('origin','DADYOOM_BH_G4_T2_GRAMMAR_MCQ_V1','sourceStatus','HISTORICAL_2025_2026_NOT_VERIFIED_FOR_2026_2027','bookTextCopied',false,'reviewStatus','required','options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
 jsonb_build_object('correct',s.correct),1,5,true,true
FROM scoped s
WHERE NOT EXISTS (SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G4_T2_GRAMMAR_MCQ_V1');
