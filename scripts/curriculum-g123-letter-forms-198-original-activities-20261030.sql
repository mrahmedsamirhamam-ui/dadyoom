-- Original independent Arabic letter-form practice, explicitly introduced with sourceContext in every learner activity.
-- Published only on 66 established Grades 1-3 'أشكال الحرف في الكلمة' lessons in 22 countries.
-- Not evidence of matching country ministry editions; doesn't edit existing questions or learner progress.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';
CREATE TEMP TABLE g123_letter_198_templates ON COMMIT DROP AS
SELECT grade::int,activity_order::int,activity_type::text,title::text,section::text,prompt::text,
content::jsonb,answer::jsonb FROM jsonb_to_recordset($letterforms$[{"grade":1,"activity_order":4,"activity_type":"fill_blank","title":"أكمل شكل الحرف","section":"practice","prompt":"في البطاقة «بَاب» حدد حرف الباء الذي يأتي في أوّل الكلمة.","content":{"origin":"DADYOOM_G123_LETTER_FORMS_198_ORIGINAL_20261030","sourceContext":"اقرأ بطاقات ضاديوم الإثرائية التالية: «بَيْت» باء في البداية، «حَبْل» باء في الوسط، «قَلْب» باء في النهاية متصلة، «كِتَاب» باء في النهاية منفصلة لأن الألف لا تتصل بالحرف الذي بعدها. حافظ على اختلاف ترتيب الحروف ومواضعها.","items":[{"sentence":"الحرف الأول في «بَاب» هو ___.","options":["ب","ا","ت"]}],"gradedSkill":"arabic-letter-positions","supplementary":true},"answer":{"answers":["ب"]}},{"grade":1,"activity_order":5,"activity_type":"matching","title":"أصل الكلمة بموضع الباء","section":"practice","prompt":"اقرأ البطاقة الإثرائية، ثم صِل كل كلمة بموضع الباء أو رسمها الصحيح.","content":{"origin":"DADYOOM_G123_LETTER_FORMS_198_ORIGINAL_20261030","sourceContext":"اقرأ بطاقات ضاديوم الإثرائية التالية: «بَيْت» باء في البداية، «حَبْل» باء في الوسط، «قَلْب» باء في النهاية متصلة، «كِتَاب» باء في النهاية منفصلة لأن الألف لا تتصل بالحرف الذي بعدها. حافظ على اختلاف ترتيب الحروف ومواضعها.","left":["بَيْت","حَبْل","قَلْب"],"right":["باء في نهاية الكلمة","باء في بداية الكلمة","باء في وسط الكلمة"],"gradedSkill":"arabic-letter-connection","supplementary":true},"answer":{"pairs":[{"left":"بَيْت","right":"باء في بداية الكلمة"},{"left":"حَبْل","right":"باء في وسط الكلمة"},{"left":"قَلْب","right":"باء في نهاية الكلمة"}]}},{"grade":1,"activity_order":6,"activity_type":"multiple_choice","title":"تحقق من اتصال الحروف","section":"assessment","prompt":"في بطاقة «قَلْب» أين يقع حرف الباء؟","content":{"origin":"DADYOOM_G123_LETTER_FORMS_198_ORIGINAL_20261030","sourceContext":"اقرأ بطاقات ضاديوم الإثرائية التالية: «بَيْت» باء في البداية، «حَبْل» باء في الوسط، «قَلْب» باء في النهاية متصلة، «كِتَاب» باء في النهاية منفصلة لأن الألف لا تتصل بالحرف الذي بعدها. حافظ على اختلاف ترتيب الحروف ومواضعها.","options":["في البداية","في الوسط","في النهاية"],"gradedSkill":"arabic-letter-forms","supplementary":true},"answer":{"correct":"في النهاية"}},{"grade":2,"activity_order":4,"activity_type":"fill_blank","title":"أكمل شكل الحرف","section":"practice","prompt":"لاحظ كلمتي «حَبْل» و«قَلْب». ما الحرف المشترك الذي تغيّر موضعه؟","content":{"origin":"DADYOOM_G123_LETTER_FORMS_198_ORIGINAL_20261030","sourceContext":"اقرأ بطاقات ضاديوم الإثرائية التالية: «بَيْت» باء في البداية، «حَبْل» باء في الوسط، «قَلْب» باء في النهاية متصلة، «كِتَاب» باء في النهاية منفصلة لأن الألف لا تتصل بالحرف الذي بعدها. حافظ على اختلاف ترتيب الحروف ومواضعها.","items":[{"sentence":"الحرف المشترك في «حَبْل» و«قَلْب» هو ___.","options":["ب","ت","ن"]}],"gradedSkill":"arabic-letter-positions","supplementary":true},"answer":{"answers":["ب"]}},{"grade":2,"activity_order":5,"activity_type":"matching","title":"أصل الكلمة بموضع الباء","section":"practice","prompt":"اقرأ البطاقة الإثرائية، ثم صِل كل كلمة بموضع الباء أو رسمها الصحيح.","content":{"origin":"DADYOOM_G123_LETTER_FORMS_198_ORIGINAL_20261030","sourceContext":"اقرأ بطاقات ضاديوم الإثرائية التالية: «بَيْت» باء في البداية، «حَبْل» باء في الوسط، «قَلْب» باء في النهاية متصلة، «كِتَاب» باء في النهاية منفصلة لأن الألف لا تتصل بالحرف الذي بعدها. حافظ على اختلاف ترتيب الحروف ومواضعها.","left":["بَيْت","حَبْل","قَلْب"],"right":["شكل الباء في النهاية المتصلة «ـب»","شكل الباء في البداية «بـ»","شكل الباء في الوسط «ـبـ»"],"gradedSkill":"arabic-letter-connection","supplementary":true},"answer":{"pairs":[{"left":"بَيْت","right":"شكل الباء في البداية «بـ»"},{"left":"حَبْل","right":"شكل الباء في الوسط «ـبـ»"},{"left":"قَلْب","right":"شكل الباء في النهاية المتصلة «ـب»"}]}},{"grade":2,"activity_order":6,"activity_type":"multiple_choice","title":"تحقق من اتصال الحروف","section":"assessment","prompt":"في المثالين «قَلْب» و«كِتَاب»، لماذا يبدو شكل الباء الأخيرة مختلفًا؟","content":{"origin":"DADYOOM_G123_LETTER_FORMS_198_ORIGINAL_20261030","sourceContext":"اقرأ بطاقات ضاديوم الإثرائية التالية: «بَيْت» باء في البداية، «حَبْل» باء في الوسط، «قَلْب» باء في النهاية متصلة، «كِتَاب» باء في النهاية منفصلة لأن الألف لا تتصل بالحرف الذي بعدها. حافظ على اختلاف ترتيب الحروف ومواضعها.","options":["لأن الباء الأولى حرف آخر","لأن الألف في «كِتَاب» لا تتصل بالحرف اللاحق","لأن الباء في «كِتَاب» وسط الكلمة"],"gradedSkill":"arabic-letter-forms","supplementary":true},"answer":{"correct":"لأن الألف في «كِتَاب» لا تتصل بالحرف اللاحق"}},{"grade":3,"activity_order":4,"activity_type":"fill_blank","title":"أكمل شكل الحرف","section":"practice","prompt":"في «كِتَاب» الباء في نهاية الكلمة لكنها منفصلة عمّا قبلها؛ لأن الحرف السابق هو ___.","content":{"origin":"DADYOOM_G123_LETTER_FORMS_198_ORIGINAL_20261030","sourceContext":"اقرأ بطاقات ضاديوم الإثرائية التالية: «بَيْت» باء في البداية، «حَبْل» باء في الوسط، «قَلْب» باء في النهاية متصلة، «كِتَاب» باء في النهاية منفصلة لأن الألف لا تتصل بالحرف الذي بعدها. حافظ على اختلاف ترتيب الحروف ومواضعها.","items":[{"sentence":"الحرف الذي يسبق الباء في «كِتَاب» هو ___.","options":["الألف","اللام","الحاء"]}],"gradedSkill":"arabic-letter-positions","supplementary":true},"answer":{"answers":["الألف"]}},{"grade":3,"activity_order":5,"activity_type":"matching","title":"أصل الكلمة بموضع الباء","section":"practice","prompt":"اقرأ البطاقة الإثرائية، ثم صِل كل كلمة بموضع الباء أو رسمها الصحيح.","content":{"origin":"DADYOOM_G123_LETTER_FORMS_198_ORIGINAL_20261030","sourceContext":"اقرأ بطاقات ضاديوم الإثرائية التالية: «بَيْت» باء في البداية، «حَبْل» باء في الوسط، «قَلْب» باء في النهاية متصلة، «كِتَاب» باء في النهاية منفصلة لأن الألف لا تتصل بالحرف الذي بعدها. حافظ على اختلاف ترتيب الحروف ومواضعها.","left":["حَبْل","قَلْب","كِتَاب"],"right":["باء نهائية منفصلة بسبب الألف السابقة","باء وسطية متصلة","باء نهائية متصلة"],"gradedSkill":"arabic-letter-connection","supplementary":true},"answer":{"pairs":[{"left":"حَبْل","right":"باء وسطية متصلة"},{"left":"قَلْب","right":"باء نهائية متصلة"},{"left":"كِتَاب","right":"باء نهائية منفصلة بسبب الألف السابقة"}]}},{"grade":3,"activity_order":6,"activity_type":"multiple_choice","title":"تحقق من اتصال الحروف","section":"assessment","prompt":"ما الاستنتاج الصحيح من مقارنة الباء في «قَلْب» و«كِتَاب»؟","content":{"origin":"DADYOOM_G123_LETTER_FORMS_198_ORIGINAL_20261030","sourceContext":"اقرأ بطاقات ضاديوم الإثرائية التالية: «بَيْت» باء في البداية، «حَبْل» باء في الوسط، «قَلْب» باء في النهاية متصلة، «كِتَاب» باء في النهاية منفصلة لأن الألف لا تتصل بالحرف الذي بعدها. حافظ على اختلاف ترتيب الحروف ومواضعها.","options":["تختلف في الصوت والاسم","يتغيّر موضعها من آخر إلى أول","تبقى في آخر الكلمتين، ويختلف اتصالها بما قبلها"],"gradedSkill":"arabic-letter-forms","supplementary":true},"answer":{"correct":"تبقى في آخر الكلمتين، ويختلف اتصالها بما قبلها"}}]$letterforms$::jsonb)
AS x(grade int,activity_order int,activity_type text,title text,section text,prompt text,content jsonb,answer jsonb);
DO $safe$
DECLARE lesson_count int;protected_count int;inserted int;
BEGIN
IF (SELECT count(*) FROM pg_temp.g123_letter_198_templates)<>9 OR
(SELECT count(DISTINCT (grade,activity_order)) FROM pg_temp.g123_letter_198_templates)<>9 OR
EXISTS(SELECT 1 FROM pg_temp.g123_letter_198_templates WHERE activity_type IS NULL OR answer IS NULL OR content IS NULL OR activity_order IS NULL)
THEN RAISE EXCEPTION 'Invalid nine grade-specific original templates'; END IF;
WITH source AS (
 SELECT l.id,l.content,count(a.id) FILTER(WHERE a.is_published) n,count(DISTINCT a.activity_order) positions,
 max(a.activity_order) max_position
 FROM public.lessons l
 JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
 LEFT JOIN public.lesson_activities a ON a.lesson_id=l.id
 WHERE l.title='أشكال الحرف في الكلمة' AND l.status='published' AND g.grade_number BETWEEN 1 AND 3
 GROUP BY l.id,l.content)
SELECT count(*) INTO lesson_count FROM source
WHERE n=3 AND positions=3 AND max_position=3
AND content LIKE '%الحرف%' AND content LIKE '%الكلمة%' AND
(content LIKE '%اتصال%' OR content LIKE '%وصل%');
IF lesson_count<>66 THEN RAISE EXCEPTION 'Scope/existing 3 activities mismatch: %',lesson_count; END IF;
SELECT count(*) INTO protected_count FROM public.lessons l
 JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
 WHERE l.title='أشكال الحرف في الكلمة' AND l.status='published' AND g.grade_number BETWEEN 1 AND 3
 AND (EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM public.lesson_activity_attempts at JOIN public.lesson_activities a ON a.id=at.activity_id WHERE a.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM public.question_attempts at JOIN public.questions q ON q.id=at.question_id WHERE q.lesson_id=l.id));
IF protected_count<>0 THEN RAISE EXCEPTION 'Abort: student history exists in % target lessons',protected_count; END IF;
IF EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.content->>'origin'='DADYOOM_G123_LETTER_FORMS_198_ORIGINAL_20261030')
THEN RAISE EXCEPTION 'Duplicate origin marker'; END IF;
INSERT INTO public.lesson_activities
(lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required)
SELECT l.id,t.title,t.activity_type,
'اقرأ البطاقة التوضيحية الإضافية في النشاط ثم أجب؛ درس الدولة يبقى مستقلًا.',
t.content,t.activity_order,5,true,t.section,t.prompt,t.answer,false
FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
JOIN pg_temp.g123_letter_198_templates t ON t.grade=g.grade_number
WHERE l.title='أشكال الحرف في الكلمة' AND l.status='published' AND g.grade_number BETWEEN 1 AND 3
AND l.content LIKE '%الحرف%' AND l.content LIKE '%الكلمة%' AND
(l.content LIKE '%اتصال%' OR l.content LIKE '%وصل%');
GET DIAGNOSTICS inserted=ROW_COUNT;
IF inserted<>198 THEN RAISE EXCEPTION 'Atomic rollback: inserted %, expected 198',inserted; END IF;
RAISE NOTICE 'DADYOOM_LETTER_FORMS_G123_ORIGINAL_ACTIVITIES=%',inserted;
END $safe$;
COMMIT;
