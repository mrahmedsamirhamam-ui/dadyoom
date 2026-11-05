-- Content integrity: unpublish 8 EMPTY Tunisia book-title shells and 6 clear Bahrain OCR instruction headings.
-- This does not delete any record or contents. These were not verifiable individual lesson subjects.
-- Safeguards: exact id, grade, country, title, published state, zero student progress/attempts.
-- Does not touch one Bahrain record with learner progress ('القراءة– التّدريبات -').
-- Required follow-up: produce correct official 2026–2027 lesson-by-lesson textbook TOC entries and independently explained subjects.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
CREATE TEMP TABLE verified_not_lesson(
 lesson_id uuid PRIMARY KEY, country text NOT NULL, grade integer NOT NULL,
 exact_title text NOT NULL, reason text NOT NULL
) ON COMMIT DROP;
INSERT INTO verified_not_lesson VALUES
('f7314947-c47e-4506-92bc-e53b398f2e71'::uuid,'TN',10,'كتاب النصوص — رياضة','empty-book-heading'),
('22b6db36-cc06-481c-a096-f4326ea33d24'::uuid,'TN',11,'عيون الأدب — الجزء الثاني','empty-book-heading'),
('a2529f0a-364c-4557-93a5-a0f7f8ff8684'::uuid,'TN',11,'كتاب النصوص — رياضة','empty-book-heading'),
('c3d2fe7b-5b23-4870-b80f-defe0e4bb92b'::uuid,'TN',12,'كتاب النصوص — رياضة','empty-book-heading'),
('f527eb04-cb5d-4712-98db-a3eeb39c1ce5'::uuid,'TN',12,'نصوص — آداب','empty-book-heading'),
('cd78ed80-a6b2-4e9d-a4c4-2e5b86f03fe0'::uuid,'TN',13,'كتاب العربية — رياضة','empty-book-heading'),
('de3d48b7-bff5-44e3-9d0f-8cd6818a2194'::uuid,'TN',13,'نصوص — آداب — الجزء الأول','empty-book-heading'),
('d6938c46-ab5b-44b9-9018-ff2003ee9545'::uuid,'TN',13,'نصوص — آداب — الجزء الثاني','empty-book-heading'),
('4d623a96-0dc2-4a30-9525-d5fb0104c6fd'::uuid,'BH',4,':القراءة','ocr-section-heading'),
('6f191bbd-c9b7-4db3-a638-7b64d58d0a2e'::uuid,'BH',4,'يقسم الدّرس إلى ثالثة أجزاء','ocr-section-instruction'),
('014bbb40-ca92-4069-a09d-bea072e480f6'::uuid,'BH',4,'يقسم الدّرس إلى جزأين','ocr-section-instruction'),
('9fa05705-7712-4c80-9790-20efc5413cb4'::uuid,'BH',5,'يُقسّم الدرس إلى جزأين','ocr-section-instruction'),
('c98c8c1f-233d-4a8e-bb1a-17374c563468'::uuid,'BH',5,'يُقسّم الدّرس إلى3','ocr-section-instruction'),
('e7934742-8821-4867-8df8-5a6c2ef96356'::uuid,'BH',6,'يقسّم الدّرس إلى3','ocr-section-instruction');
DO $pre$
DECLARE total integer; invalid integer;
BEGIN
 SELECT count(*) INTO total FROM verified_not_lesson;
 IF total<>14 THEN RAISE EXCEPTION 'Wrong candidate count %',total; END IF;
 SELECT count(*) INTO invalid FROM verified_not_lesson x
 LEFT JOIN public.lessons l ON l.id=x.lesson_id
 LEFT JOIN public.units u ON u.id=l.unit_id
 LEFT JOIN public.grades g ON g.id=u.grade_id
 LEFT JOIN public.curricula cu ON cu.id=g.curriculum_id
 LEFT JOIN public.countries c ON c.id=cu.country_id
 WHERE l.id IS NULL OR l.title<>x.exact_title OR c.code<>x.country OR g.grade_number<>x.grade
 OR l.status<>'published'
 OR (x.reason='empty-book-heading' AND btrim(coalesce(l.content,''))<>'')
 OR (x.reason LIKE 'ocr-%' AND (l.content NOT LIKE 'يتناول هذا الدرس موضوع%' OR l.content NOT LIKE '%غير محسوم%'))
 OR EXISTS (SELECT 1 FROM public.student_lesson_progress sp WHERE sp.lesson_id=l.id)
 OR EXISTS (SELECT 1 FROM public.question_attempts qa JOIN public.questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id)
 OR EXISTS (SELECT 1 FROM public.lesson_activity_attempts aa JOIN public.lesson_activities a ON a.id=aa.activity_id WHERE a.lesson_id=l.id);
 IF invalid<>0 THEN RAISE EXCEPTION 'Guard rejected % candidates. No changes.',invalid; END IF;
END $pre$;
UPDATE public.lessons l SET status='draft', updated_at=now()
FROM verified_not_lesson x WHERE l.id=x.lesson_id AND l.status='published';
DO $post$
DECLARE changed integer;
BEGIN
 SELECT count(*) INTO changed FROM verified_not_lesson x JOIN public.lessons l ON l.id=x.lesson_id WHERE l.status='draft';
 IF changed<>14 THEN RAISE EXCEPTION 'Rollback: only % of 14 temporarily hidden',changed; END IF;
END $post$;
COMMIT;
