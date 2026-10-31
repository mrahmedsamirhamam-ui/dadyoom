-- Bahrain grade 2: only three source-backed original poetry-enrichment records.
-- The official textbook poems, assigned memorization and 2026-27 edition are NOT included.
-- Add three optional teacher-observed practices to the three existing activities.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
CREATE TEMP TABLE bh_g2_three_poetry ON COMMIT DROP AS
WITH ac AS(SELECT lesson_id,count(*) FILTER(WHERE is_published) n,count(*) total FROM lesson_activities GROUP BY lesson_id)
SELECT l.id lesson_id,l.title,
 trim(split_part(split_part(l.content,
    CASE WHEN l.content LIKE '%نص القراءة الأصلي:%' THEN 'نص القراءة الأصلي:'
         ELSE 'النص التدريبي الأصلي:' END,2),E'\n\n',1)) passage
FROM lessons l JOIN units u ON l.unit_id=u.id JOIN grades g ON u.grade_id=g.id
JOIN curricula cu ON g.curriculum_id=cu.id JOIN countries c ON cu.country_id=c.id JOIN ac ON ac.lesson_id=l.id
WHERE c.code='BH' AND g.grade_number=2 AND l.status='published'
 AND l.id IN (
  'd09e8b20-b4d4-4df7-bca7-808c41fac80d'::uuid,
  'ae3dad23-bf37-4da6-97cf-8f02beb5c7ec'::uuid,
  '327ee158-f501-4851-8405-819f64e990e1'::uuid)
 AND ac.n=3 AND ac.total=3
 AND (l.content LIKE '%نص القراءة الأصلي:%' OR l.content LIKE '%النص التدريبي الأصلي:%')
 AND NOT EXISTS(SELECT 1 FROM student_lesson_progress p WHERE p.lesson_id=l.id)
 AND NOT EXISTS(SELECT 1 FROM question_attempts qa JOIN questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id)
 AND NOT EXISTS(SELECT 1 FROM lesson_activity_attempts at JOIN lesson_activities a ON a.id=at.activity_id WHERE a.lesson_id=l.id);

DO $pre$
DECLARE n integer; bad integer;
BEGIN
 SELECT count(*) INTO n FROM bh_g2_three_poetry;
 IF n<>3 THEN RAISE EXCEPTION 'Expected three untouched BH G2 original poetry supports, got %',n; END IF;
 SELECT count(*) INTO bad FROM bh_g2_three_poetry WHERE length(passage)<150 OR length(passage)>950;
 IF bad<>0 THEN RAISE EXCEPTION 'Unsafe original passage extraction: %',bad; END IF;
END $pre$;

INSERT INTO lesson_activities
(lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required)
SELECT s.lesson_id,v.title,v.t,
 'تدريب إثرائي أصلي بإشراف المعلم. النص لا يغني عن قصيدة الكتاب أو أبيات الحفظ الرسمية؛ تسجيل الإتمام ليس إتقانًا.',
 v.content,v.ord,0,true,v.section,v.prompt,'{}'::jsonb,false
FROM bh_g2_three_poetry s
CROSS JOIN LATERAL (VALUES
 (4,'listening','أستمع وأستشهد بالنص','الاستماع',
  'استمع إلى نص ضاديوم الأصلي المصاحب لدرس «'||s.title||'»، ثم استخرج فعلًا أو كلمة تدل على الفكرة.',
  jsonb_build_object('origin','DADYOOM_BH_G2_THREE_POETRY_9_20261031',
   'requiresTeacherRead',true,'text',s.passage,
   'listeningQuestion','أي كلمة أو سلوك سمعته يثبت معنى النص؟',
   'bookContentUnverified',true,'originalPoemNotOfficial',true)),
 (5,'speaking','أعبر عن المعنى بموقف جديد','التحدث',
  'اختر سلوكًا مناسبًا من موضوع «'||s.title||'»، واحكِ موقفًا آخر يطبق الفكرة في حياتك بجملتين.',
  jsonb_build_object('origin','DADYOOM_BH_G2_THREE_POETRY_9_20261031',
   'sourceContext',s.passage,'teacherObservationRequired',true,
   'bookContentUnverified',true,'originalPoemNotOfficial',true)),
 (6,'writing','أكتب جملتين وأراجع دليلي','الكتابة',
  'اكتب جملتين عن موضوع «'||s.title||'»: الفكرة أولًا، ثم مثال أو شاهد من نص ضاديوم الأصلي. راجع الكتابة مع المعلم.',
  jsonb_build_object('origin','DADYOOM_BH_G2_THREE_POETRY_9_20261031',
   'originalText',s.passage,'letter','ب','teacherFeedbackRequired',true,
   'bookContentUnverified',true,'originalPoemNotOfficial',true))
) AS v(ord,t,title,section,prompt,content);

DO $verify$
DECLARE n integer; ids integer; bad integer; six integer;
BEGIN
 SELECT count(*),count(DISTINCT lesson_id),count(*) FILTER(WHERE answer<>'{}'::jsonb OR points<>0 OR is_required OR NOT is_published)
 INTO n,ids,bad FROM lesson_activities WHERE content->>'origin'='DADYOOM_BH_G2_THREE_POETRY_9_20261031';
 IF n<>9 OR ids<>3 OR bad<>0 THEN RAISE EXCEPTION 'Rollback source-backed formative records: %/%/%',n,ids,bad; END IF;
 SELECT count(*) INTO six FROM bh_g2_three_poetry s WHERE
 (SELECT count(*) FILTER(WHERE is_published) FROM lesson_activities a WHERE a.lesson_id=s.lesson_id)=6;
 IF six<>3 THEN RAISE EXCEPTION 'Rollback 3 poetry enrichment modules not reaching six: %',six; END IF;
END $verify$;
COMMIT;
