-- Ministry actual Palestinian Grade2 textbook first semester: 15 chapters already exist
-- but in separate Dadyoom curriculum; official curriculum shows only six generic categories.
-- Safe canonical migration: move existing lesson ID and all linked assessments into official curriculum unit.
-- No student history, no deletion, no grade changes; original book print edition 2020 currently portal-linked.
-- One time only. Student pages by lesson ID must be verified after this move.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
CREATE TEMP TABLE g2_source_lessons(
 lesson_id uuid PRIMARY KEY,title text NOT NULL,book_number integer NOT NULL,
 book_page integer NOT NULL,book_end integer NOT NULL
) ON COMMIT DROP;
INSERT INTO g2_source_lessons VALUES
('e2ccde53-21d3-4374-b62e-24ff66618ed1'::uuid,'الحرية أجمل',1,5,14),
('0ff35b05-a4cb-4c0d-907d-f17d75b40b78'::uuid,'الرسامة الصغيرة',2,15,24),
('fc398322-968c-44cb-b9fa-cbcf9bf81d2f'::uuid,'عودة الطائر',3,25,34),
('6500365a-d6a5-41ea-8c38-8127abd55c79'::uuid,'الأرض',4,35,44),
('899565c6-d9cb-4ab4-ae75-7ce6160599b9'::uuid,'الغراب والجرة',5,45,52),
('3fd71628-2888-4aaf-b813-cc5f9a3d31e3'::uuid,'مصنع الألبان',6,53,60),
('ff38dda5-d6ea-4c58-805c-3e2639b98e9e'::uuid,'جحا وحميره العشرة',7,61,68),
('104f765c-8fe5-4a97-80f1-556987c24c98'::uuid,'يوم المرور',8,69,78),
('f00e8dd8-2fde-49ed-85da-1c6d3a94be9f'::uuid,'الخروف والذئب',9,79,86),
('03019c24-bad8-4e04-baea-aa2e4a6d7a0b'::uuid,'طبيبة القرية',10,87,96),
('eee5c09f-3291-4286-9c33-baced43a3f3b'::uuid,'الأسد والفأر',11,97,104),
('38043ce1-1b3e-41b0-8aa5-e15136835688'::uuid,'الصياد',12,105,114),
('4bec8800-5aca-43e4-966b-640160669bed'::uuid,'الباحثات الصغيرات',13,115,122),
('18581f01-b132-47f9-8a33-d7b4bc69e9f5'::uuid,'الديك الذكي',14,123,132),
('daf24fab-ecb0-415e-87e7-96f617d3ef79'::uuid,'النظافة',15,133,142);
CREATE TEMP TABLE g2_broad_headings(lesson_id uuid PRIMARY KEY,title text NOT NULL) ON COMMIT DROP;
INSERT INTO g2_broad_headings VALUES
('3af40bf0-82b2-4c45-af43-8bb49c997b3f'::uuid,'الاستماع والتحدث — الفصل الأول'),
('8fc6419e-dcb1-47db-887d-a32d65db8900'::uuid,'القراءة والفهم — الفصل الأول'),
('b42da232-5a55-43fe-96be-bc23a76531d3'::uuid,'النصوص والتذوق — الفصل الأول'),
('5accbb7a-f4b0-41e2-bb07-9ad47634be29'::uuid,'النحو والبناء اللغوي — الفصل الأول'),
('00f53318-332e-46cb-b318-b48147b2cd39'::uuid,'الإملاء والخط — الفصل الأول'),
('49d1e031-b2ca-405b-b419-537f0d8d85d8'::uuid,'الكتابة والتعبير — الفصل الأول');
DO $pre$
DECLARE bad integer;
BEGIN
 IF (SELECT count(*) FROM g2_source_lessons)<>15 OR (SELECT count(*) FROM g2_broad_headings)<>6 THEN
   RAISE EXCEPTION 'Incorrect Ministry textbook chapter count'; END IF;
 IF EXISTS(SELECT 1 FROM g2_source_lessons WHERE book_end<book_page OR book_number<1)
 OR (SELECT COUNT(DISTINCT book_number) FROM g2_source_lessons)<>15 THEN
   RAISE EXCEPTION 'Invalid book TOC order/pages'; END IF;
 SELECT count(*) INTO bad FROM (
   SELECT lesson_id,title,book_number FROM g2_source_lessons
   UNION ALL SELECT lesson_id,title,NULL::integer FROM g2_broad_headings
 ) x LEFT JOIN lessons l ON l.id=x.lesson_id
 LEFT JOIN units u ON u.id=l.unit_id LEFT JOIN grades g ON g.id=u.grade_id
 LEFT JOIN curricula cu ON cu.id=g.curriculum_id LEFT JOIN countries c ON c.id=cu.country_id
 WHERE l.id IS NULL OR l.title<>x.title OR l.status<>'published' OR l.semester<>1
 OR c.code<>'PS' OR g.grade_number<>2 OR cu.academic_year<>'2026-2027'
 OR (x.book_number IS NOT NULL AND
    (l.unit_id<>'ae28cec0-ccd4-45ce-ab56-ff111d4edda5'::uuid OR l.lesson_number<>x.book_number OR l.sort_order<>x.book_number))
 OR (x.book_number IS NULL AND l.unit_id<>'cd3a849d-db92-4c7c-8288-91a5a129f676'::uuid)
 OR EXISTS(SELECT 1 FROM student_lesson_progress sp WHERE sp.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM question_attempts qa JOIN questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM lesson_activity_attempts aa JOIN lesson_activities a ON a.id=aa.activity_id WHERE a.lesson_id=l.id);
 IF bad<>0 THEN RAISE EXCEPTION 'Rollback: unsafe grade2 chapter rows %',bad; END IF;
 IF EXISTS(SELECT 1 FROM lessons l WHERE l.unit_id='cd3a849d-db92-4c7c-8288-91a5a129f676'::uuid
 AND l.id NOT IN(SELECT lesson_id FROM g2_broad_headings)) THEN
 RAISE EXCEPTION 'Destination already has other Ministry lessons'; END IF;
END $pre$;
-- The six broad headings were not individual chapters in the Ministry book.
UPDATE lessons l SET status='draft',lesson_number=NULL,updated_at=now()
FROM g2_broad_headings h WHERE l.id=h.lesson_id;
-- Stable lesson UUID, question/score refs and content preserved; only canonical curriculum navigation changed.
UPDATE lessons l SET unit_id='cd3a849d-db92-4c7c-8288-91a5a129f676'::uuid,sort_order=(10+x.book_number),
lesson_number=x.book_number,source_pdf_url='https://elearn.azureedge.net/Books/c2/ar2-p1.pdf',
source_page_start=x.book_page,source_page_end=x.book_end,updated_at=now()
FROM g2_source_lessons x WHERE x.lesson_id=l.id;
DO $post$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM g2_source_lessons x JOIN lessons l ON l.id=x.lesson_id
 WHERE l.unit_id='cd3a849d-db92-4c7c-8288-91a5a129f676'::uuid AND l.sort_order=10+x.book_number
 AND l.lesson_number=x.book_number AND l.status='published' AND l.source_pdf_url='https://elearn.azureedge.net/Books/c2/ar2-p1.pdf'
 AND l.source_page_start=x.book_page AND l.source_page_end=x.book_end;
 IF n<>15 THEN RAISE EXCEPTION 'Rollback: only % / 15 actual chapters moved to Ministry curriculum',n; END IF;
 SELECT count(*) INTO n FROM g2_broad_headings x JOIN lessons l ON l.id=x.lesson_id
 WHERE l.status='draft' AND l.lesson_number IS NULL;
 IF n<>6 THEN RAISE EXCEPTION 'Rollback: only % / 6 broad category headings hidden',n; END IF;
END $post$;
COMMIT;
