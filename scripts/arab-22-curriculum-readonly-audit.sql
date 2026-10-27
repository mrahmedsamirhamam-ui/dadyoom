-- Global Arabic curriculum inventory for all 22 countries. SELECT ONLY.
-- Counts are database inventory, NOT verified textbook completion.
-- No learner rows or answer keys are returned.
WITH q AS (
  SELECT lesson_id, COUNT(*)::int AS question_count FROM public.questions GROUP BY lesson_id
), a AS (
  SELECT lesson_id, COUNT(*)::int AS activity_count FROM public.lesson_activities GROUP BY lesson_id
), lesson_inventory AS (
  SELECT c.code AS country_code, c.name_ar AS country_name, cur.id AS curriculum_id,
         g.id AS grade_id, u.id AS unit_id, l.id AS lesson_id, l.title AS lesson_title,
         l.status AS lesson_status, COALESCE(q.question_count, 0) AS question_count,
         COALESCE(a.activity_count, 0) AS activity_count
  FROM public.countries c
  LEFT JOIN public.curricula cur ON cur.country_id = c.id
  LEFT JOIN public.grades g ON g.curriculum_id = cur.id
  LEFT JOIN public.units u ON u.grade_id = g.id
  LEFT JOIN public.lessons l ON l.unit_id = u.id
  LEFT JOIN q ON q.lesson_id = l.id
  LEFT JOIN a ON a.lesson_id = l.id
)
SELECT country_code, country_name, COUNT(DISTINCT curriculum_id) AS curricula,
       COUNT(DISTINCT grade_id) AS grade_rows, COUNT(DISTINCT unit_id) AS unit_rows,
       COUNT(lesson_id) AS lesson_rows,
       COUNT(lesson_id) FILTER (WHERE lesson_status = 'published') AS published_rows,
       COUNT(lesson_id) FILTER (WHERE lesson_status IS DISTINCT FROM 'published') AS unpublished_rows,
       COALESCE(SUM(question_count), 0) AS question_rows,
       COALESCE(SUM(activity_count), 0) AS activity_rows,
       COUNT(lesson_id) FILTER (WHERE lesson_status = 'published' AND question_count < 3) AS published_less_than_three_questions
FROM lesson_inventory
GROUP BY country_code, country_name ORDER BY country_code;

-- Duplicate candidate groups; NO automatic merge, delete or update.
WITH entries AS (
  SELECT c.code AS country_code, g.id AS grade_id,
         lower(btrim(regexp_replace(coalesce(l.title,''), '[[:space:]]+', ' ', 'g'))) AS normalized_title,
         COUNT(*) AS candidate_rows
  FROM public.countries c
  JOIN public.curricula cur ON cur.country_id=c.id
  JOIN public.grades g ON g.curriculum_id=cur.id
  JOIN public.units u ON u.grade_id=g.id
  JOIN public.lessons l ON l.unit_id=u.id
  WHERE btrim(coalesce(l.title,'')) <> ''
  GROUP BY c.code, g.id, lower(btrim(regexp_replace(coalesce(l.title,''), '[[:space:]]+', ' ', 'g')))
)
SELECT country_code, grade_id, normalized_title, candidate_rows
FROM entries WHERE candidate_rows > 1 ORDER BY candidate_rows DESC, country_code LIMIT 200;

-- Orphaned content counts (do NOT touch referenced progress).
SELECT 'questions_without_lesson' AS check_name, COUNT(*)::bigint AS rows
FROM public.questions q LEFT JOIN public.lessons l ON l.id=q.lesson_id WHERE l.id IS NULL
UNION ALL
SELECT 'activities_without_lesson', COUNT(*)::bigint
FROM public.lesson_activities a LEFT JOIN public.lessons l ON l.id=a.lesson_id WHERE l.id IS NULL
UNION ALL
SELECT 'student_progress_without_lesson', COUNT(*)::bigint
FROM public.student_progress s LEFT JOIN public.lessons l ON l.id=s.lesson_id WHERE l.id IS NULL;

-- 4. Comprehensive read-only teaching readiness flags for ALL 22 Arab countries.
-- A row count, source URL or lesson status is NOT proof of current official textbook coverage.
-- Metadata in `lessons` may differ from the normalized editorial tables.
WITH q AS (
  SELECT lesson_id, count(*)::int AS n FROM public.questions GROUP BY lesson_id
), a AS (
  SELECT lesson_id, count(*) FILTER (WHERE is_published IS TRUE)::int AS n
  FROM public.lesson_activities GROUP BY lesson_id
), base AS (
  SELECT co.code, l.status, l.content, l.summary, l.learning_objectives,
         l.vocabulary, l.instructions, l.source_pdf_url,
         l.source_page_start, l.semester, l.official_content_scope,
         coalesce(q.n,0) AS question_count, coalesce(a.n,0) AS activity_count
  FROM public.countries co
  JOIN public.curricula cu ON cu.country_id = co.id
  JOIN public.grades gr ON gr.curriculum_id = cu.id
  JOIN public.units un ON un.grade_id = gr.id
  JOIN public.lessons l ON l.unit_id = un.id
  LEFT JOIN q ON q.lesson_id = l.id LEFT JOIN a ON a.lesson_id = l.id
)
SELECT code AS country_code, count(*) AS lesson_rows,
  count(*) FILTER (WHERE status = 'published') AS published_rows,
  count(*) FILTER (WHERE status IS DISTINCT FROM 'published') AS unpublished_rows,
  count(*) FILTER (WHERE status='published' AND instructions @> '[{"kind":"dadyoom_source","source_content_status":"MVP_DRAFT"}]'::jsonb) AS published_mvp_draft,
  count(*) FILTER (WHERE learning_objectives='[]'::jsonb OR learning_objectives='{}'::jsonb) AS missing_embedded_objectives,
  count(*) FILTER (WHERE vocabulary='[]'::jsonb OR vocabulary='{}'::jsonb) AS missing_embedded_vocabulary,
  count(*) FILTER (WHERE instructions='[]'::jsonb OR instructions='{}'::jsonb) AS missing_embedded_instructions,
  count(*) FILTER (WHERE coalesce(length(btrim(summary)),0) < 30) AS missing_useful_summary,
  count(*) FILTER (WHERE source_pdf_url IS NULL OR btrim(source_pdf_url)='') AS source_reference_review,
  count(*) FILTER (WHERE source_page_start IS NULL) AS source_page_review,
  count(*) FILTER (WHERE semester IS NULL) AS semester_review,
  count(*) FILTER (WHERE official_content_scope IS NULL) AS official_scope_review,
  count(*) FILTER (WHERE status='published' AND question_count+activity_count<3) AS needs_assessment_review
FROM base GROUP BY code ORDER BY code;

-- 5. Editor-scoped repair queue. Never rewrite published or attempted lesson IDs.
-- Does not inspect private grading keys, learner rows, or student attempts.
WITH q AS (
  SELECT lesson_id, count(*)::int AS n FROM public.questions GROUP BY lesson_id
), a AS (
  SELECT lesson_id, count(*) FILTER (WHERE is_published IS TRUE)::int AS n
  FROM public.lesson_activities GROUP BY lesson_id
), queue AS (
  SELECT co.code, cu.name_ar AS curriculum, gr.name_ar AS grade,
    l.id AS lesson_id, l.title, l.status,
    coalesce(q.n,0) AS questions, coalesce(a.n,0) AS activities,
    l.instructions @> '[{"kind":"dadyoom_source","source_content_status":"MVP_DRAFT"}]'::jsonb AS unreviewed_mvp,
    l.vocabulary='[]'::jsonb AS empty_vocabulary,
    l.learning_objectives='[]'::jsonb AS empty_objectives,
    coalesce(length(btrim(l.content)),0)<200 AS short_content,
    l.source_pdf_url IS NULL AS missing_source_url,
    l.semester IS NULL AS missing_semester,
    l.official_content_scope IS NULL AS missing_scope
  FROM public.countries co
  JOIN public.curricula cu ON cu.country_id=co.id
  JOIN public.grades gr ON gr.curriculum_id=cu.id
  JOIN public.units un ON un.grade_id=gr.id
  JOIN public.lessons l ON l.unit_id=un.id
  LEFT JOIN q ON q.lesson_id=l.id
  LEFT JOIN a ON a.lesson_id=l.id
)
SELECT code AS country_code,curriculum,grade,lesson_id,title,status,
  questions,activities,unreviewed_mvp,empty_vocabulary,empty_objectives,
  short_content,missing_source_url,missing_semester,missing_scope
FROM queue
WHERE (status='published' AND (questions+activities<3 OR unreviewed_mvp OR short_content))
  OR (status IS DISTINCT FROM 'published')
ORDER BY CASE WHEN status='published' AND questions+activities<3 THEN 0
              WHEN status='published' AND unreviewed_mvp THEN 1
              WHEN status='published' AND short_content THEN 2 ELSE 3 END,
         code,grade,title
LIMIT 500;

-- 6. Missing inline vocabulary vs. already-stored linked vocabulary.
-- RLS-bound page reader may recover the linked words for signed-in learners,
-- but it must NOT generate/deduplicate database rows or elevate privileges.
SELECT co.code AS country_code,
  count(*) FILTER (WHERE l.vocabulary='[]'::jsonb) AS embedded_vocabulary_missing,
  count(*) FILTER (
    WHERE l.vocabulary='[]'::jsonb
      AND EXISTS (SELECT 1 FROM public.lesson_vocabulary v WHERE v.lesson_id=l.id)
  ) AS existing_relational_vocabulary_recoverable,
  count(*) FILTER (
    WHERE l.vocabulary='[]'::jsonb
      AND NOT EXISTS (SELECT 1 FROM public.lesson_vocabulary v WHERE v.lesson_id=l.id)
      AND NOT (btrim(coalesce(l.content,''))='' AND btrim(coalesce(l.summary,'')) LIKE 'عقدة تغطية رسمية%')
  ) AS vocabulary_authoring_review_required,
  count(*) FILTER (
    WHERE l.vocabulary='[]'::jsonb AND btrim(coalesce(l.content,''))=''
      AND btrim(coalesce(l.summary,'')) LIKE 'عقدة تغطية رسمية%'
  ) AS catalog_references_not_real_lessons
FROM public.countries co
JOIN public.curricula cu ON cu.country_id=co.id
JOIN public.grades gr ON gr.curriculum_id=cu.id
JOIN public.units un ON un.grade_id=gr.id
JOIN public.lessons l ON l.unit_id=un.id
GROUP BY co.code ORDER BY co.code;

-- 7. Review-only grade-one vocabulary: exact-title/ID/term/year validation.
-- NO mutations, no user rows. Match is NOT permission to publish.
WITH proposed(lesson_id,expected_title) AS (VALUES
  ('3c0b38ac-62d1-4855-90a9-c9ba95f37350','الحرف (هـ)'),
  ('6577a2a6-d5f5-49f9-a619-9acf81990b52','الحرفان (ط-ز)'),
  ('ffb03161-fd9b-466b-bcf1-837efc0cdca3','الحرفان (غ-ي)'),
  ('edd67793-647a-465f-b0c1-fb6402db3412','الحرفان (و-ث)'),
  ('f3bca471-c6e5-42f1-9fd9-74dd569439b8','الدرس التاسع: حرف (ض)'),
  ('e85c153c-3d69-471f-b93c-a4726b73485d','الدرس الثالث: حرف (ك)'),
  ('ad069dd9-052d-47fe-8c03-5c4ff9381cdb','الدرس الثامن: حرفا (خ) و(ذ)'),
  ('c1771cdd-3a3a-4778-9084-6dde00051ddb','الدرس الرابع عشر: حرف (ظ)'),
  ('97ff78ad-d774-4a51-a860-8ca8c3d00ea2','الدرس الرابع: حرفا (ف) و(أ)'),
  ('2d526483-4166-4ba6-af27-d8684fa219b2','حرف (ش)'),
  ('59e5c063-a3be-409d-a309-078aac5687f0','حرف (ص)'),
  ('cac8cbdd-c68e-42de-8e09-b0aa809c84a9','حرف (ق)')
), reconciliation AS (
 SELECT p.lesson_id,p.expected_title,l.id actual_id,l.title actual_title,l.status,
        co.code country_code,g.grade_number,l.semester,cu.academic_year,l.vocabulary,
        EXISTS(SELECT 1 FROM public.lesson_vocabulary v WHERE v.lesson_id=l.id) has_linked_vocabulary
 FROM proposed p LEFT JOIN public.lessons l ON l.id::text=p.lesson_id
 LEFT JOIN public.units u ON u.id=l.unit_id
 LEFT JOIN public.grades g ON g.id=u.grade_id
 LEFT JOIN public.curricula cu ON cu.id=g.curriculum_id
 LEFT JOIN public.countries co ON co.id=cu.country_id
)
SELECT lesson_id,expected_title,
 CASE WHEN actual_id IS NULL THEN 'MISSING_ID'
 WHEN actual_title IS DISTINCT FROM expected_title THEN 'TITLE_MISMATCH'
 WHEN country_code IS DISTINCT FROM 'BH' OR grade_number IS DISTINCT FROM 1 OR semester IS DISTINCT FROM 2 THEN 'CLASSIFICATION_MISMATCH'
 WHEN academic_year IS DISTINCT FROM '2026-2027' THEN 'YEAR_MISMATCH'
 WHEN status IS DISTINCT FROM 'published' THEN 'STATUS_CHANGED'
 WHEN vocabulary IS DISTINCT FROM '[]'::jsonb OR has_linked_vocabulary THEN 'VOCABULARY_ALREADY_PRESENT'
 ELSE 'MATCHED_FOR_HUMAN_REVIEW_NOT_APPROVED_FOR_IMPORT' END AS review_status
FROM reconciliation ORDER BY expected_title;

-- 8. All-country indexed-skill templates versus verified current-year textbooks.
-- Reused thematic packs are optional Dadyoom enrichment, NOT proof that
-- any country's grade/term/stream ministry curriculum has been completed.
SELECT co.code AS country_code,
       COUNT(l.id) AS published_lesson_rows,
       COUNT(l.id) FILTER (WHERE l.content LIKE 'حزمة ضاديوم الموضوعية المتخصصة%') AS thematic_enrichment_template_rows,
       COUNT(l.id) FILTER (WHERE l.content LIKE 'هذا المحتوى أصلي من ضاديوم ومصمم%') AS generic_framework_rows,
       COUNT(l.id) FILTER (WHERE l.content LIKE 'دعم أصلي من ضاديوم للتدريب اللغوي%') AS original_grade_three_support_rows,
       COUNT(l.id) FILTER (WHERE l.content LIKE 'مادة إثرائية أصلية من ضاديوم%') AS original_grade_four_support_rows,
       COUNT(l.id) FILTER (WHERE l.content LIKE '%مفتاح المراجعة الذاتية:%') AS labelled_review_key_rows,
       COUNT(l.id) FILTER (WHERE l.semester IS NULL) AS term_unclassified_rows,
       COUNT(l.id) FILTER (WHERE l.official_content_scope IS NULL) AS official_content_scope_unspecified_rows
FROM public.countries co
JOIN public.curricula cu ON cu.country_id=co.id
JOIN public.grades gr ON gr.curriculum_id=cu.id
JOIN public.units un ON un.grade_id=gr.id
JOIN public.lessons l ON l.unit_id=un.id
WHERE l.status='published'
GROUP BY co.code ORDER BY co.code;

-- 9. Grade-two existing reading review candidates, SELECT only.
-- A match does not authorize publishing revised words or tests. No student rows.
WITH proposed(lesson_id,expected_title) AS (VALUES
 ('47ae629d-9ce9-4d18-89ab-1d25bc0a2874','الدرس الأول: فرحة القرقاعون'),
 ('38594fae-4bf7-41c3-aa76-52590a1dbdda','الدرس التاسع: الرجل الطائر'),
 ('f56f7e48-3753-4b5f-a26b-e5df6c416d67','الدرس الثالث: ما أجمل صناعة أجدادنا!'),
 ('a18a07b1-5cf1-48e5-b22d-edac1cf553d1','الدرس الثامن: شجرة الحياة'),
 ('f7ea6d0c-9381-4db6-987b-9b3a71ec1572','الدرس الثاني عشر: اختراع ينير الطريق'),
 ('8feb7c6a-3a80-4aa2-8f2d-24ff8792878c','الدرس الثاني: وطني الغالي'),
 ('854e3f92-2bbe-47c9-b790-abde711524c3','الدرس الحادي عشر: المطعم الذكي'),
 ('ead90a2e-97c0-42d7-a11b-c4162cda7f21','الدرس الخامس: نادر في المزرعة'),
 ('bb91b071-ed16-46b9-a4c3-144cd1fcabf8','الدرس الرابع: معالم من بلادي'),
 ('ec7bff48-8d51-4404-a1c6-ed1efa394290','الدرس السابع: جاسم والببغاء'),
 ('0f5904ec-8aa7-46fa-894b-989c956bf8d9','الدرس السادس: النخلة'),
 ('3b6a6f10-36b6-44b7-8617-40ea2b583107','الدرس العاشر: سفينة الفضاء')
), lesson_state AS (
 SELECT p.lesson_id,p.expected_title,l.id AS actual_id,l.title AS actual_title,l.status,l.lesson_type,
        c.code AS country_code,g.grade_number,l.semester,cu.academic_year,l.vocabulary,
        EXISTS(SELECT 1 FROM public.lesson_vocabulary v WHERE v.lesson_id=l.id) AS has_related_words
 FROM proposed p LEFT JOIN public.lessons l ON l.id::text=p.lesson_id
 LEFT JOIN public.units un ON un.id=l.unit_id
 LEFT JOIN public.grades g ON g.id=un.grade_id
 LEFT JOIN public.curricula cu ON cu.id=g.curriculum_id
 LEFT JOIN public.countries c ON c.id=cu.country_id
)
SELECT lesson_id,expected_title,
 CASE WHEN actual_id IS NULL THEN 'MISSING_ID'
      WHEN actual_title IS DISTINCT FROM expected_title THEN 'TITLE_MISMATCH'
      WHEN country_code IS DISTINCT FROM 'BH' OR grade_number IS DISTINCT FROM 2 OR semester IS DISTINCT FROM 2 THEN 'CLASSIFICATION_MISMATCH'
      WHEN academic_year IS DISTINCT FROM '2026-2027' THEN 'ACADEMIC_YEAR_MISMATCH'
      WHEN status IS DISTINCT FROM 'published' OR lesson_type IS DISTINCT FROM 'reading' THEN 'TYPE_OR_STATUS_CHANGED'
      WHEN vocabulary IS DISTINCT FROM '[]'::jsonb OR has_related_words THEN 'WORDS_ALREADY_PRESENT'
      ELSE 'MATCHED_FOR_HUMAN_REVIEW_NOT_APPROVED_FOR_IMPORT'
 END AS result_status
FROM lesson_state ORDER BY expected_title;


-- 10. Existing Grade-3 second-term reading and content-anchor review.
-- READ ONLY: if source text changed, invalidate candidate answer keys before
-- any teacher-authorized import; no government-edition claim.
WITH proposed(lesson_id,expected_title,source_excerpt) AS (VALUES
  ('358d0287-668c-4d61-b731-b7e9ae6e13a9','الدرس الأول: نداء الواجب (1)','بدأ ناصر بترتيب الطاولات وتوزيع البطاقات'),
  ('d547f1ae-432e-4148-80c9-daf24453c1ba','الدرس التاسع: ذكريات من أيام الطفولة (1)','كانت الألعاب بسيطة، لكنها علمتها الصبر والتعاون مع الجيران'),
  ('3e2691de-dcf4-4d0a-87d6-863d47e50bc6','الدرس الثالث: صباح الخير يا وطني','اقترحت فاطمة عدم رمي المخلفات في الساحة'),
  ('81f6cec0-b739-43c5-bae5-aa9fbb9d9818','الدرس الثامن: البلاستيك والصحة','حملا معهما حقيبة قابلة لإعادة الاستخدام'),
  ('e1e62bee-7373-46b7-8aa9-53023dc9c7e7','الدرس الثاني عشر: طفولة مبدعة','أحبت بسمة صناعة المجسمات من الورق المستعمل'),
  ('0affd0f0-5fa4-4a5a-9305-e97dbe94624b','الدرس الثاني: نداء الواجب (2)','اصطحبه إلى الرف الصحيح، ثم عاد ليعاون زملاءه'),
  ('da526b1e-ec9c-47d0-9a12-787d93e0f1a4','الدرس الحادي عشر: مرح الطفولة','اتفقوا على ألا يحتكر أحد الأدوات'),
  ('cb508e2a-0999-4462-8a15-f2ba53322b99','الدرس الخامس: معًا نحفظ بيئتنا (1)','لم تلمسها مباشرة، بل أخبرت المسؤول عن نظافة المكان'),
  ('72edeb7b-4506-4b17-902c-573e46f0a6e3','الدرس الرابع: حرف خالدة','كتبت خالدة رسالة إلى صديقتها'),
  ('ab745f1f-3314-4210-a0f0-c44b998b9c98','الدرس السابع: شكوى الفراشة','أحتاج إلى زهور سليمة كي أجد غذائي'),
  ('aace1299-589d-4f24-9cc6-1c1849242019','الدرس السادس: معًا نحفظ بيئتنا (2)','كتب فريق عبارة «لا نهدر الماء»'),
  ('0ab3e6ba-c3ea-4460-a659-70ee473a9216','الدرس العاشر: ذكريات من أيام الطفولة (2)','اقترحت تسجيل قصة قصيرة ترويها الجدة')
), actual AS (
 SELECT p.lesson_id,p.expected_title,p.source_excerpt,l.id actual_id,l.title actual_title,l.status,l.lesson_type,
        c.code country_code,g.grade_number,l.semester,cu.academic_year,l.vocabulary,
        position(p.source_excerpt in coalesce(l.content,''))>0 AS source_phrase_matches,
        EXISTS (SELECT 1 FROM public.lesson_vocabulary v WHERE v.lesson_id=l.id) AS linked_words_present
 FROM proposed p LEFT JOIN public.lessons l ON l.id::text=p.lesson_id
 LEFT JOIN public.units u ON u.id=l.unit_id
 LEFT JOIN public.grades g ON g.id=u.grade_id
 LEFT JOIN public.curricula cu ON cu.id=g.curriculum_id
 LEFT JOIN public.countries c ON c.id=cu.country_id
)
SELECT lesson_id,expected_title,
 CASE WHEN actual_id IS NULL THEN 'MISSING_LESSON_ID'
      WHEN actual_title IS DISTINCT FROM expected_title THEN 'TITLE_CHANGED'
      WHEN country_code IS DISTINCT FROM 'BH' OR grade_number IS DISTINCT FROM 3 OR semester IS DISTINCT FROM 2 THEN 'CLASSIFICATION_CHANGED'
      WHEN academic_year IS DISTINCT FROM '2026-2027' THEN 'ACADEMIC_YEAR_CHANGED'
      WHEN status IS DISTINCT FROM 'published' OR lesson_type IS DISTINCT FROM 'reading' THEN 'TYPE_OR_STATUS_CHANGED'
      WHEN vocabulary IS DISTINCT FROM '[]'::jsonb OR linked_words_present THEN 'VOCABULARY_ALREADY_EXISTS'
      WHEN NOT source_phrase_matches THEN 'SOURCE_PASSAGE_CHANGED_REVIEW_QUESTIONS'
      ELSE 'MATCHED_FOR_TEACHER_REVIEW_NOT_FOR_AUTO_IMPORT'
 END AS candidate_status
FROM actual ORDER BY expected_title;

-- 11. Bahrain grade-4 second term existing-reading enrichment identity/content gate.
-- Read only: do not rewrite published lessons, answer keys, student progress or scores.
WITH proposed(lesson_id,expected_title,source_excerpt) AS (VALUES
 ('10ef0448-2a2f-4545-b4b4-4be6c7a53434','ألعابنا وألعابكم','اتفق الجميع على أن أفضل اللعب ما يجمع المرح واحترام القواعد'),
 ('9d9f90da-dc2c-49c8-b0d4-fb6ccdd0ebd0','الحمامة والصياد','قرر أن يبتعد عن العش ويكتفي بملاحظة الطيور في الطبيعة'),
 ('9373fa3a-5043-467a-bdfe-bee5f0486d3a','الراعي الكذاب','أسرعوا إليه مرتين ثم عرفوا أنه يمزح'),
 ('1d1e2e9d-7c78-4cf5-8a0a-21724a55a86e','الزهرة والمطر','الإفراط في السقي ليس دائمًا مفيدًا'),
 ('42285776-b4e3-4bf4-9c6e-073282d2a2df','القبرة وابنها','ثم نجح في التحليق مسافة قصيرة'),
 ('b784419e-2f3d-4846-9213-4a96030e2067','المبدعون الصغار','ثم اختبر الفريق ثبات المجسم وعدله أكثر من مرة'),
 ('9a939479-cc36-44cf-96d7-7cca4d9f86d7','ذكريات الموسم','احتفظت الأسرة بالقصة ضمن دفتر ذكريات'),
 ('79ef0f6f-ea13-4805-9e4d-1fca7864ed3f','رائدات من بلدي','قيادة المبادرة تحتاج إلى تعاون وتخطيط واحترام آراء الآخرين'),
 ('56f3fcd2-2683-4ee8-8d77-245b89680250','عين عذاري','بحثت مع المعلم عن معلومات موثوقة'),
 ('cc870b2c-c423-4234-a4c4-37ad5969077a','لقاء كشفي','أعاد الجميع الأغراض إلى أماكنها'),
 ('f843dec9-8aa7-4eec-be38-0b2f4b0906f9','هي البحرين','التعرف إلى الوطن يبدأ بمعرفة تاريخه واحترام جميع من يعيشون فيه')
), live AS (
 SELECT p.lesson_id,p.expected_title,p.source_excerpt,l.id actual_id,l.title actual_title,l.status,l.lesson_type,
        c.code country_code,g.grade_number,l.semester,cu.academic_year,l.vocabulary,
        position(p.source_excerpt in coalesce(l.content,''))>0 source_phrase_matches,
        EXISTS(SELECT 1 FROM public.lesson_vocabulary v WHERE v.lesson_id=l.id) has_linked_vocab
 FROM proposed p LEFT JOIN public.lessons l ON l.id::text=p.lesson_id
 LEFT JOIN public.units u ON u.id=l.unit_id
 LEFT JOIN public.grades g ON g.id=u.grade_id
 LEFT JOIN public.curricula cu ON cu.id=g.curriculum_id
 LEFT JOIN public.countries c ON c.id=cu.country_id
)
SELECT lesson_id,expected_title,
 CASE WHEN actual_id IS NULL THEN 'MISSING_LESSON'
 WHEN actual_title IS DISTINCT FROM expected_title THEN 'TITLE_CHANGED'
 WHEN country_code IS DISTINCT FROM 'BH' OR grade_number IS DISTINCT FROM 4 OR semester IS DISTINCT FROM 2 THEN 'COUNTRY_GRADE_TERM_CHANGED'
 WHEN academic_year IS DISTINCT FROM '2026-2027' THEN 'ACADEMIC_YEAR_CHANGED'
 WHEN status IS DISTINCT FROM 'published' OR lesson_type IS DISTINCT FROM 'reading' THEN 'TYPE_OR_STATUS_CHANGED'
 WHEN vocabulary IS DISTINCT FROM '[]'::jsonb OR has_linked_vocab THEN 'WORDS_ALREADY_PRESENT'
 WHEN NOT source_phrase_matches THEN 'SOURCE_TEXT_CHANGED_REVIEW_ASSESSMENTS'
 ELSE 'MATCHED_FOR_TEACHER_REVIEW_NOT_IMPORT_APPROVED' END AS match_status
FROM live ORDER BY expected_title;

-- 12. Bahrain grade-5 reading/word support identity and source-text audit.
-- Read-only preconditions; candidates are NOT eligible for automatic publishing.
WITH proposed(lesson_id,expected_title,source_excerpt) AS (VALUES
 ('2fc5885a-f505-4db9-85ca-0cba7ed63653','إنها تحب التصميم','عندما لاحظت أن الخط صغير، عدلته بعد استشارة صديقتها'),
 ('ea26dcdc-eea9-480d-b81c-51259425cdf8','الفارس العربي','القوة الحقيقية ترتبط بالمسؤولية والرحمة'),
 ('19664102-cfce-4b31-a813-dd5b9960c36b','الكلب والحمامة','فأحضر الحارس مختصًا برعاية الطيور'),
 ('509efd86-05b2-4548-b939-4a46b611736a','الكهرباء في وطني','أطفئ الأنوار غير الضرورية ولا ألمس الأسلاك المكشوفة'),
 ('25763537-f0f3-46be-bbfc-1dc2847e42d1','الممثل البارع','تحسين الوقفات بين الجمل بدل الصراخ'),
 ('9d4c894e-c021-4a37-a580-d376c99c0cac','بيئتنا حياتنا','قاس نجاح النشاط بملاحظة نظافة المكان بعد أسبوع'),
 ('d6c72d84-f2b7-4a55-9248-1166617f7997','سابق الريح','فأبلغ فهد المشرف بدل أن يقترب منه بطريقة قد تضره'),
 ('e049c6ac-05b1-47a2-8b4d-a710af279589','صدى الحياة','تفرق فيها بين الأصوات التي سمعتها فعلًا والأشياء التي تخيلتها'),
 ('092db88a-1b11-449a-96ec-5daa0eea6f41','على شواطئ البحرين','حملت الأسرة مخلفاتها معها'),
 ('39d67cf3-14de-44fd-9e62-916ed64ec9b2','نزهة في أحضان الطبيعة','نظموا ملاحظاتهم في جدول صغير')
), live AS (
 SELECT p.lesson_id,p.expected_title,p.source_excerpt,l.id actual_id,l.title actual_title,l.status,l.lesson_type,
        c.code country_code,g.grade_number,l.semester,cu.academic_year,l.vocabulary,
        position(p.source_excerpt in coalesce(l.content,''))>0 AS source_matches,
        EXISTS(SELECT 1 FROM public.lesson_vocabulary v WHERE v.lesson_id=l.id) AS linked_words
 FROM proposed p LEFT JOIN public.lessons l ON l.id::text=p.lesson_id
 LEFT JOIN public.units u ON u.id=l.unit_id
 LEFT JOIN public.grades g ON g.id=u.grade_id
 LEFT JOIN public.curricula cu ON cu.id=g.curriculum_id
 LEFT JOIN public.countries c ON c.id=cu.country_id
)
SELECT lesson_id,expected_title,CASE
 WHEN actual_id IS NULL THEN 'MISSING_LESSON'
 WHEN actual_title IS DISTINCT FROM expected_title THEN 'TITLE_CHANGED'
 WHEN country_code IS DISTINCT FROM 'BH' OR grade_number IS DISTINCT FROM 5 OR semester IS DISTINCT FROM 2 THEN 'CLASSIFICATION_CHANGED'
 WHEN academic_year IS DISTINCT FROM '2026-2027' THEN 'YEAR_CHANGED'
 WHEN status IS DISTINCT FROM 'published' OR lesson_type IS DISTINCT FROM 'reading' THEN 'TYPE_OR_STATUS_CHANGED'
 WHEN vocabulary IS DISTINCT FROM '[]'::jsonb OR linked_words THEN 'VOCABULARY_ALREADY_PRESENT'
 WHEN NOT source_matches THEN 'SOURCE_CHANGED_REVIEW_QUESTIONS'
 ELSE 'MATCHED_TEACHER_REVIEW_NOT_PUBLISH_READY' END AS review_status
FROM live ORDER BY expected_title;
