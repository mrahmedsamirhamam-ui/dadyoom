-- Dadyoom: 66 grades-1-to-3 'حروف المد' enrichment lessons across 22 Arab countries.
-- Adds 198 grade-differentiated OPTIONAL activities grounded in the three verified existing examples.
-- NO automatic official-syllabus approval, no learner-history mutation, no answer key in public content.
BEGIN;
SET LOCAL statement_timeout='90s';
SET LOCAL lock_timeout='5s';

CREATE TEMP TABLE g123_madd_198_templates ON COMMIT DROP AS
SELECT grade::int, activity_order::int, activity_type::text, title::text,
 section::text, prompt::text, content::jsonb, answer::jsonb
FROM jsonb_to_recordset($madd$[{"grade":1,"activity_order":4,"activity_type":"fill_blank","title":"أكمل حرف المد أو حركته","section":"practice","prompt":"أكمل العبارة مستعينًا بكلمة «بَاب»: حرف المد في الكلمة هو ____.","content":{"origin":"DADYOOM_G123_MADD_SOURCE_GROUNDED_198_20261030","items":[{"sentence":"حرف المد في «بَاب» هو ___.","options":["الألف","الواو","الياء"]}],"didacticLevel":1,"sourceExamples":["بَاب","نُور","فِيل"]},"answer":{"answers":["الألف"]}},{"grade":1,"activity_order":5,"activity_type":"matching","title":"وصّل الحرف بحركته","section":"practice","prompt":"صل الكلمة بحرف المد الموجود فيها كما ورد في أمثلة الدرس.","content":{"origin":"DADYOOM_G123_MADD_SOURCE_GROUNDED_198_20261030","left":["بَاب","نُور","فِيل"],"right":["الياء بعد الكسرة","الألف بعد الفتحة","الواو بعد الضمة"],"didacticLevel":1,"sourceExamples":["بَاب","نُور","فِيل"]},"answer":{"pairs":[{"left":"بَاب","right":"الألف بعد الفتحة"},{"left":"نُور","right":"الواو بعد الضمة"},{"left":"فِيل","right":"الياء بعد الكسرة"}]}},{"grade":1,"activity_order":6,"activity_type":"multiple_choice","title":"تحقق من المد الصحيح","section":"assessment","prompt":"في كلمة «نُور» أي حرف يطيل صوت الضمة؟","content":{"origin":"DADYOOM_G123_MADD_SOURCE_GROUNDED_198_20261030","options":["الألف","الياء","الواو"],"didacticLevel":1,"sourceExamples":["بَاب","نُور","فِيل"]},"answer":{"correct":"الواو"}},{"grade":2,"activity_order":4,"activity_type":"fill_blank","title":"أكمل حرف المد أو حركته","section":"practice","prompt":"في المقطع «بَا»، يأتي حرف المد الألف بعد حركة ____.","content":{"origin":"DADYOOM_G123_MADD_SOURCE_GROUNDED_198_20261030","items":[{"sentence":"في «بَا» يأتي الألف بعد ___.","options":["الضمة","الفتحة","الكسرة"]}],"didacticLevel":2,"sourceExamples":["بَاب","نُور","فِيل"]},"answer":{"answers":["الفتحة"]}},{"grade":2,"activity_order":5,"activity_type":"matching","title":"وصّل الحرف بحركته","section":"practice","prompt":"صل كل مقطع ممدود بحركة الحرف السابقة لحرف المد.","content":{"origin":"DADYOOM_G123_MADD_SOURCE_GROUNDED_198_20261030","left":["بَا","بُو","بِي"],"right":["كسرة قبل الياء","ضمة قبل الواو","فتحة قبل الألف"],"didacticLevel":2,"sourceExamples":["بَاب","نُور","فِيل"]},"answer":{"pairs":[{"left":"بَا","right":"فتحة قبل الألف"},{"left":"بُو","right":"ضمة قبل الواو"},{"left":"بِي","right":"كسرة قبل الياء"}]}},{"grade":2,"activity_order":6,"activity_type":"multiple_choice","title":"تحقق من المد الصحيح","section":"assessment","prompt":"أي زوج يوضح انتقال صوت الباء من الحركة القصيرة إلى المد بالألف؟","content":{"origin":"DADYOOM_G123_MADD_SOURCE_GROUNDED_198_20261030","options":["بُ ثم بِ","بَا ثم فَا","بَ ثم بَا"],"didacticLevel":2,"sourceExamples":["بَاب","نُور","فِيل"]},"answer":{"correct":"بَ ثم بَا"}},{"grade":3,"activity_order":4,"activity_type":"fill_blank","title":"أكمل حرف المد أو حركته","section":"practice","prompt":"فسّر ضبط كلمة «فِيل»: جاءت الياء المدية بعد حركة ____.","content":{"origin":"DADYOOM_G123_MADD_SOURCE_GROUNDED_198_20261030","items":[{"sentence":"في «فِيل» جاء مد الياء بعد ___.","options":["الكسرة","الفتحة","الضمة"]}],"didacticLevel":3,"sourceExamples":["بَاب","نُور","فِيل"]},"answer":{"answers":["الكسرة"]}},{"grade":3,"activity_order":5,"activity_type":"matching","title":"وصّل الحرف بحركته","section":"practice","prompt":"صنّف كلمات الدرس وفق حركة ما قبل حرف المد ونوع المد.","content":{"origin":"DADYOOM_G123_MADD_SOURCE_GROUNDED_198_20261030","left":["بَاب","نُور","فِيل"],"right":["ضمة ثم واو مد","كسرة ثم ياء مد","فتحة ثم ألف مد"],"didacticLevel":3,"sourceExamples":["بَاب","نُور","فِيل"]},"answer":{"pairs":[{"left":"بَاب","right":"فتحة ثم ألف مد"},{"left":"نُور","right":"ضمة ثم واو مد"},{"left":"فِيل","right":"كسرة ثم ياء مد"}]}},{"grade":3,"activity_order":6,"activity_type":"multiple_choice","title":"تحقق من المد الصحيح","section":"assessment","prompt":"لماذا لا يُعَدّ المقطع «بَ» وحده مثالًا على المد بالألف؟","content":{"origin":"DADYOOM_G123_MADD_SOURCE_GROUNDED_198_20261030","options":["لأنه لا يتبعه ألف مد","لأنه يحتوي ياء مد","لأن الباء لا تقبل الفتحة"],"didacticLevel":3,"sourceExamples":["بَاب","نُور","فِيل"]},"answer":{"correct":"لأنه لا يتبعه ألف مد"}}]$madd$::jsonb)
AS x(grade int, activity_order int, activity_type text,
 title text, section text, prompt text, content jsonb, answer jsonb);

DO $body$
DECLARE eligible int; inserted int; protected int; bad int;
BEGIN
 IF (SELECT count(*) FROM pg_temp.g123_madd_198_templates) <> 9 OR
    EXISTS(SELECT 1 FROM pg_temp.g123_madd_198_templates WHERE activity_type IS NULL OR activity_order IS NULL OR answer IS NULL OR content IS NULL) OR
    (SELECT count(DISTINCT (grade,activity_order)) FROM pg_temp.g123_madd_198_templates) <> 9 THEN
   RAISE EXCEPTION 'Invalid nine verified exercise templates';
 END IF;
 WITH listed AS (
  SELECT l.id,l.content,
   COUNT(a.id) FILTER (WHERE a.is_published) AS activities,
   COUNT(DISTINCT a.activity_order) AS orders,MAX(a.activity_order) AS max_order
  FROM public.lessons l
  JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
  JOIN public.curricula c ON c.id=g.curriculum_id JOIN public.countries co ON co.id=c.country_id
  LEFT JOIN public.lesson_activities a ON a.lesson_id=l.id
  WHERE l.title='حروف المد' AND l.status='published' AND g.grade_number BETWEEN 1 AND 3
  GROUP BY l.id,l.content
 )
 SELECT count(*) INTO eligible FROM listed WHERE activities=3 AND orders=3 AND max_order=3
   AND content LIKE '%«بَاب»%' AND content LIKE '%«نُور»%' AND content LIKE '%«فِيل»%'
   AND content LIKE '%مد الألف بعد الفتحة%' AND content LIKE '%مد الواو بعد الضمة%'
   AND content LIKE '%مد الياء بعد الكسرة%';
 IF eligible<>66 THEN RAISE EXCEPTION 'Expected exactly 66 unchanged and evidence-linked lessons, got %',eligible; END IF;
 SELECT COUNT(*) INTO protected FROM public.lessons l
 JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
 WHERE l.title='حروف المد' AND l.status='published' AND g.grade_number BETWEEN 1 AND 3
  AND (EXISTS (SELECT 1 FROM public.student_lesson_progress sp WHERE sp.lesson_id=l.id)
    OR EXISTS (SELECT 1 FROM public.lesson_activity_attempts at
      JOIN public.lesson_activities la ON la.id=at.activity_id WHERE la.lesson_id=l.id)
    OR EXISTS (SELECT 1 FROM public.question_attempts qa
      JOIN public.questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id));
 IF protected<>0 THEN RAISE EXCEPTION 'Student history now exists; no insertion without review: %',protected; END IF;
 IF EXISTS (SELECT 1 FROM public.lesson_activities a
    WHERE a.content->>'origin'='DADYOOM_G123_MADD_SOURCE_GROUNDED_198_20261030') THEN
   RAISE EXCEPTION 'Madd activities already present, abort to prevent duplicates';
 END IF;
 INSERT INTO public.lesson_activities (lesson_id,title,activity_type,instructions,content,
  activity_order,points,is_published,section,prompt,answer,is_required)
 SELECT l.id,t.title,t.activity_type,'تدريب ضاديوم الأصلي الإضافي: تأمل أمثلة الدرس قبل الإجابة.',
  t.content,t.activity_order,5,true,t.section,t.prompt,t.answer,false
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id JOIN public.curricula c ON c.id=g.curriculum_id
 JOIN public.countries co ON co.id=c.country_id
 JOIN pg_temp.g123_madd_198_templates t ON t.grade=g.grade_number
 WHERE l.title='حروف المد' AND l.status='published' AND g.grade_number BETWEEN 1 AND 3
 AND l.content LIKE '%«بَاب»%' AND l.content LIKE '%«نُور»%' AND l.content LIKE '%«فِيل»%'
 AND l.content LIKE '%مد الألف بعد الفتحة%' AND l.content LIKE '%مد الواو بعد الضمة%'
 AND l.content LIKE '%مد الياء بعد الكسرة%';
 GET DIAGNOSTICS inserted=ROW_COUNT;
 IF inserted<>198 THEN RAISE EXCEPTION 'Atomic rollback: expected 198 activities, inserted %',inserted; END IF;
 RAISE NOTICE 'DADYOOM_G123_MADD_ORIGINAL_ACTIVITIES_INSERTED=%',inserted;
END $body$;
COMMIT;
-- A separate read-only query must confirm counts, answer-key integrity and the published learner projection.
