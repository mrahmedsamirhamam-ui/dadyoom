-- Correct separate numbering of official 2024 educational pack (chapters 7..12)
-- versus 2020 full 15-topic book (chapters 1,5,6,8,11,13).
-- Never confuse full-book sequence/order with separate 2024 package printed ordinal.
-- Safe one-time content-only factual metadata repair; original lesson text never replaced.
BEGIN;
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='120s';
CREATE TEMP TABLE chapter_numbers(id uuid PRIMARY KEY,title text,full_book_position int,pack_position int,printed_page int) ON COMMIT DROP;
INSERT INTO chapter_numbers VALUES
('c72e8198-4a4f-4387-aa95-73641cbc4b04'::uuid,'حيفا والنورس',1,7,4),
('11507260-e858-4954-a8a9-1bb51a06249c'::uuid,'من أخلاقنا',5,8,14),
('f8319854-d862-40f7-b192-5f7dcbd0cb7f'::uuid,'في ميناء غزة',6,9,21),
('21be89a2-d4de-40db-afcd-61722bf03739'::uuid,'المبدعة الصغيرة',8,10,29),
('bffd6410-33bd-4697-af99-e812e206e14c'::uuid,'قمح بلادي',11,11,38),
('1d6e4ded-565d-4862-9727-cc9c620ba0d1'::uuid,'زيارة إلى مدينة العنب',13,12,47);
DO $pre$
DECLARE bad int;
BEGIN
 IF (SELECT count(*) FROM chapter_numbers)<>6 THEN RAISE EXCEPTION '6 sources required';END IF;
 SELECT count(*) INTO bad FROM chapter_numbers x
 LEFT JOIN lessons l ON l.id=x.id
 LEFT JOIN units u ON u.id=l.unit_id JOIN grades g ON g.id=u.grade_id
 LEFT JOIN curricula cu ON cu.id=g.curriculum_id JOIN countries c ON c.id=cu.country_id
 WHERE l.id IS NULL OR l.title<>x.title OR g.grade_number<>3 OR c.code<>'PS'
 OR l.status<>'published' OR l.semester<>2 OR cu.academic_year<>'2026-2027'
 OR l.source_pdf_url<>'https://moe.edu.ps/uploads/new_pal_books/arabic3.pdf'
 OR l.source_page_start<>x.printed_page OR l.sort_order<>30+x.full_book_position
 OR position('رقم الدرس في الرزمة '||x.full_book_position||'، الصفحة المطبوعة' in l.content)=0
 OR EXISTS(SELECT 1 FROM student_lesson_progress p WHERE p.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM question_attempts a JOIN questions q ON q.id=a.question_id WHERE q.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM lesson_activity_attempts a JOIN lesson_activities k ON k.id=a.activity_id WHERE k.lesson_id=l.id);
 IF bad<>0 THEN RAISE EXCEPTION 'No update if % source/lesson metadata not intact',bad;END IF;
END $pre$;
UPDATE lessons l SET content=replace(l.content,
 'رقم الدرس في الرزمة '||x.full_book_position||'، الصفحة المطبوعة',
 'ترتيب الدرس في رزمة الوزارة 2024: '||x.pack_position||
 '؛ وترتيبه في فهرس الكتاب الكامل المطبوع 2020: '||x.full_book_position||
 '؛ الصفحة المطبوعة'),
 updated_at=now()
FROM chapter_numbers x WHERE x.id=l.id;
DO $post$
DECLARE n int;
BEGIN
 SELECT count(*) INTO n FROM chapter_numbers x JOIN lessons l ON l.id=x.id
 WHERE position('ترتيب الدرس في رزمة الوزارة 2024: '||x.pack_position in l.content)>0
 AND position('فهرس الكتاب الكامل المطبوع 2020: '||x.full_book_position in l.content)>0;
 IF n<>6 THEN RAISE EXCEPTION 'Rollback % of 6 metadata fixes',n;END IF;
END $post$;
COMMIT;