-- Dadyoom / Bahrain grade 1 / 2026-10-31
-- Exactly 17 published, unused, original enrichment lessons with mismatched learning objectives.
-- Adds five OPTIONAL original source-anchored exercises to the one existing activity
-- (6 total per lesson) and repairs 3 measurable, age-appropriate objectives.
-- IMPORTANT: This is NOT the Bahrain ministry book; source/title verification still required.
-- Safe rerun: expected 17 candidate rows fails after successful application.

BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';

CREATE TEMP TABLE dadyoom_bh_g1_17_candidates ON COMMIT DROP AS
WITH activity_count AS (
  SELECT lesson_id, count(*) FILTER (WHERE is_published) n, count(*) AS total
  FROM public.lesson_activities GROUP BY lesson_id
)
SELECT l.id AS lesson_id,l.title,l.content,
  trim(split_part(split_part(l.content,'الكلمات المفتاحية:',2),E'\n',1)) AS keyword_line,
  trim(split_part(split_part(l.content,'أطبق بنفسي:',2),E'\n',1)) AS apply_instruction,
  l.learning_objectives AS previous_objectives
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula cu ON cu.id=g.curriculum_id
JOIN public.countries c ON c.id=cu.country_id
JOIN activity_count ac ON ac.lesson_id=l.id
WHERE c.code='BH' AND g.grade_number=1 AND l.status='published'
  AND l.lesson_type IN ('assessment','listening')
  AND ac.n=1 AND ac.total=1
  AND l.content LIKE '%الكلمات المفتاحية:%'
  AND l.content LIKE '%أطبق بنفسي:%'
  AND NOT (l.learning_objectives::text ILIKE '%'||l.title||'%')
  AND NOT EXISTS (SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
  AND NOT EXISTS (
    SELECT 1 FROM public.question_attempts a JOIN public.questions q ON a.question_id=q.id
    WHERE q.lesson_id=l.id)
  AND NOT EXISTS (
    SELECT 1 FROM public.lesson_activity_attempts aa JOIN public.lesson_activities a ON aa.activity_id=a.id
    WHERE a.lesson_id=l.id);

DO $validate$
DECLARE n integer; bad integer;
BEGIN
  SELECT count(*) INTO n FROM dadyoom_bh_g1_17_candidates;
  IF n<>17 THEN RAISE EXCEPTION 'Expected exactly 17 BH grade-1 lessons; got %',n; END IF;
  SELECT count(*) INTO bad FROM dadyoom_bh_g1_17_candidates
   WHERE length(keyword_line)<6 OR length(apply_instruction)<20
     OR keyword_line NOT LIKE '%،%'
     OR title IS NULL OR length(content)<600;
  IF bad<>0 THEN RAISE EXCEPTION 'Unsafe original text extraction: % unusable rows',bad; END IF;
END $validate$;

CREATE TEMP TABLE dadyoom_bh_g1_17_anchored ON COMMIT DROP AS
SELECT lesson_id,title,keyword_line,apply_instruction,
  trim(split_part(keyword_line,'،',1)) AS word1,
  trim(split_part(split_part(keyword_line,'،',2),'،',1)) AS word2,
  trim(split_part(split_part(keyword_line,'،',3),'.',1)) AS word3
FROM dadyoom_bh_g1_17_candidates;

-- All tasks are non-graded participation with no model answer or leaked solution key.
INSERT INTO public.lesson_activities
 (lesson_id,title,activity_type,instructions,content,activity_order,
  points,is_published,section,prompt,answer,is_required)
SELECT src.lesson_id,v.title,v.activity_type,
  'تدريبات ضاديوم الإثرائية الأصلية؛ ينفذها الطالب بمساعدة المعلم بحسب مستوى القراءة. إكمالها مشاركة لا شهادة إتقان.',
  v.content,v.ord,0,true,v.section,v.prompt,'{}'::jsonb,false
FROM dadyoom_bh_g1_17_anchored src
CROSS JOIN LATERAL (
  VALUES
   (2,'listening','أسمع الكلمات وأميزها','الاستماع',
    'استمع إلى الكلمات «'||src.word1||'»، «'||src.word2||'» في تدريب «'||src.title||'» ثم أشر إلى بطاقة الكلمة التي يختارها المعلم.',
    jsonb_build_object(
      'origin','DADYOOM_BH_G1_17_OBJECTIVES_FIVE_TASKS_20261031',
      'teacherReading',true,'requiresTeacherRead',true,
      'text','أصغِ إلى الكلمات المرتبطة بتدريب ضاديوم «'||src.title||'»: '||src.keyword_line,
      'listeningQuestion','ما الكلمة التي سمعتها؟ أشر إليها أو رددها دون استعجال.',
      'bookContentUnverified',true)),
   (3,'reading','بطاقات القراءة المساندة','القراءة',
    'اقرأ مع المعلم أو تعرف بالإشارة الكلمات المرتبطة بدرس «'||src.title||'»: «'||src.word1||'» و«'||src.word2||'».',
    jsonb_build_object(
      'origin','DADYOOM_BH_G1_17_OBJECTIVES_FIVE_TASKS_20261031',
      'originalText','بطاقات ضاديوم الأصلية لنشاط «'||src.title||'»: '||src.keyword_line,
      'examples',jsonb_build_array(src.word1,src.word2),
      'readWithTeacher',true,'bookContentUnverified',true)),
   (4,'speaking','أشرح خطوة التطبيق','التحدث',
    'نفذ أولًا المهمة المرتبطة بالدرس ثم صف شفهيًا ما فعلت؛ الإشارة أو الرسم بديل مناسب عند الحاجة.',
    jsonb_build_object(
      'origin','DADYOOM_BH_G1_17_OBJECTIVES_FIVE_TASKS_20261031',
      'teacherTask',src.apply_instruction,
      'originalReference','من نص إثراء ضاديوم الأصلي «'||src.title||'»؛ وليس نص ورقة الوزارة.',
      'examples',jsonb_build_array(src.word1,src.word2),
      'bookContentUnverified',true)),
   (5,'writing','أكتب وأرسم المفهوم','الكتابة',
    'انسخ كلمة «'||src.word1||'» في دفترك بمساعدة المعلم وارسم ما يوضح معناها. يمكن الاكتفاء بالرسم أو تتبع الحرف بحسب مستوى الطالب.',
    jsonb_build_object(
      'origin','DADYOOM_BH_G1_17_OBJECTIVES_FIVE_TASKS_20261031',
      'letter',left(src.word1,1),
      'examples',jsonb_build_array(src.word1,src.word2),
      'supportsTracing',true,'bookContentUnverified',true)),
   (6,'reading','ألاحظ الفرق وأفسر','القراءة',
    'قارن البطاقتين «'||src.word1||'» و«'||src.word2||'»: بم تختلفان؟ أيهما تختار عند أداء مهمة الدرس؟ اشرح بالإشارة أو بجملة قصيرة.',
    jsonb_build_object(
      'origin','DADYOOM_BH_G1_17_OBJECTIVES_FIVE_TASKS_20261031',
      'originalText','ألاحظ المفردتين «'||src.word1||'» و«'||src.word2||'» في نشاط «'||src.title||'».',
      'examples',jsonb_build_array(src.word1,src.word2),
      'guidedDifferentiation',true,'bookContentUnverified',true))
) AS v(ord,activity_type,title,section,prompt,content);

UPDATE public.lessons l SET
 learning_objectives=jsonb_build_array(
   'أن يميز المتعلم مفردتين من نشاط «'||src.title||'» بالاستماع والإشارة أو النطق بمساعدة مناسبة.',
   'أن يطبق المتعلم مهمة النشاط الأصلية ثم يصف خطوة نفذها شفهيًا أو بالرسم.',
   'أن يلتزم المتعلم بالإنصات والتعاون واحترام دور زملائه أثناء النشاط.'
 ),
 updated_at=now()
FROM dadyoom_bh_g1_17_anchored src
WHERE l.id=src.lesson_id;

DO $verify$
DECLARE n integer; x integer; obj integer; zero_score integer;
BEGIN
 SELECT count(*),count(DISTINCT a.lesson_id),count(*) FILTER(
 WHERE a.points<>0 OR a.answer<>'{}'::jsonb OR a.is_required OR NOT a.is_published)
 INTO n,x,zero_score
 FROM public.lesson_activities a
 WHERE a.content->>'origin'='DADYOOM_BH_G1_17_OBJECTIVES_FIVE_TASKS_20261031';
 IF n<>85 OR x<>17 OR zero_score<>0 THEN
   RAISE EXCEPTION 'Atomic rollback: expected 85 optional records / 17 lessons, got % / %; invalid %',n,x,zero_score;
 END IF;
 SELECT count(*) INTO obj FROM dadyoom_bh_g1_17_anchored src
 JOIN public.lessons l ON l.id=src.lesson_id
 WHERE l.learning_objectives->>0 LIKE '%'||src.title||'%'
   AND (SELECT count(*) FILTER(WHERE is_published) FROM public.lesson_activities a WHERE a.lesson_id=l.id)=6;
 IF obj<>17 THEN RAISE EXCEPTION 'Atomic rollback: expected 17 revised objective records and six activities, got %',obj; END IF;
END $verify$;
COMMIT;
