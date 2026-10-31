-- Dadyoom BH G1 semester-one original enrichment worksheets (20 titles).
-- These titles originate from an OCR-derived *index*, NOT independently verified book pages.
-- Existing original Dadyoom text includes a word-list, a specific application, an exit question.
-- Add five teacher-led formative activities per existing MCQ and refine age-appropriate objectives.
-- Never claim source matches Ministry sheet images/text; keep source review flagged.
-- No existing learner attempts; protected by preflight. This changes live published enrichment only.

BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';

CREATE TEMP TABLE bh_g1_20_worksheet_sources ON COMMIT DROP AS
WITH cnt AS(
 SELECT lesson_id,count(*) FILTER(WHERE is_published) live_n,count(*) all_n
 FROM public.lesson_activities GROUP BY lesson_id
)
SELECT l.id lesson_id,l.title,l.content,
 btrim(split_part(split_part(l.content,'الكلمات «',2),'»',1)) word_cards,
 btrim(split_part(split_part(l.content,'أفهم وأطبق:',2),E'\n',1)) practical_task,
 btrim(split_part(split_part(l.content,'تقويم ختامي:',2),E'\n',1)) exit_question
FROM public.lessons l JOIN public.units u ON l.unit_id=u.id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula cu ON cu.id=g.curriculum_id
JOIN public.countries c ON c.id=cu.country_id
JOIN cnt ON cnt.lesson_id=l.id
WHERE c.code='BH' AND g.grade_number=1 AND l.status='published'
 AND l.semester=1 AND l.lesson_type='assessment'
 AND cnt.live_n=1 AND cnt.all_n=1
 AND l.content LIKE '%تنبيه تحرير ضاديوم:%'
 AND l.content LIKE '%الكلمات «%'
 AND l.content LIKE '%أستعد:%'
 AND l.content LIKE '%أفهم وأطبق:%'
 AND l.content LIKE '%تقويم ختامي:%'
 AND NOT EXISTS(SELECT 1 FROM student_lesson_progress p WHERE p.lesson_id=l.id)
 AND NOT EXISTS(SELECT 1 FROM question_attempts qa JOIN questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id)
 AND NOT EXISTS(SELECT 1 FROM lesson_activity_attempts aa JOIN lesson_activities a ON a.id=aa.activity_id WHERE a.lesson_id=l.id);

DO $before$
DECLARE n integer; invalid integer;
BEGIN
 SELECT count(*) INTO n FROM bh_g1_20_worksheet_sources;
 IF n<>20 THEN RAISE EXCEPTION 'Expected exactly 20 original BH G1 worksheets, got %',n; END IF;
 SELECT count(*) INTO invalid FROM bh_g1_20_worksheet_sources
 WHERE length(word_cards)<12 OR length(practical_task)<20 OR length(exit_question)<12
 OR length(content)<850 OR title IS NULL
 OR word_cards NOT LIKE '%،%' AND word_cards NOT LIKE '%؛%';
 IF invalid<>0 THEN RAISE EXCEPTION 'Bad specific original source anchors for % worksheet(s)',invalid; END IF;
END $before$;

INSERT INTO public.lesson_activities
 (lesson_id,title,activity_type,instructions,content,activity_order,
  points,is_published,section,prompt,answer,is_required)
SELECT s.lesson_id,v.task_title,v.task_type,
 'تدريبات ضاديوم الإثرائية الأصلية المبنية على موضوع العنوان، لا تُنسب إلى الورقة الوزارية؛ يلاحظ المعلم الفهم دون منح درجة إتقان بمجرد الإتمام.',
 v.task_content,v.ord,0,true,v.section,v.task_prompt,'{}'::jsonb,false
FROM bh_g1_20_worksheet_sources s
CROSS JOIN LATERAL (VALUES
(2,'listening','أسمع وأميز بطاقات الكلمات','الاستماع',
 'استمع مع المعلم إلى «'||s.word_cards||'» في نشاط «'||s.title||'». أشر إلى الكلمة أو الصورة التي ينطق بها.',
 jsonb_build_object('origin','DADYOOM_BH_G1_20_OCR_TITLE_ORIGINAL_PRACTICE_100_20261031',
  'requiresTeacherRead',true,'text','بطاقات ضاديوم الأصلية لدرس «'||s.title||'»: '||s.word_cards,
  'listeningQuestion','ما البطاقة التي سمعتها؟ أشر إليها أو ردد معناها.',
  'notMinistryText',true,'bookContentUnverified',true,'reviewStatus','required')),
(3,'reading','أقرأ وأربط البطاقة بالمعنى','القراءة',
 'اقرأ أو تعرف مع معلمك إلى عبارتين من بطاقات درس «'||s.title||'»: «'||s.word_cards||'». وضح معنى إحداهما بصورة أو كلمة.',
 jsonb_build_object('origin','DADYOOM_BH_G1_20_OCR_TITLE_ORIGINAL_PRACTICE_100_20261031',
  'originalText','بطاقات ضاديوم الأصلية: '||s.word_cards,
  'examples',to_jsonb(string_to_array(replace(s.word_cards,'؛','،'),'،')),
  'teacherReadSupport',true,'notMinistryText',true,'bookContentUnverified',true,'reviewStatus','required')),
(4,'speaking','أشرح المهمة العملية','التحدث',
 'نفذ مع المعلم هذه المهمة الواردة في إثراء ضاديوم: «'||s.practical_task||'». اشرح خطوة واحدة وسبب اختيارك.',
 jsonb_build_object('origin','DADYOOM_BH_G1_20_OCR_TITLE_ORIGINAL_PRACTICE_100_20261031',
  'teacherTask',s.practical_task,
  'differentiation','الدعم: أشر إلى الصورة. الأساسي: جملة توضح الخطوة. التحدي: جملتان مع تفسير الاختيار.',
  'notMinistryText',true,'bookContentUnverified',true,'reviewStatus','required')),
(5,'writing','أرسم ثم أكتب كلمة','الكتابة',
 'اختر كلمة مناسبة من «'||s.word_cards||'» في درس «'||s.title||'». ارسم معناها ثم اكتب الكلمة أو تتبع حروفها بمساعدة المعلم.',
 jsonb_build_object('origin','DADYOOM_BH_G1_20_OCR_TITLE_ORIGINAL_PRACTICE_100_20261031',
  'letter',left(btrim(split_part(replace(s.word_cards,'؛','،'),'،',1)),1),
  'examples',to_jsonb(string_to_array(replace(s.word_cards,'؛','،'),'،')),
  'supportsTracing',true,'supportsDrawing',true,'notMinistryText',true,
  'bookContentUnverified',true,'reviewStatus','required')),
(6,'reading','أراجع وأبرر','القراءة',
 'أجب عن سؤال ضاديوم الختامي لدرس «'||s.title||'»: «'||s.exit_question||'». اشرح لماذا اخترت إجابتك بكلمة أو شاهد من المهمة.',
 jsonb_build_object('origin','DADYOOM_BH_G1_20_OCR_TITLE_ORIGINAL_PRACTICE_100_20261031',
  'originalText','سؤال ضاديوم الأصلي: '||s.exit_question,
  'teacherObservationRequired',true,'notMinistryText',true,
  'bookContentUnverified',true,'reviewStatus','required'))
) AS v(ord,task_type,task_title,section,task_prompt,task_content);

UPDATE public.lessons l SET
 learning_objectives=jsonb_build_array(
   'أن يميز المتعلم عبارتين من بطاقات درس «'||s.title||'» بالاستماع والإشارة أو النطق.',
   'أن ينفذ المتعلم مهمة تطبيقية مرتبطة بالدرس ويوضح اختياره بكلمة أو جملة أو رسم.',
   'أن يتبادل المتعلم أدوار الحديث والاستماع باحترام أثناء نشاط البطاقات.'
 ),updated_at=now()
FROM bh_g1_20_worksheet_sources s WHERE l.id=s.lesson_id;

DO $after$
DECLARE n integer; distinct_n integer; bad integer; ready integer; objectives integer;
BEGIN
 SELECT count(*),count(DISTINCT lesson_id),
 count(*) FILTER(WHERE points<>0 OR answer<>'{}'::jsonb OR is_required OR NOT is_published)
 INTO n,distinct_n,bad FROM public.lesson_activities
 WHERE content->>'origin'='DADYOOM_BH_G1_20_OCR_TITLE_ORIGINAL_PRACTICE_100_20261031';
 IF n<>100 OR distinct_n<>20 OR bad<>0 THEN
 RAISE EXCEPTION 'Atomic rollback 100 optional practice inserts: % / % / %',n,distinct_n,bad;
 END IF;
 SELECT count(*) INTO ready FROM bh_g1_20_worksheet_sources s WHERE
 (SELECT count(*) FILTER(WHERE is_published) FROM public.lesson_activities a WHERE a.lesson_id=s.lesson_id)=6;
 IF ready<>20 THEN RAISE EXCEPTION 'Atomic rollback: 20 target lessons not at 6 activities, found %',ready; END IF;
 SELECT count(*) INTO objectives FROM bh_g1_20_worksheet_sources s JOIN public.lessons l ON l.id=s.lesson_id
 WHERE l.learning_objectives->>0 LIKE '%'||s.title||'%';
 IF objectives<>20 THEN RAISE EXCEPTION 'Atomic rollback: expected 20 new original source objectives, got %',objectives; END IF;
END $after$;
COMMIT;
