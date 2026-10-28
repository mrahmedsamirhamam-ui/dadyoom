-- DADYOOM READ-ONLY | Bahrain Grade 1-3 term-one source-title reconciliation
-- Scope: titles and stored teaching-material markers only. No official text, answers or student data.
-- Sources (previously indexed from official 2026-2027 PDFs; source bytes are not committed):
--  data/bahrain-arabic/grade-01-sem1-curriculum.json
--  data/curriculum-sources/bahrain-2026-s1-ministry-plan-index.json
-- The 18 grade-one source headings are checked against exact unit + title.
-- Grade-two and grade-three reading headings require OCR-aware matching:
--  remove tatweel, diacritics, spaces and punctuation, normalize alef,
--  but KEEP numerals to distinguish '(1)' from '(2)'.
-- A match is NOT proof of official textbook content, edition or teaching quality.
-- Recheck current source edition and actual textbook TOC before publishing.
-- This is SELECT only, with no elevated roles or SECURITY DEFINER.

WITH expected(seq,country_code,grade_number,semester,source_group,source_unit,source_title,book_page,plan_pdf_page) AS (
  VALUES
    (1,'BH',1,1,'grade_1_source_index','الوحدة الأولى: عائلتنا','الدرس الأول: حرف (ب) (1)',8,NULL),
    (2,'BH',1,1,'grade_1_source_index','الوحدة الأولى: عائلتنا','الدرس الثاني: حرف (ب) (2)',22,NULL),
    (3,'BH',1,1,'grade_1_source_index','الوحدة الأولى: عائلتنا','الدرس الثالث: حرف (م)',35,NULL),
    (4,'BH',1,1,'grade_1_source_index','الوحدة الأولى: عائلتنا','الدرس الرابع: حرف (د)',49,NULL),
    (5,'BH',1,1,'grade_1_source_index','الوحدة الأولى: عائلتنا','الدرس الخامس: أعزز مكتسباتي',62,NULL),
    (6,'BH',1,1,'grade_1_source_index','الوحدة الأولى: عائلتنا','أنشودة الوحدة: أسرتي',66,NULL),
    (7,'BH',1,1,'grade_1_source_index','الوحدة الثانية: مدرستنا','الدرس السادس: حرف (ح)',68,NULL),
    (8,'BH',1,1,'grade_1_source_index','الوحدة الثانية: مدرستنا','الدرس السابع: حرف (ر)',82,NULL),
    (9,'BH',1,1,'grade_1_source_index','الوحدة الثانية: مدرستنا','الدرس الثامن: حرف (س)',97,NULL),
    (10,'BH',1,1,'grade_1_source_index','الوحدة الثانية: مدرستنا','الدرس التاسع: حرف (ل)',110,NULL),
    (11,'BH',1,1,'grade_1_source_index','الوحدة الثانية: مدرستنا','الدرس العاشر: أعزز مكتسباتي',124,NULL),
    (12,'BH',1,1,'grade_1_source_index','الوحدة الثانية: مدرستنا','أنشودة الوحدة: مدرستي',130,NULL),
    (13,'BH',1,1,'grade_1_source_index','الوحدة الثالثة: حينا','الدرس الحادي عشر: حرف (ج)',132,NULL),
    (14,'BH',1,1,'grade_1_source_index','الوحدة الثالثة: حينا','الدرس الثاني عشر: حرف (ن)',145,NULL),
    (15,'BH',1,1,'grade_1_source_index','الوحدة الثالثة: حينا','الدرس الثالث عشر: حرف (ع)',157,NULL),
    (16,'BH',1,1,'grade_1_source_index','الوحدة الثالثة: حينا','الدرس الرابع عشر: حرف (ت)',169,NULL),
    (17,'BH',1,1,'grade_1_source_index','الوحدة الثالثة: حينا','الدرس الخامس عشر: أعزز مكتسباتي',182,NULL),
    (18,'BH',1,1,'grade_1_source_index','الوحدة الثالثة: حينا','أنشودة الوحدة: جاري',187,NULL),
    (19,'BH',2,1,'ministerial_reading_plan','الحياة الاجتماعية','صديقتي مريم',NULL,11),
    (20,'BH',2,1,'ministerial_reading_plan','الحياة الاجتماعية','بالروح أفديها',NULL,11),
    (21,'BH',2,1,'ministerial_reading_plan','الحياة الاجتماعية','سالم مريض',NULL,11),
    (22,'BH',2,1,'ministerial_reading_plan','الحياة الاجتماعية','تعاون النمل',NULL,11),
    (23,'BH',2,1,'ministerial_reading_plan','تنظيم أوقات الفراغ','المصور الصغير',NULL,12),
    (24,'BH',2,1,'ministerial_reading_plan','تنظيم أوقات الفراغ','دراجتي',NULL,12),
    (25,'BH',2,1,'ministerial_reading_plan','تنظيم أوقات الفراغ','جولة في محمية محمد بن زايد الطبيعية',NULL,12),
    (26,'BH',2,1,'ministerial_reading_plan','تنظيم أوقات الفراغ','الطائرة الورقية',NULL,12),
    (27,'BH',2,1,'ministerial_reading_plan','المحافظة على الصحة','في عيادة العيون',NULL,13),
    (28,'BH',2,1,'ministerial_reading_plan','المحافظة على الصحة','نظافتي',NULL,13),
    (29,'BH',2,1,'ministerial_reading_plan','المحافظة على الصحة','الرياضة غيّرت حياتي',NULL,13),
    (30,'BH',2,1,'ministerial_reading_plan','المحافظة على الصحة','الغذاء الصحي',NULL,13),
    (31,'BH',3,1,'ministerial_reading_plan','قيم ومبادئ','الأصدقاء الأربعة (1)',NULL,14),
    (32,'BH',3,1,'ministerial_reading_plan','قيم ومبادئ','الأصدقاء الأربعة (2)',NULL,14),
    (33,'BH',3,1,'ministerial_reading_plan','قيم ومبادئ','حكمة أب',NULL,14),
    (34,'BH',3,1,'ministerial_reading_plan','قيم ومبادئ','وتعاونوا',NULL,14),
    (35,'BH',3,1,'ministerial_reading_plan','ألعاب وهوايات','الولع بالرسم (1)',NULL,15),
    (36,'BH',3,1,'ministerial_reading_plan','ألعاب وهوايات','الولع بالرسم (2)',NULL,15),
    (37,'BH',3,1,'ministerial_reading_plan','ألعاب وهوايات','وقت الراحات',NULL,15),
    (38,'BH',3,1,'ministerial_reading_plan','ألعاب وهوايات','لعبة يحبها الملايين',NULL,15),
    (39,'BH',3,1,'ministerial_reading_plan','مواقف وعبر','الأمانة (1)',NULL,15),
    (40,'BH',3,1,'ministerial_reading_plan','مواقف وعبر','الأمانة (2)',NULL,16),
    (41,'BH',3,1,'ministerial_reading_plan','مواقف وعبر','جزاء المعتدي',NULL,16),
    (42,'BH',3,1,'ministerial_reading_plan','مواقف وعبر','دروس من حياة توماس إديسون',NULL,16)
),
expected_normalized AS (
 SELECT e.*,
 regexp_replace(translate(replace(e.source_title,'ـ',''),'أإآ','ااا'),'[^ء-ي0-9٠-٩]','','g') AS normalized_title
 FROM expected e
),
existing AS (
 SELECT co.code AS country_code,g.grade_number,u.semester AS unit_semester,c.name_ar AS curriculum_name,
 u.title AS unit_title,l.id AS lesson_id,l.title AS stored_title,l.status AS lesson_status,
 regexp_replace(translate(replace(l.title,'ـ',''),'أإآ','ااا'),'[^ء-ي0-9٠-٩]','','g') AS normalized_title,
 (l.content LIKE 'يتناول هذا الدرس موضوع%') AS is_generic_scaffold,
 (l.content LIKE 'مسار القراءة والفهم الأصلي%' OR l.content LIKE 'إثراء ضاديوم الأصلي%') AS is_dadyoom_original_support,
 (SELECT COUNT(*) FROM public.questions q WHERE q.lesson_id=l.id) AS stored_questions
 FROM public.lessons l
 JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula c ON c.id=g.curriculum_id
 JOIN public.countries co ON co.id=c.country_id
 WHERE co.code='BH' AND c.name_ar='اللغة العربية' AND g.grade_number BETWEEN 1 AND 3
)
SELECT e.seq,e.grade_number,e.semester,e.source_group,e.source_unit,e.source_title,
 e.book_page,e.plan_pdf_page,
 COUNT(x.lesson_id) AS title_candidate_rows,
 COUNT(x.lesson_id) FILTER(WHERE x.lesson_status='published') AS published_title_candidates,
 COUNT(x.lesson_id) FILTER(WHERE x.is_generic_scaffold) AS generic_scaffold_candidates,
 COUNT(x.lesson_id) FILTER(WHERE x.is_dadyoom_original_support) AS original_support_candidates,
 COUNT(x.lesson_id) FILTER(WHERE x.stored_questions>=3) AS candidates_with_three_questions,
 COALESCE(jsonb_agg(jsonb_build_object(
  'id',x.lesson_id,'stored_title',x.stored_title,
  'unit',x.unit_title,'status',x.lesson_status,
  'generic',x.is_generic_scaffold,'original_support',x.is_dadyoom_original_support
 )) FILTER(WHERE x.lesson_id IS NOT NULL),'[]'::jsonb) AS candidate_details,
 CASE
  WHEN COUNT(x.lesson_id)=0 THEN 'REVIEW_SOURCE_TITLE_NOT_FOUND'
  WHEN COUNT(x.lesson_id)>1 THEN 'REVIEW_MULTIPLE_OCR_CANDIDATES'
  WHEN COUNT(x.lesson_id) FILTER(WHERE x.is_dadyoom_original_support)=0
    AND e.grade_number>1 THEN 'REVIEW_GENERIC_OR_OTHER_MATERIAL'
  ELSE 'TITLE_PRESENT_CONTENT_AND_SOURCE_STILL_REQUIRE_REVIEW'
 END AS next_action
FROM expected_normalized e
LEFT JOIN existing x ON x.country_code=e.country_code
 AND x.grade_number=e.grade_number
 AND (
  (e.grade_number=1 AND x.stored_title=e.source_title AND x.unit_title=e.source_unit)
  OR (e.grade_number IN (2,3) AND x.unit_title='القراءة والنصوص' AND x.normalized_title LIKE '%' || e.normalized_title || '%')
 )
GROUP BY e.seq,e.grade_number,e.semester,e.source_group,e.source_unit,e.source_title,e.book_page,e.plan_pdf_page
ORDER BY e.seq;
