-- Accurate source disclosure: old legacy first sentence falsely implied official book text.
-- Preserve all remaining authored content. Only grade 5/6, BH, 2026/27 rows flagged official-book-unscheduled.

UPDATE public.lessons l
SET content = 'مادة تعليمية إثرائية أصلية من ضاديوم للصف الخامس، وليست نصًّا رسميًّا من الكتاب المدرسي. موضوعات هذا القسم مأخوذة من خطة تاريخية للفصل الثاني 2025–2026، ولم تتحقق بعد مطابقتها للخطة وفهارس كتب العام 2026–2027.' || substring(l.content from char_length('محتوى من كتب رسمية مقررة للصف الخامس. خريطة التفصيل من خطة الوزارة للفصل الثاني 2025-2026، ولا تعني أنه مجدول حاليًا في 2026-2027 قبل نشر الخطة الجديدة.')+1),
updated_at=now()
FROM public.units u
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula cu ON cu.id=g.curriculum_id
JOIN public.countries c ON c.id=cu.country_id
WHERE l.unit_id=u.id AND c.code='BH' AND cu.academic_year='2026-2027'
AND g.name_ar='الصف الخامس' AND g.grade_number=5
AND u.semester=2 AND l.official_content_scope='official-book-unscheduled'
AND left(l.content,char_length('محتوى من كتب رسمية مقررة للصف الخامس. خريطة التفصيل من خطة الوزارة للفصل الثاني 2025-2026، ولا تعني أنه مجدول حاليًا في 2026-2027 قبل نشر الخطة الجديدة.'))='محتوى من كتب رسمية مقررة للصف الخامس. خريطة التفصيل من خطة الوزارة للفصل الثاني 2025-2026، ولا تعني أنه مجدول حاليًا في 2026-2027 قبل نشر الخطة الجديدة.'
AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%';

UPDATE public.lessons l
SET content = 'مادة تعليمية إثرائية أصلية من ضاديوم للصف السادس، وليست نصًّا رسميًّا من الكتاب المدرسي. موضوعات هذا القسم مأخوذة من خطة تاريخية للفصل الثاني 2025–2026، ولم تتحقق بعد مطابقتها للخطة وفهارس كتب العام 2026–2027.' || substring(l.content from char_length('محتوى من كتب رسمية مقررة للصف السادس. خريطة التفصيل من خطة الوزارة للفصل الثاني 2025-2026، ولا تعني أنه مجدول حاليًا في 2026-2027 قبل نشر الخطة الجديدة.')+1),
updated_at=now()
FROM public.units u
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula cu ON cu.id=g.curriculum_id
JOIN public.countries c ON c.id=cu.country_id
WHERE l.unit_id=u.id AND c.code='BH' AND cu.academic_year='2026-2027'
AND g.name_ar='الصف السادس' AND g.grade_number=6
AND u.semester=2 AND l.official_content_scope='official-book-unscheduled'
AND left(l.content,char_length('محتوى من كتب رسمية مقررة للصف السادس. خريطة التفصيل من خطة الوزارة للفصل الثاني 2025-2026، ولا تعني أنه مجدول حاليًا في 2026-2027 قبل نشر الخطة الجديدة.'))='محتوى من كتب رسمية مقررة للصف السادس. خريطة التفصيل من خطة الوزارة للفصل الثاني 2025-2026، ولا تعني أنه مجدول حاليًا في 2026-2027 قبل نشر الخطة الجديدة.'
AND l.content LIKE '%ضاديوم%' AND l.content LIKE '%2025-2026%';
