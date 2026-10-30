-- 65 / 66 Grades1-3 'الأصوات والحروف' lessons, 195 self-contained original activities.
-- A lesson with pre-existing learner activity attempts is excluded; never change its assessment or progression.
-- Existing learner progress and attempt records are read only; no prior activity answer updated.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';
CREATE TEMP TABLE g123_phoneme_195_templates ON COMMIT DROP AS
SELECT grade::int,activity_order::int,activity_type::text,title::text,section::text,prompt::text,
 content::jsonb,answer::jsonb FROM jsonb_to_recordset($phonemes$[{"grade":1,"activity_order":4,"activity_type":"fill_blank","title":"أكتشف الصوت والحرف","section":"practice","prompt":"اقرأ «سَمَك». ما أول حرف مكتوب فيها؟","content":{"origin":"DADYOOM_G123_PHONEMES_195_ORIGINAL_20261030","originalReference":"بطاقة ضاديوم الإثرائية: اقرأ «سَمَك» (سَ)، «سِتَّة» (سِ)، «مَاء» (مَ)، «بَيْت» (بَ)، «قَمَر» (قَ)، «وَرْد» (وَ). يختلف الصوت عند اختلاف الحرف أو الحركة. في التحليل المتقدم: «سَارَ» فعل حركة و«صَارَ» فعل تحوّل، و«بَيْت» مسكن و«زَيْت» مادة غذائية؛ تبديل الحرف الأول قد يغير معنى الكلمة. هذه أمثلة إضافية أصلية وليست اقتباسًا من المنهج الوزاري.","difficulty":1,"items":[{"sentence":"الحرف الأول في كلمة «سَمَك» هو ___.","options":["س","م","ك"]}]},"answer":{"answers":["س"]}},{"grade":1,"activity_order":5,"activity_type":"matching","title":"أصنّف الكلمات والأصوات","section":"practice","prompt":"اقرأ بطاقة ضاديوم الإثرائية ثم صِل كل كلمة بصوتها أو معناها الدقيق.","content":{"origin":"DADYOOM_G123_PHONEMES_195_ORIGINAL_20261030","originalReference":"بطاقة ضاديوم الإثرائية: اقرأ «سَمَك» (سَ)، «سِتَّة» (سِ)، «مَاء» (مَ)، «بَيْت» (بَ)، «قَمَر» (قَ)، «وَرْد» (وَ). يختلف الصوت عند اختلاف الحرف أو الحركة. في التحليل المتقدم: «سَارَ» فعل حركة و«صَارَ» فعل تحوّل، و«بَيْت» مسكن و«زَيْت» مادة غذائية؛ تبديل الحرف الأول قد يغير معنى الكلمة. هذه أمثلة إضافية أصلية وليست اقتباسًا من المنهج الوزاري.","difficulty":1,"left":["سَمَك","مَاء","قَمَر"],"right":["ق","س","م"]},"answer":{"pairs":[{"left":"سَمَك","right":"س"},{"left":"مَاء","right":"م"},{"left":"قَمَر","right":"ق"}]}},{"grade":1,"activity_order":6,"activity_type":"multiple_choice","title":"أفسّر الفرق الصوتي","section":"assessment","prompt":"أيّ كلمة تبدأ بحرف الباء في بطاقة القراءة؟","content":{"origin":"DADYOOM_G123_PHONEMES_195_ORIGINAL_20261030","originalReference":"بطاقة ضاديوم الإثرائية: اقرأ «سَمَك» (سَ)، «سِتَّة» (سِ)، «مَاء» (مَ)، «بَيْت» (بَ)، «قَمَر» (قَ)، «وَرْد» (وَ). يختلف الصوت عند اختلاف الحرف أو الحركة. في التحليل المتقدم: «سَارَ» فعل حركة و«صَارَ» فعل تحوّل، و«بَيْت» مسكن و«زَيْت» مادة غذائية؛ تبديل الحرف الأول قد يغير معنى الكلمة. هذه أمثلة إضافية أصلية وليست اقتباسًا من المنهج الوزاري.","difficulty":1,"options":["قَمَر","بَيْت","وَرْد"]},"answer":{"correct":"بَيْت"}},{"grade":2,"activity_order":4,"activity_type":"fill_blank","title":"أكتشف الصوت والحرف","section":"practice","prompt":"قارن «سَمَك» و«سِتَّة»: يختلف صوت السين بسبب ___.","content":{"origin":"DADYOOM_G123_PHONEMES_195_ORIGINAL_20261030","originalReference":"بطاقة ضاديوم الإثرائية: اقرأ «سَمَك» (سَ)، «سِتَّة» (سِ)، «مَاء» (مَ)، «بَيْت» (بَ)، «قَمَر» (قَ)، «وَرْد» (وَ). يختلف الصوت عند اختلاف الحرف أو الحركة. في التحليل المتقدم: «سَارَ» فعل حركة و«صَارَ» فعل تحوّل، و«بَيْت» مسكن و«زَيْت» مادة غذائية؛ تبديل الحرف الأول قد يغير معنى الكلمة. هذه أمثلة إضافية أصلية وليست اقتباسًا من المنهج الوزاري.","difficulty":2,"items":[{"sentence":"يختلف نطق السين في «سَمَك» و«سِتَّة» بسبب ___.","options":["الحركة القصيرة","اسم الحرف","عدد الكلمات"]}]},"answer":{"answers":["الحركة القصيرة"]}},{"grade":2,"activity_order":5,"activity_type":"matching","title":"أصنّف الكلمات والأصوات","section":"practice","prompt":"اقرأ بطاقة ضاديوم الإثرائية ثم صِل كل كلمة بصوتها أو معناها الدقيق.","content":{"origin":"DADYOOM_G123_PHONEMES_195_ORIGINAL_20261030","originalReference":"بطاقة ضاديوم الإثرائية: اقرأ «سَمَك» (سَ)، «سِتَّة» (سِ)، «مَاء» (مَ)، «بَيْت» (بَ)، «قَمَر» (قَ)، «وَرْد» (وَ). يختلف الصوت عند اختلاف الحرف أو الحركة. في التحليل المتقدم: «سَارَ» فعل حركة و«صَارَ» فعل تحوّل، و«بَيْت» مسكن و«زَيْت» مادة غذائية؛ تبديل الحرف الأول قد يغير معنى الكلمة. هذه أمثلة إضافية أصلية وليست اقتباسًا من المنهج الوزاري.","difficulty":2,"left":["سَمَك","سِتَّة","مَاء"],"right":["ميم في البداية","سين مكسورة في البداية","سين مفتوحة في البداية"]},"answer":{"pairs":[{"left":"سَمَك","right":"سين مفتوحة في البداية"},{"left":"سِتَّة","right":"سين مكسورة في البداية"},{"left":"مَاء","right":"ميم في البداية"}]}},{"grade":2,"activity_order":6,"activity_type":"multiple_choice","title":"أفسّر الفرق الصوتي","section":"assessment","prompt":"كيف نعرف صوت البداية في «سِتَّة»؟","content":{"origin":"DADYOOM_G123_PHONEMES_195_ORIGINAL_20261030","originalReference":"بطاقة ضاديوم الإثرائية: اقرأ «سَمَك» (سَ)، «سِتَّة» (سِ)، «مَاء» (مَ)، «بَيْت» (بَ)، «قَمَر» (قَ)، «وَرْد» (وَ). يختلف الصوت عند اختلاف الحرف أو الحركة. في التحليل المتقدم: «سَارَ» فعل حركة و«صَارَ» فعل تحوّل، و«بَيْت» مسكن و«زَيْت» مادة غذائية؛ تبديل الحرف الأول قد يغير معنى الكلمة. هذه أمثلة إضافية أصلية وليست اقتباسًا من المنهج الوزاري.","difficulty":2,"options":["من لون البطاقة","من شكل الحرف والحركة عليه «سِ»","من الحرف الأخير فقط"]},"answer":{"correct":"من شكل الحرف والحركة عليه «سِ»"}},{"grade":3,"activity_order":4,"activity_type":"fill_blank","title":"أكتشف الصوت والحرف","section":"practice","prompt":"قارن «سَارَ» و«صَارَ»: تغيّر المعنى بتبديل حرف ___.","content":{"origin":"DADYOOM_G123_PHONEMES_195_ORIGINAL_20261030","originalReference":"بطاقة ضاديوم الإثرائية: اقرأ «سَمَك» (سَ)، «سِتَّة» (سِ)، «مَاء» (مَ)، «بَيْت» (بَ)، «قَمَر» (قَ)، «وَرْد» (وَ). يختلف الصوت عند اختلاف الحرف أو الحركة. في التحليل المتقدم: «سَارَ» فعل حركة و«صَارَ» فعل تحوّل، و«بَيْت» مسكن و«زَيْت» مادة غذائية؛ تبديل الحرف الأول قد يغير معنى الكلمة. هذه أمثلة إضافية أصلية وليست اقتباسًا من المنهج الوزاري.","difficulty":3,"items":[{"sentence":"تغيّر معنى «سَارَ» و«صَارَ» عند تغيير حرف ___.","options":["البداية","النهاية","الوسط"]}]},"answer":{"answers":["البداية"]}},{"grade":3,"activity_order":5,"activity_type":"matching","title":"أصنّف الكلمات والأصوات","section":"practice","prompt":"اقرأ بطاقة ضاديوم الإثرائية ثم صِل كل كلمة بصوتها أو معناها الدقيق.","content":{"origin":"DADYOOM_G123_PHONEMES_195_ORIGINAL_20261030","originalReference":"بطاقة ضاديوم الإثرائية: اقرأ «سَمَك» (سَ)، «سِتَّة» (سِ)، «مَاء» (مَ)، «بَيْت» (بَ)، «قَمَر» (قَ)، «وَرْد» (وَ). يختلف الصوت عند اختلاف الحرف أو الحركة. في التحليل المتقدم: «سَارَ» فعل حركة و«صَارَ» فعل تحوّل، و«بَيْت» مسكن و«زَيْت» مادة غذائية؛ تبديل الحرف الأول قد يغير معنى الكلمة. هذه أمثلة إضافية أصلية وليست اقتباسًا من المنهج الوزاري.","difficulty":3,"left":["سَارَ","صَارَ","زَيْت"],"right":["مادة غذائية دهنية","فعل يدل على تحرك أو مشي","فعل يدل على تحوّل في الحال"]},"answer":{"pairs":[{"left":"سَارَ","right":"فعل يدل على تحرك أو مشي"},{"left":"صَارَ","right":"فعل يدل على تحوّل في الحال"},{"left":"زَيْت","right":"مادة غذائية دهنية"}]}},{"grade":3,"activity_order":6,"activity_type":"multiple_choice","title":"أفسّر الفرق الصوتي","section":"assessment","prompt":"لماذا تختلف دلالة «بَيْت» و«زَيْت» رغم اشتراكهما في بقية الحروف؟","content":{"origin":"DADYOOM_G123_PHONEMES_195_ORIGINAL_20261030","originalReference":"بطاقة ضاديوم الإثرائية: اقرأ «سَمَك» (سَ)، «سِتَّة» (سِ)، «مَاء» (مَ)، «بَيْت» (بَ)، «قَمَر» (قَ)، «وَرْد» (وَ). يختلف الصوت عند اختلاف الحرف أو الحركة. في التحليل المتقدم: «سَارَ» فعل حركة و«صَارَ» فعل تحوّل، و«بَيْت» مسكن و«زَيْت» مادة غذائية؛ تبديل الحرف الأول قد يغير معنى الكلمة. هذه أمثلة إضافية أصلية وليست اقتباسًا من المنهج الوزاري.","difficulty":3,"options":["لتغيّر الحرف الأول وصوته","لتساوي الحروف كلها","لأن الكلمتين من دون معنى"]},"answer":{"correct":"لتغيّر الحرف الأول وصوته"}}]$phonemes$::jsonb)
 AS x(grade int,activity_order int,activity_type text,title text,section text,prompt text,content jsonb,answer jsonb);
DO $safe$
DECLARE total_count int; protected_count int; eligible int; inserted int;
BEGIN
IF (SELECT count(*) FROM pg_temp.g123_phoneme_195_templates)<>9 OR
(SELECT count(DISTINCT (grade,activity_order)) FROM pg_temp.g123_phoneme_195_templates)<>9 OR
EXISTS(SELECT 1 FROM pg_temp.g123_phoneme_195_templates WHERE activity_type IS NULL OR answer IS NULL OR content IS NULL OR activity_order IS NULL)
THEN RAISE EXCEPTION 'Invalid grade-differentiated phoneme activity templates'; END IF;
WITH candidate AS (
 SELECT l.id,l.content,
 count(a.id) FILTER(WHERE a.is_published) n,
 count(DISTINCT a.activity_order) positions,max(a.activity_order) max_pos
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
 LEFT JOIN public.lesson_activities a ON a.lesson_id=l.id
 WHERE l.title='الأصوات والحروف' AND l.status='published' AND g.grade_number BETWEEN 1 AND 3
 GROUP BY l.id,l.content)
SELECT count(*) INTO total_count FROM candidate WHERE n=3 AND positions=3 AND max_pos=3
AND content LIKE '%الصوت%' AND content LIKE '%الحرف%' AND content LIKE '%الكلمة%';
IF total_count<>66 THEN RAISE EXCEPTION 'Expected exactly 66 unchanged phoneme lessons: %',total_count; END IF;
SELECT count(*) INTO protected_count
FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
WHERE l.title='الأصوات والحروف' AND l.status='published' AND g.grade_number BETWEEN 1 AND 3
AND (EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM public.lesson_activity_attempts at JOIN public.lesson_activities a ON a.id=at.activity_id WHERE a.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM public.question_attempts at JOIN public.questions q ON q.id=at.question_id WHERE q.lesson_id=l.id));
IF protected_count<>1 THEN RAISE EXCEPTION 'Expected exactly 1 existing learner-history lesson, found %',protected_count; END IF;
IF EXISTS(SELECT 1 FROM public.lesson_activities a WHERE a.content->>'origin'='DADYOOM_G123_PHONEMES_195_ORIGINAL_20261030')
THEN RAISE EXCEPTION 'This batch was already installed'; END IF;
SELECT count(*) INTO eligible FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
WHERE l.title='الأصوات والحروف' AND l.status='published' AND g.grade_number BETWEEN 1 AND 3
AND l.content LIKE '%الصوت%' AND l.content LIKE '%الحرف%' AND l.content LIKE '%الكلمة%'
AND NOT EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
AND NOT EXISTS(SELECT 1 FROM public.lesson_activity_attempts at JOIN public.lesson_activities a ON a.id=at.activity_id WHERE a.lesson_id=l.id)
AND NOT EXISTS(SELECT 1 FROM public.question_attempts at JOIN public.questions q ON q.id=at.question_id WHERE q.lesson_id=l.id);
IF eligible<>65 THEN RAISE EXCEPTION 'Expected 65 safe target lessons, found %',eligible; END IF;
INSERT INTO public.lesson_activities
(lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required)
SELECT l.id,t.title,t.activity_type,
'تدريب أصلي إضافي؛ اقرأ البطاقة التعريفية داخل النشاط، ثم أجب دون استبدال محتوى الدولة.',
t.content,t.activity_order,5,true,t.section,t.prompt,t.answer,false
FROM public.lessons l JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
JOIN pg_temp.g123_phoneme_195_templates t ON t.grade=g.grade_number
WHERE l.title='الأصوات والحروف' AND l.status='published' AND g.grade_number BETWEEN 1 AND 3
AND l.content LIKE '%الصوت%' AND l.content LIKE '%الحرف%' AND l.content LIKE '%الكلمة%'
AND NOT EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
AND NOT EXISTS(SELECT 1 FROM public.lesson_activity_attempts at JOIN public.lesson_activities a ON a.id=at.activity_id WHERE a.lesson_id=l.id)
AND NOT EXISTS(SELECT 1 FROM public.question_attempts at JOIN public.questions q ON q.id=at.question_id WHERE q.lesson_id=l.id);
GET DIAGNOSTICS inserted=ROW_COUNT;
IF inserted<>195 THEN RAISE EXCEPTION 'Rollback: inserted %, expected 195',inserted; END IF;
RAISE NOTICE 'DADYOOM_G123_PHONEME_ACTIVITY_COUNT=%',inserted;
END $safe$;
COMMIT;
