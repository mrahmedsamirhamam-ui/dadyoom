-- 2026-10-31: three originally-authored BH G1 unit review lessons.
-- One existing MCQ + five completion-only practice records = six per lesson.
-- No official 2026–27 Ministry curriculum matching claims; source review is required.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';

CREATE TEMP TABLE bh_g1_three_units ON COMMIT DROP AS
WITH act AS (SELECT lesson_id,count(*) FILTER(WHERE is_published) n,count(*) total FROM public.lesson_activities GROUP BY lesson_id)
SELECT l.id lesson_id, l.title, l.content,
 trim(split_part(split_part(l.content,'نراجع الحروف:',2),'.',1)) letters,
 trim(split_part(split_part(l.content,'في المستوى الثاني نربط الكلمات التالية بحروفها الأولى:',2),'.',1)) words
FROM public.lessons l
JOIN public.units u ON l.unit_id=u.id JOIN public.grades g ON u.grade_id=g.id
JOIN public.curricula cu ON g.curriculum_id=cu.id JOIN public.countries c ON cu.country_id=c.id
JOIN act a ON a.lesson_id=l.id
WHERE c.code='BH' AND g.grade_number=1 AND l.status='published'
  AND l.title IN ('أعزز مكتسباتي — الوحدة الأولى','أعزز مكتسباتي — الوحدة الثانية','أعزز مكتسباتي — الوحدة الثالثة')
  AND a.n=1 AND a.total=1
  AND l.content LIKE '%نراجع الحروف:%'
  AND l.content LIKE '%في المستوى الثاني نربط الكلمات التالية بحروفها الأولى:%'
  AND NOT EXISTS(SELECT 1 FROM student_lesson_progress p WHERE p.lesson_id=l.id)
  AND NOT EXISTS(SELECT 1 FROM question_attempts qa JOIN questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id)
  AND NOT EXISTS(SELECT 1 FROM lesson_activity_attempts at JOIN lesson_activities aa ON aa.id=at.activity_id WHERE aa.lesson_id=l.id);

DO $preflight$
DECLARE n integer; bad integer;
BEGIN
 SELECT count(*) INTO n FROM bh_g1_three_units;
 IF n<>3 THEN RAISE EXCEPTION 'Expected three untouched BH grade-1 unit reviews, got %',n; END IF;
 SELECT count(*) INTO bad FROM bh_g1_three_units
 WHERE length(letters)<10 OR length(words)<15 OR
       array_length(string_to_array(letters,'،'),1)<5 OR
       array_length(string_to_array(words,'،'),1)<5;
 IF bad<>0 THEN RAISE EXCEPTION 'Unsafe letter/word anchors in % unit review(s)',bad; END IF;
END $preflight$;

INSERT INTO public.lesson_activities
 (lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required)
SELECT x.lesson_id,v.title,v.t,
 'تدريب أصلي اختياري بإشراف المعلم؛ لا تمثل ممارسة الإتمام نتيجة إتقان أو إجابة آلية صحيحة.',
 v.content,v.ord,0,true,v.section,v.prompt,'{}'::jsonb,false
FROM bh_g1_three_units x
CROSS JOIN LATERAL (
 VALUES
 (2,'listening','أستمع ثم أحدد الحرف','الاستماع',
  'استمع إلى «'||x.words||'» واختر شفهيًا الحرف الذي يبدأ به أول مثال في نشاط «'||x.title||'».',
  jsonb_build_object('origin','DADYOOM_BH_G1_THREE_UNIT_REVIEWS_15_20261031',
   'requiresTeacherRead',true,'text','مراجعة صوتية أصلية من ضاديوم: '||x.words||'. هذه أمثلة على الحروف '||x.letters||'.',
   'listeningQuestion','ما الحرف الذي سمعت صوته أولًا؟','bookContentUnverified',true)),
 (3,'reading','أقرأ كلمات وحدتي','القراءة',
  'اقرأ كلمات المراجعة بالتعاون مع المعلم، وأشر إلى الكلمة التي تبدأ بالصوت الذي ينطقه.',
  jsonb_build_object('origin','DADYOOM_BH_G1_THREE_UNIT_REVIEWS_15_20261031',
   'originalText','أقرأ مع معلمي بطاقات الكلمات: '||x.words||'.',
   'examples',to_jsonb(string_to_array(x.words,'،')),
   'bookContentUnverified',true)),
 (4,'speaking','أشارك في لعبة البطاقات','التحدث',
  'ضع بطاقات الحروف «'||x.letters||'» ثم التقط بطاقة كلمة واذكر حرفها الأول أمام زميل أو بالإشارة.',
  jsonb_build_object('origin','DADYOOM_BH_G1_THREE_UNIT_REVIEWS_15_20261031',
   'teacherTask','نشاط بطاقات تعاوني من تأليف ضاديوم مستند إلى الحروف والأمثلة الأصلية في هذا الدرس.',
   'letterCards',to_jsonb(string_to_array(x.letters,'،')),
   'wordCards',to_jsonb(string_to_array(x.words,'،')),
   'bookContentUnverified',true)),
 (5,'writing','أتتبع الحرف وأكتبه','الكتابة',
  'اختر كلمة من «'||x.words||'»، وتتبع حرفها الأول ثم اكتبه كتابة واضحة على سطر بمساعدة المعلم.',
  jsonb_build_object('origin','DADYOOM_BH_G1_THREE_UNIT_REVIEWS_15_20261031',
   'letter',left(trim(split_part(x.words,'،',1)),1),
   'examples',to_jsonb(string_to_array(x.words,'،')),
   'bookContentUnverified',true)),
 (6,'reading','أقارن صوتين مختلفين','القراءة',
  'قارن الكلمتين الأوليين في بطاقات المراجعة «'||trim(split_part(x.words,'،',1))||'» و«'||trim(split_part(split_part(x.words,'،',2),'،',1))||'»: هل يتشابهان في صوت البداية؟ وضح باستخدام بطاقة الحرف.',
  jsonb_build_object('origin','DADYOOM_BH_G1_THREE_UNIT_REVIEWS_15_20261031',
   'originalText','أقارن بداية كلمتي «'||trim(split_part(x.words,'،',1))||'» و«'||trim(split_part(split_part(x.words,'،',2),'،',1))||'».',
   'teacherObservationRequired',true,'bookContentUnverified',true))
) AS v(ord,t,title,section,prompt,content);

UPDATE public.lessons l SET learning_objectives=jsonb_build_array(
 'أن يميّز المتعلم صوت البداية في أربع كلمات من مراجعة «'||x.title||'» بمساعدة بطاقات الحروف.',
 'أن يقرأ المتعلم كلمتين من بطاقات الوحدة ويكتب حرف البداية في إحداهما كتابة صحيحة.',
 'أن يتعاون المتعلم مع زميله ويتبادل الأدوار باحترام خلال لعبة البطاقات.'
),updated_at=now()
FROM bh_g1_three_units x WHERE l.id=x.lesson_id;

DO $verify$
DECLARE n integer; ids integer; bad integer; ok integer;
BEGIN
 SELECT count(*),count(DISTINCT a.lesson_id),count(*) FILTER(WHERE a.points<>0 OR a.answer<>'{}'::jsonb OR a.is_required OR NOT a.is_published)
 INTO n,ids,bad FROM public.lesson_activities a
 WHERE a.content->>'origin'='DADYOOM_BH_G1_THREE_UNIT_REVIEWS_15_20261031';
 IF n<>15 OR ids<>3 OR bad<>0 THEN RAISE EXCEPTION 'Rollback 15 activities check: %, %, %',n,ids,bad; END IF;
 SELECT count(*) INTO ok FROM bh_g1_three_units x JOIN public.lessons l ON l.id=x.lesson_id
 WHERE l.learning_objectives->>0 LIKE '%'||x.title||'%'
 AND (SELECT count(*) FILTER(WHERE is_published) FROM lesson_activities a WHERE a.lesson_id=l.id)=6;
 IF ok<>3 THEN RAISE EXCEPTION 'Rollback unit objectives/activity count: %',ok; END IF;
END $verify$;
COMMIT;
