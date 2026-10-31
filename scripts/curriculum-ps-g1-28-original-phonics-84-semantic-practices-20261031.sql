-- PS Palestine grade 1: 28 authentic Dadyoom original Arabic letter lessons.
-- Each already has 3 source-grounded, teacher-completion-only listening / reading / letter-writing tasks.
-- This adds 3 distinct semantic tasks: explain target vocabulary orally, identify target letter
-- in the ORIGINAL authored reading passage, and write a NEW short sentence/draw a word.
-- Does not copy/claim a Palestinian Ministry 2026/27 text; does not auto-grade or alter history.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
CREATE TEMP TABLE ps_grade1_28_phonics ON COMMIT DROP AS
WITH cnt AS (
 SELECT lesson_id,count(*) FILTER(WHERE is_published) published_n,count(*) all_n
 FROM public.lesson_activities GROUP BY lesson_id
)
SELECT l.id lesson_id,l.title,l.vocabulary AS vocab,
 r.content->>'originalText' AS authored_passage,
 w.content->>'letter' AS target_letter,
 l.vocabulary->0->>'word' AS word1,
 l.vocabulary->1->>'word' AS word2,
 l.vocabulary->2->>'word' AS word3,
 l.vocabulary->0->>'meaning' AS meaning1,
 l.vocabulary->1->>'meaning' AS meaning2
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula cu ON cu.id=g.curriculum_id
JOIN public.countries c ON c.id=cu.country_id
JOIN cnt ON cnt.lesson_id=l.id
JOIN public.lesson_activities r ON r.lesson_id=l.id AND r.activity_type='reading' AND r.is_published
  AND r.content->>'origin'='DADYOOM_PS_G123_57_ORIGINAL_FORMATIVE_20261031'
JOIN public.lesson_activities w ON w.lesson_id=l.id AND w.activity_type='writing' AND w.is_published
  AND w.content->>'origin'='DADYOOM_PS_G123_57_ORIGINAL_FORMATIVE_20261031'
WHERE c.code='PS' AND g.grade_number=1 AND l.status='published'
 AND l.title LIKE 'حرف %' AND l.lesson_type='reading'
 AND cnt.published_n=3 AND cnt.all_n=3
 AND jsonb_typeof(l.vocabulary)='array' AND jsonb_array_length(l.vocabulary)>=3
 AND NOT EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
 AND NOT EXISTS(SELECT 1 FROM public.question_attempts qa JOIN public.questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id)
 AND NOT EXISTS(SELECT 1 FROM public.lesson_activity_attempts a JOIN public.lesson_activities aa ON aa.id=a.activity_id WHERE aa.lesson_id=l.id);

DO $pre$
DECLARE n integer; problems integer;
BEGIN
 SELECT count(*),count(DISTINCT lesson_id) INTO n,problems FROM ps_grade1_28_phonics;
 IF n<>28 OR problems<>28 THEN RAISE EXCEPTION 'Expected 28 distinct untouched Palestinian phonics lessons, got % and %',n,problems; END IF;
 SELECT count(*) INTO problems FROM ps_grade1_28_phonics
 WHERE length(btrim(authored_passage))<35 OR length(btrim(authored_passage))>650
 OR length(target_letter)<>1
 OR length(btrim(word1))<2 OR length(btrim(word2))<2 OR length(btrim(word3))<2
 OR length(btrim(meaning1))<4 OR length(btrim(meaning2))<4
 OR position(target_letter in authored_passage)=0;
 IF problems<>0 THEN RAISE EXCEPTION '28-original-lesson passage, word meaning or target letter inconsistency in %',problems; END IF;
END $pre$;

INSERT INTO public.lesson_activities
(lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required)
SELECT s.lesson_id,t.title,t.activity_type,
 'تدريب تكويني أصلي مكمّل للدرس. يساند المعلم الطفل ولا يُحسب الإتمام وحده درجة إتقان؛ لا يدعي نقل الكتاب الرسمي.',
 t.public_content,t.ord,0,true,t.section,t.prompt,'{}'::jsonb,false
FROM ps_grade1_28_phonics s
CROSS JOIN LATERAL (VALUES
(4,'speaking','أشرح معنى كلمتين وأمثلهما','التحدث',
 'اختر كلمتي «'||s.word1||'» و«'||s.word2||'» في درس «'||s.title||'». اشرح معنى إحداهما بكلماتك، وقل جملة قصيرة باستخدامها. يمكن الاكتفاء بصورة والإشارة مع دعم المعلم.',
 jsonb_build_object('origin','DADYOOM_PS_G1_28_PHONICS_MEANING_CONTEXT_84_20261031',
  'examples',jsonb_build_array(s.word1,s.word2),
  'teacherVocabulary',jsonb_build_object(s.word1,s.meaning1,s.word2,s.meaning2),
  'teacherObservationRequired',true,'bookContentUnverified',true,
  'differentiation','دعم: صورة وكلمة واحدة؛ متوسط: كلمة وجملة؛ متقدم: مقارنة المعنى بجملة أخرى.')),
(5,'reading','أبحث عن حرفي داخل الجملة','القراءة',
 'عد إلى نص ضاديوم الأصلي المرتبط بدرس «'||s.title||'». ابحث عن حرف «'||s.target_letter||'» في كلمة من الجملة، وأشر إلى موضعه ثم اقرأ الكلمة مع المعلم.',
 jsonb_build_object('origin','DADYOOM_PS_G1_28_PHONICS_MEANING_CONTEXT_84_20261031',
  'originalText',btrim(s.authored_passage),
  'targetLetter',s.target_letter,'examples',jsonb_build_array(s.word1,s.word2),
  'teacherReadSupport',true,'bookContentUnverified',true)),
(6,'writing','أبتكر جملة جديدة وأرسم معناها','الكتابة',
 'استعمل كلمة «'||s.word3||'» في جملة قصيرة من إنشائك، ثم تتبع حرف «'||s.target_letter||'» وارسم معنى الكلمة. يصحح المعلم الكتابة بحسب المستوى.',
 jsonb_build_object('origin','DADYOOM_PS_G1_28_PHONICS_MEANING_CONTEXT_84_20261031',
  'letter',s.target_letter,'examples',jsonb_build_array(s.word1,s.word2,s.word3),
  'supportsTracing',true,'supportsDrawing',true,'teacherFeedbackRequired',true,
  'bookContentUnverified',true))
) AS t(ord,activity_type,title,section,prompt,public_content);

DO $post$
DECLARE n integer; lessons integer; invalid integer; six integer;
BEGIN
 SELECT count(*),count(DISTINCT lesson_id),
 count(*) FILTER(WHERE answer<>'{}'::jsonb OR points<>0 OR is_required OR NOT is_published)
 INTO n,lessons,invalid FROM public.lesson_activities
 WHERE content->>'origin'='DADYOOM_PS_G1_28_PHONICS_MEANING_CONTEXT_84_20261031';
 IF n<>84 OR lessons<>28 OR invalid<>0 THEN
 RAISE EXCEPTION 'Rollback: 84 optional activities in 28 source lessons expected, got %/%/invalid %',n,lessons,invalid;
 END IF;
 SELECT count(*) INTO six FROM ps_grade1_28_phonics s
 WHERE (SELECT count(*) FILTER(WHERE a.is_published) FROM public.lesson_activities a WHERE a.lesson_id=s.lesson_id)=6;
 IF six<>28 THEN RAISE EXCEPTION 'Rollback: 28 phonics modules not all at six published activities: %',six; END IF;
END $post$;
COMMIT;
