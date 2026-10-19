-- Bahrain Arabic Grade 1, Semester 2: original Dadyoom objectives for three
-- already-published, book-unscheduled letter lessons. Not official TOC certification.
-- Safe idempotent patch: replaces only missing objectives; never changes statuses,
-- semester, official_content_scope, books, source links, or other lessons.
--
-- Verification performed against BH / language Arabic / grade 1 / semester 2.
WITH desired (id, expected_title, objectives) AS (
  VALUES
    ('e85c153c-3d69-471f-b93c-a4726b73485d'::uuid, 'الدرس الثالث: حرف (ك)'::text, '["أن يميّز المتعلم صوت حرف الكاف (ك) مع الفتحة والكسرة والضمة في أنشطة استماع موجّهة.","أن يحدد المتعلم موضع حرف الكاف في كلمات معروضة مثل «كتاب» و«مكتب» و«سمك» بمساعدة المعلم.","أن يكتب المتعلم حرف الكاف في أوضاعه المناسبة بعد المحاكاة والتتبع، ثم ينطق كلمة تحتويه."]'::jsonb),
    ('97ff78ad-d774-4a51-a860-8ca8c3d00ea2'::uuid, 'الدرس الرابع: حرفا (ف) و(أ)'::text, '["أن يميّز المتعلم سمعيًّا وبصريًّا بين حرف الفاء (ف) وحرف الألف بهمزة فوقه (أ) في بطاقات ملائمة لعمره.","أن يصنّف المتعلم كلمات مثل «فم» و«سقف» و«أسد» و«سأل» حسب وجود الحرف المستهدف.","أن يحاكي المتعلم كتابة الحرفين (ف) و(أ)، ثم يختار كلمة صحيحة تبدأ بأحدهما شفويًّا."]'::jsonb),
    ('ad069dd9-052d-47fe-8c03-5c4ff9381cdb'::uuid, 'الدرس الثامن: حرفا (خ) و(ذ)'::text, '["أن يميّز المتعلم بين صوتي الخاء (خ) والذال (ذ) عند الاستماع إلى نماذج قصيرة واضحة.","أن يحدد المتعلم الحرف المستهدف وموضعه في كلمات مثل «خبز» و«نخلة» و«ذهب» و«أذن».","أن يكتب المتعلم الحرفين (خ) و(ذ) بالمحاكاة، ثم يصنّف بطاقات كلمات إلى مجموعتين صحيحتين."]'::jsonb)
), eligible AS (
  SELECT l.id, d.objectives
  FROM public.lessons l
  JOIN desired d ON d.id=l.id AND d.expected_title=l.title
  JOIN public.units u ON u.id=l.unit_id
  JOIN public.grades g ON g.id=u.grade_id
  JOIN public.curricula cr ON cr.id=g.curriculum_id
  JOIN public.countries c ON c.id=cr.country_id
  WHERE c.code='BH' AND cr.name_ar='اللغة العربية'
    AND g.grade_number=1 AND l.semester=2
    AND l.status='published'
    AND l.official_content_scope='official-book-unscheduled'
    AND (l.learning_objectives IS NULL OR l.learning_objectives='[]'::jsonb)
)
UPDATE public.lessons l
SET learning_objectives=e.objectives, updated_at=now()
FROM eligible e
WHERE l.id=e.id
RETURNING l.id, l.title, jsonb_array_length(l.learning_objectives) AS objective_count;

-- Read-only verification:
-- SELECT id, title, learning_objectives FROM public.lessons
-- WHERE id IN ('e85c153c-3d69-471f-b93c-a4726b73485d','97ff78ad-d774-4a51-a860-8ca8c3d00ea2','ad069dd9-052d-47fe-8c03-5c4ff9381cdb');
