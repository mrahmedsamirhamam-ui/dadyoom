-- Real student-book chapter navigation repair for Palestine grades 2 and 3 semester 2.
-- All 15 story subjects for each grade are now published. Lesson_number NULL on 7 G2 and all 15 G3
-- makes official chapter navigation / lesson page ordering untrustworthy.
-- Protect original lesson IDs, student history, content, source evidence.
-- One-time atomic & fail-closed: no second execution after success.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
CREATE TEMP TABLE actual_book_chapter(grade int,chapter int,id uuid PRIMARY KEY,exact_title text) ON COMMIT DROP;
INSERT INTO actual_book_chapter VALUES
(2,2,'0ff4bdb7-f245-4885-a820-1b45a551bb1e'::uuid,'النمر والحطاب'),
(2,6,'3c48bea9-016c-4f28-90aa-7d3c23d6aca3'::uuid,'صباح جديد'),
(2,7,'01aaabd0-1826-4cec-a6db-10bf52796908'::uuid,'حيلة فلاح'),
(2,8,'c2b76e9a-794b-4a7c-b8f1-d2d02d408135'::uuid,'يوم الطفل الفلسطيني'),
(2,10,'dfb59b2a-6694-4072-b4c4-f4f9b43fb424'::uuid,'لدي حلم'),
(2,12,'5a8109d7-c8f0-4b9c-9abe-ae393e7180ea'::uuid,'الببغاء الثرثار'),
(2,14,'039e51a0-f035-4180-946c-a8d5adbcb2d8'::uuid,'في البقالة'),
(3,1,'c72e8198-4a4f-4387-aa95-73641cbc4b04'::uuid,'حيفا والنورس'),
(3,2,'4debb339-89de-4e52-8f89-1de654b79ecf'::uuid,'يوم الشجرة'),
(3,3,'3cbac251-9120-4180-a9ef-2656b43a9a30'::uuid,'الراعي والذئب'),
(3,4,'4eb20fb4-5859-415f-86e0-294bf14ff6c8'::uuid,'أحب أن أكون'),
(3,5,'11507260-e858-4954-a8a9-1bb51a06249c'::uuid,'من أخلاقنا'),
(3,6,'f8319854-d862-40f7-b192-5f7dcbd0cb7f'::uuid,'في ميناء غزة'),
(3,7,'fe4f76b8-7984-4623-ba6f-1ca9e10bdd2d'::uuid,'الغراب والثعلب'),
(3,8,'21be89a2-d4de-40db-afcd-61722bf03739'::uuid,'المبدعة الصغيرة'),
(3,9,'4b931e96-f84b-48cb-98f9-b3bb7e15d0a4'::uuid,'ذكاء القاضي إياس'),
(3,10,'9e78ee24-df40-4899-bbbc-5cde06a885f0'::uuid,'في حديقة الحيوان'),
(3,11,'bffd6410-33bd-4697-af99-e812e206e14c'::uuid,'قمح بلادي'),
(3,12,'150bdd0a-9a4f-45d1-afa9-a892b7a3e01b'::uuid,'طبيب الأسد'),
(3,13,'1d6e4ded-565d-4862-9727-cc9c620ba0d1'::uuid,'زيارة إلى مدينة العنب'),
(3,14,'3713ff45-3c5a-4535-af2f-6aa7177cdbe3'::uuid,'الصديق وقت الضيق'),
(3,15,'375f5229-940e-44e4-bf39-47ea5bbd1a64'::uuid,'أول فدائي في الإسلام');
DO $guard$
DECLARE bad int;
BEGIN
 IF (SELECT count(*) FROM actual_book_chapter)<>22 OR
 (SELECT count(*) FROM actual_book_chapter WHERE grade=2)<>7 OR
 (SELECT count(*) FROM actual_book_chapter WHERE grade=3)<>15
 THEN RAISE EXCEPTION 'unexpected book index count'; END IF;
 IF EXISTS(SELECT 1 FROM actual_book_chapter GROUP BY grade,chapter HAVING COUNT(*)<>1)
 THEN RAISE EXCEPTION 'duplicate grade chapter';END IF;
 SELECT count(*) INTO bad FROM actual_book_chapter x
 LEFT JOIN lessons l ON l.id=x.id
 LEFT JOIN units u ON u.id=l.unit_id JOIN grades g ON g.id=u.grade_id
 JOIN curricula cu ON cu.id=g.curriculum_id JOIN countries c ON c.id=cu.country_id
 WHERE l.id IS NULL OR l.title<>x.exact_title OR l.status<>'published' OR l.semester<>2
 OR g.grade_number<>x.grade OR c.code<>'PS' OR cu.academic_year<>'2026-2027'
 OR l.sort_order<>30+x.chapter OR l.lesson_number IS NOT NULL OR
 length(l.content)<2000 OR l.source_pdf_url IS NULL;
 IF bad<>0 THEN RAISE EXCEPTION 'refuse unsafe lesson update %',bad;END IF;
 IF EXISTS(
 SELECT 1 FROM actual_book_chapter x
 JOIN lessons other ON other.unit_id=(SELECT unit_id FROM lessons WHERE id=x.id)
 AND other.id<>x.id AND other.lesson_number=x.chapter AND other.status='published'
 ) THEN RAISE EXCEPTION 'Chapter number already assigned';END IF;
END $guard$;
UPDATE lessons l SET lesson_number=x.chapter,updated_at=now()
FROM actual_book_chapter x WHERE x.id=l.id;
DO $post$
DECLARE n int;
BEGIN
 SELECT count(*) INTO n FROM actual_book_chapter x JOIN lessons l ON l.id=x.id
 WHERE l.lesson_number=x.chapter AND l.sort_order=x.chapter+30 AND l.status='published';
 IF n<>22 THEN RAISE EXCEPTION 'Rollback: updated % of 22 lesson numbers',n; END IF;
END $post$;
COMMIT;
