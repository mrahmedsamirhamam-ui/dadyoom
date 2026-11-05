-- Palestine G2 T2: correct actual 2020 15-chapter original-book order
-- BEFORE safe insertion of the seven missing real Ministry book chapters.
-- Keep lesson identities, student history and original plot text; no deletion.
-- Six generic subject-area pseudo lesson headings are NOT independent chapters and are moved to draft.
-- Printed book chapter15 official title "من نوادر أشعب" (existing shorthand "نوادر أشعب").
BEGIN;
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='120s';
CREATE TEMP TABLE existing_book_rows(
 id uuid PRIMARY KEY,existing_title text NOT NULL,old_sort integer NOT NULL,book_chapter integer NOT NULL
) ON COMMIT DROP;
INSERT INTO existing_book_rows VALUES
('0bd2e9d2-de43-49e9-ae8a-a12e9a76e3ba'::uuid,'وطن يسكن فينا',37,1),
('0c6bdfd2-9685-4183-b32e-c202fcb78272'::uuid,'نبني ونبني',135,3),
('1148944d-d95d-48e0-923f-dcb86a7f84c7'::uuid,'العصفورة والأفعى',137,4),
('920d781e-7051-46a0-aad0-33ec3ca360e5'::uuid,'في مدينة الخليل',136,5),
('f3a33709-33d9-4d23-98b0-2e63f1fa9148'::uuid,'عمر والغلام',170,9),
('4c2b9f13-9781-4ae9-b102-1d2a6823fccd'::uuid,'والدي الحبيب',171,11),
('c6ecb516-c5a5-4180-921c-99599a7472cd'::uuid,'سعيد والصقر',42,13),
('a49456f2-52ce-40f9-b695-da7e6dfc824e'::uuid,'نوادر أشعب',139,15);
CREATE TEMP TABLE pseudo_area_rows(id uuid PRIMARY KEY,existing_title text NOT NULL) ON COMMIT DROP;
INSERT INTO pseudo_area_rows VALUES
('d05af161-2f5a-4f2e-8251-3788d4b437f4'::uuid,'الاستماع والتحدث — الفصل الثاني'),
('fa5856a0-ed2f-40d5-aad2-3e55164c21ad'::uuid,'القراءة والفهم — الفصل الثاني'),
('a41ddfa4-1dea-45ee-8468-58b340f60b01'::uuid,'النصوص والتذوق — الفصل الثاني'),
('1f895baa-df32-4c2e-8230-5385af41f5e0'::uuid,'النحو والبناء اللغوي — الفصل الثاني'),
('561df11b-ecd0-40dc-91c8-c01bc3ad8066'::uuid,'الإملاء والخط — الفصل الثاني'),
('978ea29b-7fa7-418b-8fc5-36fe8206849d'::uuid,'الكتابة والتعبير — الفصل الثاني');
DO $pre$
DECLARE invalid_count int;
BEGIN
 IF (SELECT count(*) FROM existing_book_rows)<>8 OR (SELECT count(*) FROM pseudo_area_rows)<>6
 THEN RAISE EXCEPTION 'Require exact 8 book and 6 generic';END IF;
 IF (SELECT count(DISTINCT book_chapter) FROM existing_book_rows)<>8 THEN
 RAISE EXCEPTION 'Wrong/duplicate book chapters';END IF;
 SELECT count(*) INTO invalid_count FROM (
   SELECT id,existing_title,old_sort FROM existing_book_rows
   UNION ALL SELECT id,existing_title,NULL::integer FROM pseudo_area_rows
 ) x LEFT JOIN lessons l ON l.id=x.id
 LEFT JOIN units u ON l.unit_id=u.id
 LEFT JOIN grades g ON g.id=u.grade_id JOIN curricula cu ON cu.id=g.curriculum_id
 JOIN countries c ON c.id=cu.country_id
 WHERE l.id IS NULL OR l.title<>x.existing_title OR l.unit_id<>'00cc22a1-ded0-4858-85ec-25b246507de5'::uuid
 OR l.status<>'published' OR l.semester<>2
 OR c.code<>'PS' OR g.grade_number<>2 OR cu.academic_year<>'2026-2027'
 OR (x.old_sort IS NOT NULL AND l.sort_order<>x.old_sort)
 OR EXISTS(SELECT 1 FROM student_lesson_progress a WHERE a.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM question_attempts a JOIN questions q ON q.id=a.question_id WHERE q.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM lesson_activity_attempts a JOIN lesson_activities k ON k.id=a.activity_id WHERE k.lesson_id=l.id);
 IF invalid_count<>0 THEN RAISE EXCEPTION 'Unsafe existing Grade2 records: %',invalid_count;END IF;
 IF EXISTS(SELECT 1 FROM lessons l WHERE l.unit_id='00cc22a1-ded0-4858-85ec-25b246507de5'::uuid AND l.title='من نوادر أشعب')
 THEN RAISE EXCEPTION 'Official title already exists; do not create duplicate';END IF;
END $pre$;
UPDATE public.lessons l SET status='draft',lesson_number=NULL,updated_at=now()
FROM pseudo_area_rows x WHERE x.id=l.id;
UPDATE public.lessons l SET
 sort_order=30+x.book_chapter,
 lesson_number=x.book_chapter,
 title=CASE WHEN x.book_chapter=15 THEN 'من نوادر أشعب' ELSE l.title END,
 updated_at=now()
FROM existing_book_rows x WHERE x.id=l.id;
DO $post$
DECLARE n int;
BEGIN
 SELECT count(*) INTO n FROM existing_book_rows x JOIN lessons l ON l.id=x.id
 WHERE l.status='published' AND l.sort_order=30+x.book_chapter AND l.lesson_number=x.book_chapter
 AND (l.title=x.existing_title OR (x.book_chapter=15 AND l.title='من نوادر أشعب'));
 IF n<>8 THEN RAISE EXCEPTION 'Rollback, expected 8 correct existing books, got %',n; END IF;
 SELECT count(*) INTO n FROM pseudo_area_rows x JOIN lessons l ON l.id=x.id WHERE l.status='draft';
 IF n<>6 THEN RAISE EXCEPTION 'Rollback, expected 6 pseudo headings drafted, got %',n; END IF;
END $post$;
COMMIT;