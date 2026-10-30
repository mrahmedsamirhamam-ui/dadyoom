-- Dadyoom Grades 1-3: 66 genuine 'السكون والمقطع' lessons; original self-contained supplementary phonics activities.
-- Preserve the local lesson examples and country-specific course mappings; these are additional independent practice examples.
-- 3 OPTIONAL activities per existing lesson; no change to any old assessment, progress, source or official status.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';
CREATE TEMP TABLE g123_sukun_198_templates ON COMMIT DROP AS
SELECT grade::int,activity_order::int,activity_type::text,title::text,section::text,prompt::text,
 content::jsonb,answer::jsonb FROM jsonb_to_recordset($sukun$[{"grade":1,"activity_order":4,"activity_type":"fill_blank","title":"أنطق الحرف الساكن","section":"practice","prompt":"أكمل: في المقطع «مَدْ» الحرف الذي يحمل السكون هو ___.","content":{"origin":"DADYOOM_G123_SUKUN_198_ORIGINAL_20261030","didacticGrade":1,"examplesNote":"بطاقات أصلية إضافية لتدريب السكون","items":[{"sentence":"الحرف الساكن في «مَدْ» هو ___.","options":["الدال","الميم","الألف"]}]},"answer":{"answers":["الدال"]}},{"grade":1,"activity_order":5,"activity_type":"matching","title":"أصل المقطع بالحرف الساكن","section":"practice","prompt":"أصل كل مقطع تدريبي بالحرف الساكن أو بحركته الصحيحة.","content":{"origin":"DADYOOM_G123_SUKUN_198_ORIGINAL_20261030","didacticGrade":1,"examplesNote":"بطاقات صوتية إضافية","left":["مَدْ","مِنْ","قُلْ"],"right":["النون ساكنة","اللام ساكنة","الدال ساكنة"]},"answer":{"pairs":[{"left":"مَدْ","right":"الدال ساكنة"},{"left":"مِنْ","right":"النون ساكنة"},{"left":"قُلْ","right":"اللام ساكنة"}]}},{"grade":1,"activity_order":6,"activity_type":"multiple_choice","title":"أفسر وأقارن","section":"assessment","prompt":"أيّ مقطع ينتهي بحرف عليه علامة السكون؟","content":{"origin":"DADYOOM_G123_SUKUN_198_ORIGINAL_20261030","didacticGrade":1,"examplesNote":"قياس فهم السكون في مثال أصلي","options":["مَدَ","مَ","مَدْ"]},"answer":{"correct":"مَدْ"}},{"grade":2,"activity_order":4,"activity_type":"fill_blank","title":"أنطق الحرف الساكن","section":"practice","prompt":"ركّب المقطع «مَكْ» من «مَ» ثم الحرف ___.","content":{"origin":"DADYOOM_G123_SUKUN_198_ORIGINAL_20261030","didacticGrade":2,"examplesNote":"بطاقات أصلية إضافية لتدريب السكون","items":[{"sentence":"مَ + ___ = مَكْ.","options":["كَ","كْ","كِ"]}]},"answer":{"answers":["كْ"]}},{"grade":2,"activity_order":5,"activity_type":"matching","title":"أصل المقطع بالحرف الساكن","section":"practice","prompt":"أصل كل مقطع تدريبي بالحرف الساكن أو بحركته الصحيحة.","content":{"origin":"DADYOOM_G123_SUKUN_198_ORIGINAL_20261030","didacticGrade":2,"examplesNote":"بطاقات صوتية إضافية","left":["مَكْ","دَفْ","نَخْ"],"right":["فاء ساكنة","خاء ساكنة","كاف ساكنة"]},"answer":{"pairs":[{"left":"مَكْ","right":"كاف ساكنة"},{"left":"دَفْ","right":"فاء ساكنة"},{"left":"نَخْ","right":"خاء ساكنة"}]}},{"grade":2,"activity_order":6,"activity_type":"multiple_choice","title":"أفسر وأقارن","section":"assessment","prompt":"أي قراءة مضبوطة لأول مقطع من «مَكْتَبٌ»؟","content":{"origin":"DADYOOM_G123_SUKUN_198_ORIGINAL_20261030","didacticGrade":2,"examplesNote":"قياس فهم السكون في مثال أصلي","options":["مَكْ","مَكَ","مِكْ"]},"answer":{"correct":"مَكْ"}},{"grade":3,"activity_order":4,"activity_type":"fill_blank","title":"أنطق الحرف الساكن","section":"practice","prompt":"قارن «مَدْ» و«مَدَ»: في المقطع الأول الدال ___.","content":{"origin":"DADYOOM_G123_SUKUN_198_ORIGINAL_20261030","didacticGrade":3,"examplesNote":"بطاقات أصلية إضافية لتدريب السكون","items":[{"sentence":"الدال في «مَدْ» ___.","options":["مفتوحة","ساكنة","مكسورة"]}]},"answer":{"answers":["ساكنة"]}},{"grade":3,"activity_order":5,"activity_type":"matching","title":"أصل المقطع بالحرف الساكن","section":"practice","prompt":"أصل كل مقطع تدريبي بالحرف الساكن أو بحركته الصحيحة.","content":{"origin":"DADYOOM_G123_SUKUN_198_ORIGINAL_20261030","didacticGrade":3,"examplesNote":"بطاقات صوتية إضافية","left":["مَدْ","مَدَ","مِنْ"],"right":["الدال مفتوحة","النون ساكنة","الدال ساكنة"]},"answer":{"pairs":[{"left":"مَدْ","right":"الدال ساكنة"},{"left":"مَدَ","right":"الدال مفتوحة"},{"left":"مِنْ","right":"النون ساكنة"}]}},{"grade":3,"activity_order":6,"activity_type":"multiple_choice","title":"أفسر وأقارن","section":"assessment","prompt":"لماذا لا نضيف فتحة بعد الدال في المقطع «مَدْ»؟","content":{"origin":"DADYOOM_G123_SUKUN_198_ORIGINAL_20261030","didacticGrade":3,"examplesNote":"قياس فهم السكون في مثال أصلي","options":["لأن الدال محذوفة من الكتابة","لأن الميم مكسورة","لأن الدال ساكنة ولا تتبعها حركة قصيرة"]},"answer":{"correct":"لأن الدال ساكنة ولا تتبعها حركة قصيرة"}}]$sukun$::jsonb)
 AS x(grade int,activity_order int,activity_type text,title text,section text,prompt text,content jsonb,answer jsonb);
DO $original$
DECLARE eligible int; inserted int; protected int;
BEGIN
 IF (SELECT COUNT(*) FROM pg_temp.g123_sukun_198_templates)<>9 OR
 (SELECT COUNT(DISTINCT (grade,activity_order)) FROM pg_temp.g123_sukun_198_templates)<>9 OR
 EXISTS(SELECT 1 FROM pg_temp.g123_sukun_198_templates WHERE activity_type IS NULL OR answer IS NULL OR content IS NULL OR activity_order IS NULL)
 THEN RAISE EXCEPTION 'Invalid original Sukun template array'; END IF;
 WITH candidate AS (
 SELECT l.id,l.content,COUNT(a.id) FILTER(WHERE a.is_published) n,
 COUNT(DISTINCT a.activity_order) orders,MAX(a.activity_order) max_order
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
 LEFT JOIN public.lesson_activities a ON a.lesson_id=l.id
 WHERE l.title='السكون والمقطع' AND l.status='published' AND g.grade_number BETWEEN 1 AND 3
 GROUP BY l.id,l.content)
 SELECT COUNT(*) INTO eligible FROM candidate WHERE n=3 AND orders=3 AND max_order=3
 AND content LIKE '%السكون%' AND content LIKE '%مقطع%' AND content LIKE '%ساكن%' AND content LIKE '%حركة%';
 IF eligible<>66 THEN RAISE EXCEPTION 'Abort: expected 66 unchanged skill lessons, got %',eligible; END IF;
 SELECT COUNT(*) INTO protected FROM public.lessons l
 JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
 WHERE l.title='السكون والمقطع' AND l.status='published' AND g.grade_number BETWEEN 1 AND 3
 AND (EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM public.question_attempts at JOIN public.questions q ON q.id=at.question_id WHERE q.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM public.lesson_activity_attempts at JOIN public.lesson_activities a ON a.id=at.activity_id WHERE a.lesson_id=l.id));
 IF protected<>0 THEN RAISE EXCEPTION 'Abort: lessons with learner history=%',protected; END IF;
 IF EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.content->>'origin'='DADYOOM_G123_SUKUN_198_ORIGINAL_20261030') THEN
 RAISE EXCEPTION 'Duplicate Sukun batch blocked'; END IF;
 INSERT INTO public.lesson_activities
 (lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required)
 SELECT l.id,t.title,t.activity_type,'تدريب إضافي أصلي على السكون؛ لا يغني عن شرح درس بلدك.',
 t.content,t.activity_order,5,true,t.section,t.prompt,t.answer,false
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
 JOIN pg_temp.g123_sukun_198_templates t ON t.grade=g.grade_number
 WHERE l.title='السكون والمقطع' AND l.status='published' AND g.grade_number BETWEEN 1 AND 3
 AND l.content LIKE '%السكون%' AND l.content LIKE '%مقطع%' AND l.content LIKE '%ساكن%' AND l.content LIKE '%حركة%';
 GET DIAGNOSTICS inserted=ROW_COUNT;
 IF inserted<>198 THEN RAISE EXCEPTION 'Atomic rollback: unexpected new activity count %',inserted; END IF;
 RAISE NOTICE 'DADYOOM_G123_SUKUN_OPTIONAL_ACTIVITIES=%',inserted;
END $original$;
COMMIT;
