-- Security & pedagogy: move 26 teacher-only answer guide lines from published Bahrain G1 lesson text
-- to RLS-protected lesson_teacher_notes.assessment. This SQL does not reproduce the 26 private keys in GitHub.
-- Teacher authorization: lesson_teacher_notes RLS allows administrators and lesson creator; anon has no SELECT.
-- Historical student progress/questions/attempts are a fail-closed gate, NOT rewritten.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
CREATE TEMP TABLE bh_grade1_teacher_only_answers ON COMMIT DROP AS
SELECT l.id lesson_id,l.content lesson_content,
'مفتاح الإجابة والإرشاد:' || split_part(split_part(l.content,'مفتاح الإجابة والإرشاد:',2),E'\n',1) teacher_key_line
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula cu ON cu.id=g.curriculum_id
JOIN public.countries co ON co.id=cu.country_id
WHERE l.status='published' AND g.grade_number=1 AND co.code='BH'
 AND l.content LIKE '%مفتاح الإجابة والإرشاد:%';

DO $guard$
DECLARE n integer; protected_count integer; inserted integer; changed integer;
BEGIN
 SELECT count(*) INTO n FROM pg_temp.bh_grade1_teacher_only_answers;
 IF n<>26 THEN RAISE EXCEPTION 'Expected 26 public answer guide lines, got %',n; END IF;
 IF EXISTS (SELECT 1 FROM pg_temp.bh_grade1_teacher_only_answers
   WHERE length(teacher_key_line)<35 OR length(teacher_key_line)>750
   OR length(lesson_content)-length(replace(lesson_content,'مفتاح الإجابة والإرشاد:',''))<>length('مفتاح الإجابة والإرشاد:')
   OR lesson_content NOT LIKE '%'||teacher_key_line||'%')
 THEN RAISE EXCEPTION 'Noncanonical or repeated teacher answer guide: abort to preserve content'; END IF;
 IF NOT (SELECT c.relrowsecurity AND NOT has_table_privilege('anon',c.oid,'SELECT')
   FROM pg_class c WHERE c.oid='public.lesson_teacher_notes'::regclass)
 THEN RAISE EXCEPTION 'Private teacher note table is not protected from anonymous students'; END IF;
 SELECT count(*) INTO protected_count FROM pg_temp.bh_grade1_teacher_only_answers t
 WHERE EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=t.lesson_id)
 OR EXISTS(SELECT 1 FROM public.lesson_activity_attempts at JOIN public.lesson_activities a ON a.id=at.activity_id WHERE a.lesson_id=t.lesson_id)
 OR EXISTS(SELECT 1 FROM public.question_attempts at JOIN public.questions q ON q.id=at.question_id WHERE q.lesson_id=t.lesson_id);
 IF protected_count<>0 THEN RAISE EXCEPTION 'Found student history in % target lessons',protected_count; END IF;
 IF EXISTS(SELECT 1 FROM public.lesson_teacher_notes WHERE content LIKE 'مفتاح إجابة خاص بالمعلم — ترحيل ضاديوم 20261030:%')
 THEN RAISE EXCEPTION 'Migration marker present: do not duplicate private teacher notes'; END IF;
 INSERT INTO public.lesson_teacher_notes(lesson_id,note_type,content,display_order)
 SELECT t.lesson_id,'assessment',
        'مفتاح إجابة خاص بالمعلم — ترحيل ضاديوم 20261030:'||E'\n'||t.teacher_key_line,
        coalesce((SELECT max(n.display_order)+1 FROM public.lesson_teacher_notes n WHERE n.lesson_id=t.lesson_id),1)
 FROM pg_temp.bh_grade1_teacher_only_answers t;
 GET DIAGNOSTICS inserted=ROW_COUNT;
 IF inserted<>26 THEN RAISE EXCEPTION 'Atomic rollback: expected 26 private notes, got %',inserted; END IF;

 UPDATE public.lessons l
 SET content=replace(l.content,t.teacher_key_line,''),
     updated_at=now()
 FROM pg_temp.bh_grade1_teacher_only_answers t
 WHERE l.id=t.lesson_id
 AND l.content=t.lesson_content
 AND NOT EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
 AND NOT EXISTS(SELECT 1 FROM public.lesson_activity_attempts at JOIN public.lesson_activities a ON a.id=at.activity_id WHERE a.lesson_id=l.id)
 AND NOT EXISTS(SELECT 1 FROM public.question_attempts at JOIN public.questions q ON q.id=at.question_id WHERE q.lesson_id=l.id);
 GET DIAGNOSTICS changed=ROW_COUNT;
 IF changed<>26 THEN RAISE EXCEPTION 'Atomic rollback: removed answer guide from only %/26 public lesson bodies',changed; END IF;
 IF EXISTS(SELECT 1 FROM public.lessons l JOIN pg_temp.bh_grade1_teacher_only_answers t ON t.lesson_id=l.id WHERE l.content LIKE '%مفتاح الإجابة والإرشاد:%')
 THEN RAISE EXCEPTION 'A teacher key remains in public lesson content'; END IF;
 IF (SELECT count(*) FROM public.lesson_teacher_notes WHERE content LIKE 'مفتاح إجابة خاص بالمعلم — ترحيل ضاديوم 20261030:%')<>26
 THEN RAISE EXCEPTION 'Private teacher guide count inconsistent'; END IF;
 RAISE NOTICE 'Private teacher guides archived: 26; public lesson guide lines hidden: 26; learner attempts untouched';
END $guard$;
COMMIT;