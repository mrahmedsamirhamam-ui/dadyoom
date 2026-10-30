-- Additional original, grade-differentiated phonics activities for 66 already-published Shadda/Tanween lessons.
-- Uses explicitly introduced additional examples, not claimed to be copied from ministry materials or original local lesson passages.
-- 198 OPTIONAL activities; existing curriculum identity, learner progress, assessment keys remain unchanged.
BEGIN;
SET LOCAL statement_timeout='90s';
SET LOCAL lock_timeout='5s';
CREATE TEMP TABLE dadyoom_shadda_198_templates ON COMMIT DROP AS
SELECT grade::int, activity_order::int, activity_type::text,title::text,section::text,prompt::text,content::jsonb,answer::jsonb
FROM jsonb_to_recordset($phonics$[{"grade":1,"activity_order":4,"activity_type":"fill_blank","title":"ألاحظ العلامة الصوتية","section":"practice","prompt":"أكمل: في كلمة «شَدَّ» تقع الشدة فوق حرف ___.","content":{"origin":"DADYOOM_G123_SHADDA_TANWEEN_198_ENRICHMENT_20261030","learningAim":"تمييز الشدة والتنوين في أمثلة تدريبية أصلية","items":[{"sentence":"تقع الشدة في «شَدَّ» فوق حرف ___.","options":["الدال","الشين","الراء"]}],"didacticGrade":1},"answer":{"answers":["الدال"]}},{"grade":1,"activity_order":5,"activity_type":"matching","title":"أصنف العلامات","section":"practice","prompt":"صل كل كلمة بعلامتها الصوتية الصحيحة في أمثلة التدريب الإثرائية.","content":{"origin":"DADYOOM_G123_SHADDA_TANWEEN_198_ENRICHMENT_20261030","learningAim":"التصنيف الصوتي الصحيح","left":["شَدَّ","قَلَمٌ","قَلَمٍ"],"right":["تنوين الكسر","شدة على الدال","تنوين الضم"],"didacticGrade":1},"answer":{"pairs":[{"left":"شَدَّ","right":"شدة على الدال"},{"left":"قَلَمٌ","right":"تنوين الضم"},{"left":"قَلَمٍ","right":"تنوين الكسر"}]}},{"grade":1,"activity_order":6,"activity_type":"multiple_choice","title":"أستنتج وأطبّق","section":"assessment","prompt":"أي كلمة تنتهي بعلامة تنوين الضم؟","content":{"origin":"DADYOOM_G123_SHADDA_TANWEEN_198_ENRICHMENT_20261030","learningAim":"تطبيق مفهوم الشدة والتنوين","options":["قَلَمٍ","شَدَّ","قَلَمٌ"],"didacticGrade":1},"answer":{"correct":"قَلَمٌ"}},{"grade":2,"activity_order":4,"activity_type":"fill_blank","title":"ألاحظ العلامة الصوتية","section":"practice","prompt":"أكمل الملاحظة الصوتية: في «قَلَمٍ» يوجد تنوين ___.","content":{"origin":"DADYOOM_G123_SHADDA_TANWEEN_198_ENRICHMENT_20261030","learningAim":"تمييز الشدة والتنوين في أمثلة تدريبية أصلية","items":[{"sentence":"التنوين في «قَلَمٍ» تنوين ___.","options":["الفتح","الكسر","الضم"]}],"didacticGrade":2},"answer":{"answers":["الكسر"]}},{"grade":2,"activity_order":5,"activity_type":"matching","title":"أصنف العلامات","section":"practice","prompt":"صل كل كلمة بعلامتها الصوتية الصحيحة في أمثلة التدريب الإثرائية.","content":{"origin":"DADYOOM_G123_SHADDA_TANWEEN_198_ENRICHMENT_20261030","learningAim":"التصنيف الصوتي الصحيح","left":["مُعَلِّمٌ","قَلَمٌ","قَلَمٍ"],"right":["تنوين كسر على الميم","شدة على اللام","تنوين ضم على الميم"],"didacticGrade":2},"answer":{"pairs":[{"left":"مُعَلِّمٌ","right":"شدة على اللام"},{"left":"قَلَمٌ","right":"تنوين ضم على الميم"},{"left":"قَلَمٍ","right":"تنوين كسر على الميم"}]}},{"grade":2,"activity_order":6,"activity_type":"multiple_choice","title":"أستنتج وأطبّق","section":"assessment","prompt":"ما الفرق بين العلامتين في «قَلَمٌ» و«قَلَمٍ»؟","content":{"origin":"DADYOOM_G123_SHADDA_TANWEEN_198_ENRICHMENT_20261030","learningAim":"تطبيق مفهوم الشدة والتنوين","options":["الأولى تنوين الضم والثانية تنوين الكسر","الأولى شدة والثانية مد بالألف","كلتاهما شدة على القاف"],"didacticGrade":2},"answer":{"correct":"الأولى تنوين الضم والثانية تنوين الكسر"}},{"grade":3,"activity_order":4,"activity_type":"fill_blank","title":"ألاحظ العلامة الصوتية","section":"practice","prompt":"أكمل القاعدة: نسمع صوت نون ساكنة عند وصل الاسم المنون ولكن لا نكتبه حرفًا ___.","content":{"origin":"DADYOOM_G123_SHADDA_TANWEEN_198_ENRICHMENT_20261030","learningAim":"تمييز الشدة والتنوين في أمثلة تدريبية أصلية","items":[{"sentence":"لا نكتب صوت النون في التنوين حرفًا ___.","options":["مستقلًا","مشددًا","ممدودًا"]}],"didacticGrade":3},"answer":{"answers":["مستقلًا"]}},{"grade":3,"activity_order":5,"activity_type":"matching","title":"أصنف العلامات","section":"practice","prompt":"صل كل كلمة بعلامتها الصوتية الصحيحة في أمثلة التدريب الإثرائية.","content":{"origin":"DADYOOM_G123_SHADDA_TANWEEN_198_ENRICHMENT_20261030","learningAim":"التصنيف الصوتي الصحيح","left":["قَلَمٌ","قَلَمًا","قَلَمٍ"],"right":["تنوين الكسر","تنوين الفتح","تنوين الضم"],"didacticGrade":3},"answer":{"pairs":[{"left":"قَلَمٌ","right":"تنوين الضم"},{"left":"قَلَمًا","right":"تنوين الفتح"},{"left":"قَلَمٍ","right":"تنوين الكسر"}]}},{"grade":3,"activity_order":6,"activity_type":"multiple_choice","title":"أستنتج وأطبّق","section":"assessment","prompt":"أي كلمة صحيحة بعد حرف الجر في الجملة «تحدّثتُ عن ...»؟","content":{"origin":"DADYOOM_G123_SHADDA_TANWEEN_198_ENRICHMENT_20261030","learningAim":"تطبيق مفهوم الشدة والتنوين","options":["قَلَمٌ","قَلَمٍ","قَلَمًا"],"didacticGrade":3},"answer":{"correct":"قَلَمٍ"}}]$phonics$::jsonb)
AS x(grade int,activity_order int,activity_type text,title text,section text,prompt text,content jsonb,answer jsonb);
DO $audit$
DECLARE lesson_count int; inserted int; history_count int;
BEGIN
 IF (SELECT count(*) FROM pg_temp.dadyoom_shadda_198_templates)<>9 OR
 (SELECT count(DISTINCT (grade,activity_order)) FROM pg_temp.dadyoom_shadda_198_templates)<>9 OR
 EXISTS(SELECT 1 FROM pg_temp.dadyoom_shadda_198_templates WHERE activity_type IS NULL OR activity_order IS NULL OR content IS NULL OR answer IS NULL) THEN
 RAISE EXCEPTION 'Invalid supplementary Shadda/Tanween template schema';
 END IF;
 WITH lesson_state AS (
  SELECT l.id,l.content,COUNT(a.id) FILTER(WHERE a.is_published) activities,
  COUNT(DISTINCT a.activity_order) AS ordered,MAX(a.activity_order) AS max_order
  FROM public.lessons l
  JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
  LEFT JOIN public.lesson_activities a ON a.lesson_id=l.id
  WHERE l.title='الشدة والتنوين' AND l.status='published' AND g.grade_number BETWEEN 1 AND 3
  GROUP BY l.id,l.content)
 SELECT count(*) INTO lesson_count FROM lesson_state
 WHERE activities=3 AND ordered=3 AND max_order=3
 AND content LIKE '%الشدة%' AND content LIKE '%التنوين%' AND content LIKE '%نطق%' AND content LIKE '%حرف%';
 IF lesson_count<>66 THEN RAISE EXCEPTION 'Lesson evidence/count changed: %',lesson_count; END IF;
 SELECT COUNT(*) INTO history_count FROM public.lessons l
 JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
 WHERE l.title='الشدة والتنوين' AND l.status='published' AND g.grade_number BETWEEN 1 AND 3
 AND (EXISTS(SELECT 1 FROM public.student_lesson_progress sp WHERE sp.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM public.question_attempts at JOIN public.questions q ON q.id=at.question_id WHERE q.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM public.lesson_activity_attempts at JOIN public.lesson_activities a ON a.id=at.activity_id WHERE a.lesson_id=l.id));
 IF history_count<>0 THEN RAISE EXCEPTION 'Found protected learner history in % lessons',history_count; END IF;
 IF EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.content->>'origin'='DADYOOM_G123_SHADDA_TANWEEN_198_ENRICHMENT_20261030') THEN
 RAISE EXCEPTION 'Batch already inserted'; END IF;
 INSERT INTO public.lesson_activities (lesson_id,title,activity_type,instructions,content,
  activity_order,points,is_published,section,prompt,answer,is_required)
 SELECT l.id,t.title,t.activity_type,'أمثلة إثرائية إضافية من ضاديوم: اقرأ الكلمات والمقاطع قبل الإجابة.',
  t.content,t.activity_order,5,true,t.section,t.prompt,t.answer,false
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
 JOIN pg_temp.dadyoom_shadda_198_templates t ON t.grade=g.grade_number
 WHERE l.title='الشدة والتنوين' AND l.status='published' AND g.grade_number BETWEEN 1 AND 3
 AND l.content LIKE '%الشدة%' AND l.content LIKE '%التنوين%' AND l.content LIKE '%نطق%' AND l.content LIKE '%حرف%';
 GET DIAGNOSTICS inserted=ROW_COUNT;
 IF inserted<>198 THEN RAISE EXCEPTION 'Atomic rollback: expected 198, inserted %',inserted; END IF;
 RAISE NOTICE 'DADYOOM_G123_SHADDA_OPTIONAL_ACTIVITIES=%',inserted;
END $audit$;
COMMIT;
