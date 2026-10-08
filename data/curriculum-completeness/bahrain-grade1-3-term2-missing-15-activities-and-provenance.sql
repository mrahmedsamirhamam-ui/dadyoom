-- Original small-child-friendly Dadyoom exercises for historical semester-two lessons.
-- Title-only prediction questions are not claims about absent/unverified song or story bodies.
WITH qa(grade_number,unit_title,sort_order,title,prompt,correct,w1,w2,w3) AS (VALUES
(1,'الجزء الثاني — الوحدة الأولى: وطننا',90,'أعزز مكتسباتي — الوحدة الأولى','ما الحرف الأول في كلمة «شمس»؟','ش','ص','ف','ك'),
(1,'الجزء الثاني — الوحدة الأولى: وطننا',91,'أنشودة الوحدة الأولى: بحرين يا أغلى وطن','من عنوان الأنشودة فقط، ما الموضوع الذي تتوقع أن تتناوله؟','الوطن والبحرين','إصلاح الدراجة','حل مسألة حسابية','طرق البرمجة'),
(1,'الجزء الثاني — الوحدة الأولى: وطننا',92,'قصة الوحدة الأولى: حمدان يزور مملكة البحرين','ماذا تتوقع من عنوان «حمدان يزور مملكة البحرين» وحده؟','زيارة إلى البحرين','رحلة إلى الفضاء','سباق للدراجات','طبخ الطعام'),
(1,'الجزء الثاني — الوحدة الثانية: ألعابنا وهواياتنا',90,'أعزز مكتسباتي — الوحدة الثانية','ما الحرف الأول في كلمة «طائرة»؟','ط','ق','ز','خ'),
(1,'الجزء الثاني — الوحدة الثانية: ألعابنا وهواياتنا',91,'أنشودة الوحدة الثانية: هيا نقرأ','ما النشاط الذي نتوقعه من عنوان «هيا نقرأ»؟','القراءة','السباحة','الرسم على الجدار','زراعة شجرة'),
(1,'الجزء الثاني — الوحدة الثانية: ألعابنا وهواياتنا',92,'قصة الوحدة الثانية: فاطمة تحب القراءة','ما الهواية التي نعرفها من عنوان القصة فقط؟','القراءة','الرياضة','التصوير','السباحة'),
(1,'الجزء الثاني — الوحدة الثالثة: بيئتنا وصحتنا',90,'أعزز مكتسباتي — الوحدة الثالثة','ما الحرف الأول في كلمة «غزال»؟','غ','ظ','هـ','و'),
(1,'الجزء الثاني — الوحدة الثالثة: بيئتنا وصحتنا',91,'أنشودة الوحدة الثالثة: في حينا حديقة','ما المكان المذكور صراحةً في عنوان «في حينا حديقة»؟','الحديقة','المطار','المستشفى','السوق'),
(1,'الجزء الثاني — الوحدة الثالثة: بيئتنا وصحتنا',92,'قصة الوحدة الثالثة: كيف أحافظ على صحتي؟','ما موضوع العنوان المتوقع دون ادعاء معرفة أحداث القصة؟','المحافظة على الصحة','بناء الطائرات','دراسة الكواكب','إصلاح السيارات'),
(2,'الجزء الثاني — الوحدة الأولى: وطني البحرين',0,'الاستماع: اللاعب الماهر','ماذا فعل سليم عندما تعثر زميله في قصة ضاديوم الداعمة؟','ساعده على النهوض','تركه دون مساعدة','سخر منه','أوقف اللعب ليخفي الكرة'),
(2,'الجزء الثاني — الوحدة الثانية: البيئة في بلادي',0,'الاستماع: نعمة الماء','ما أول عمل قام به عمر عند ملاحظة هدر الماء؟','أغلق الصنبور جيدًا','ترك الصنبور مفتوحًا','زاد تدفق الماء','أدار ظهره وغادر'),
(2,'الجزء الثاني — الوحدة الثالثة: اختراعات وابتكارات',0,'الاستماع: المجرة الصغيرة','هل النموذج الورقي في درس ضاديوم صورة حقيقية للفضاء؟','لا، إنه نموذج يوضح الفكرة','نعم، إنه صورة مباشرة للمجرة','نعم، لأنه يتحرك وحده','نعم، لأن حجمه مثل الفضاء'),
(3,'الجزء الثاني — الوحدة الأولى: في حب الوطن',0,'الاستماع: مزرعتي','ما السلوك الصحيح الذي طلبه والد سارة في فقرة المزرعة؟','عدم قطف الثمار دون إذن والمحافظة على نظافة المكان','قطف كل الثمار دون سؤال','إلقاء القمامة في الممرات','كسر الأغصان أثناء الزيارة'),
(3,'الجزء الثاني — الوحدة الثانية: البيئة والصحة',0,'الاستماع: الإنسان يقطع أشجار الغابة','لماذا ينبغي المحافظة على أشجار الغابة في النص الداعم؟','لأنها توفر مواطن للكائنات وتساعد البيئة','لأن قطعها لا يؤثر في أي كائن','لأن الغابة لا يوجد فيها حيوان','لأن التلوث ينظف الطبيعة'),
(3,'الجزء الثاني — الوحدة الثالثة: مشاهد من الطفولة',0,'الاستماع: ما أجمل اللعب في ساحة الحي!','ماذا فعل الأطفال عندما وصلت مجموعة أخرى إلى ساحة اللعب؟','دعوها للمشاركة واحترموا رغبات الجميع','طردوا المجموعة الجديدة','أغلقوا الممرات','منعوها من كل الألعاب')
), scoped AS (
 SELECT l.id,qa.* FROM qa
 JOIN public.lessons l ON l.title=qa.title AND l.sort_order=qa.sort_order AND l.status='published'
 JOIN public.units u ON u.id=l.unit_id AND u.semester=2 AND u.title=qa.unit_title
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=qa.grade_number
  AND g.name_ar=CASE qa.grade_number WHEN 1 THEN 'الصف الأول' WHEN 2 THEN 'الصف الثاني' ELSE 'الصف الثالث' END
 JOIN public.curricula cu ON cu.id=g.curriculum_id AND cu.academic_year='2026-2027'
 JOIN public.countries c ON c.id=cu.country_id AND c.code='BH'
 WHERE length(coalesce(l.content,''))>350 AND l.content LIKE '%ضاديوم%'
)
INSERT INTO public.lesson_activities (lesson_id,title,activity_type,section,prompt,content,answer,activity_order,points,is_required,is_published)
SELECT s.id,'أنشطة ضاديوم الأصلية للتعلم','multiple_choice','assessment',s.prompt,
jsonb_build_object('origin','DADYOOM_BH_G1_G3_T2_MISSING_ACTIVITY_SOURCE_CAUTIOUS_20261008','notMinistryText',true,'bookContentUnverified',true,'reviewStatus','required',
 'studentInstruction',CASE WHEN s.grade_number=1 AND s.sort_order IN (91,92) THEN 'التوقع من العنوان فقط؛ لا يدّعي معرفة كلمات الأنشودة أو أحداث القصة.' ELSE 'تدريب دعم أصلي لا يحل محل النص الرسمي.' END,
 'options',jsonb_build_array(s.correct,s.w1,s.w2,s.w3)),
jsonb_build_object('correct',s.correct),1,5,true,true
FROM scoped s WHERE NOT EXISTS (
 SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=s.id AND a.content->>'origin'='DADYOOM_BH_G1_G3_T2_MISSING_ACTIVITY_SOURCE_CAUTIOUS_20261008'
);

-- Replace legacy misleading first line only, preserve remainder of lesson content.
UPDATE public.lessons l
 SET content='دعم أصلي من ضاديوم للتدريب اللغوي، وليس نص الكتاب المدرسي. مطابقة هذا القسم بخطة الفصل الثاني وفهرس الكتاب الرسمي لعام 2026–2027 ما زالت غير مثبتة.' || substring(l.content from char_length('محتوى من كتاب رسمي. خطة الفصل الثاني 2026-2027 لم تُنشر حتى آخر مراجعة؛ لذلك لا يُعرض هذا العنصر على أنه مقرر حاليًا.')+1),updated_at=now()
 FROM public.units u JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula cu ON cu.id=g.curriculum_id
 JOIN public.countries c ON c.id=cu.country_id
 WHERE l.unit_id=u.id AND c.code='BH' AND cu.academic_year='2026-2027'
 AND g.grade_number=1 AND g.name_ar='الصف الأول'
 AND u.semester=2 AND left(l.content,char_length('محتوى من كتاب رسمي. خطة الفصل الثاني 2026-2027 لم تُنشر حتى آخر مراجعة؛ لذلك لا يُعرض هذا العنصر على أنه مقرر حاليًا.'))='محتوى من كتاب رسمي. خطة الفصل الثاني 2026-2027 لم تُنشر حتى آخر مراجعة؛ لذلك لا يُعرض هذا العنصر على أنه مقرر حاليًا.'
 AND l.content LIKE '%ضاديوم%';

-- Replace legacy misleading first line only, preserve remainder of lesson content.
UPDATE public.lessons l
 SET content='دعم أصلي من ضاديوم للتدريب اللغوي، وليس نص الكتاب المدرسي. مطابقة هذا القسم بخطة الفصل الثاني وفهرس الكتاب الرسمي لعام 2026–2027 ما زالت غير مثبتة.' || substring(l.content from char_length('محتوى كتاب رسمي للجزء الثاني. خطة الفصل الثاني 2026-2027 غير منشورة حتى آخر مراجعة، لذا لا يُعرض هذا العنصر على أنه مقرر حاليًا.')+1),updated_at=now()
 FROM public.units u JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula cu ON cu.id=g.curriculum_id
 JOIN public.countries c ON c.id=cu.country_id
 WHERE l.unit_id=u.id AND c.code='BH' AND cu.academic_year='2026-2027'
 AND g.grade_number=2 AND g.name_ar='الصف الثاني'
 AND u.semester=2 AND left(l.content,char_length('محتوى كتاب رسمي للجزء الثاني. خطة الفصل الثاني 2026-2027 غير منشورة حتى آخر مراجعة، لذا لا يُعرض هذا العنصر على أنه مقرر حاليًا.'))='محتوى كتاب رسمي للجزء الثاني. خطة الفصل الثاني 2026-2027 غير منشورة حتى آخر مراجعة، لذا لا يُعرض هذا العنصر على أنه مقرر حاليًا.'
 AND l.content LIKE '%ضاديوم%';

-- Replace legacy misleading first line only, preserve remainder of lesson content.
UPDATE public.lessons l
 SET content='دعم أصلي من ضاديوم للتدريب اللغوي، وليس نص الكتاب المدرسي. مطابقة هذا القسم بخطة الفصل الثاني وفهرس الكتاب الرسمي لعام 2026–2027 ما زالت غير مثبتة.' || substring(l.content from char_length('محتوى كتاب رسمي للجزء الثاني. لا يُعرض على أنه مقرر في 2026-2027 قبل نشر خطة الفصل الثاني الحالية.')+1),updated_at=now()
 FROM public.units u JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula cu ON cu.id=g.curriculum_id
 JOIN public.countries c ON c.id=cu.country_id
 WHERE l.unit_id=u.id AND c.code='BH' AND cu.academic_year='2026-2027'
 AND g.grade_number=3 AND g.name_ar='الصف الثالث'
 AND u.semester=2 AND left(l.content,char_length('محتوى كتاب رسمي للجزء الثاني. لا يُعرض على أنه مقرر في 2026-2027 قبل نشر خطة الفصل الثاني الحالية.'))='محتوى كتاب رسمي للجزء الثاني. لا يُعرض على أنه مقرر في 2026-2027 قبل نشر خطة الفصل الثاني الحالية.'
 AND l.content LIKE '%ضاديوم%';
