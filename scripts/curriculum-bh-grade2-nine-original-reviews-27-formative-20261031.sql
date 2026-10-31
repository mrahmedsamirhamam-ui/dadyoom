-- Dadyoom: 9 original Bahrain grade-2 assessment reviews, 3 existing activities.
-- Add 3 per lesson, sourced from actual original single-paragraph exercises, no answers.
-- The named ministry-linked unit/topic does not mean official textbook coverage is verified.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
CREATE TEMP TABLE bh_g2_nine_review ON COMMIT DROP AS
WITH ac AS(SELECT lesson_id,count(*) FILTER(WHERE is_published) n,count(*) total FROM public.lesson_activities GROUP BY lesson_id)
SELECT l.id lesson_id,l.title,
  trim(split_part(split_part(l.content,'عنوان التدريب:',2),E'\n\n',2)) passage,
  CASE
    WHEN l.title LIKE '%الإملاء%' THEN 'اكتب جملة قصيرة عن المدرسة أو القراءة، وراجع الهمزة وعلامة نهاية الجملة مع المعلم.'
    WHEN l.title LIKE '%التراكيب%' THEN 'كوّن جملة جديدة مرتبطة بالموضوع، وعيّن جزأيها أو فعلها وفاعلها بحسب عنوان الدرس.'
    WHEN l.title LIKE '%الحروف%' THEN 'اكتب كلمتين من درس الحروف، وحدد موضع الحرف أو نوع المد أو الحركة في كل منهما.'
    ELSE 'اكتب جملتين تلخصان ما حدث في النص الأصلي، ثم ضع خطًا تحت كلمة تدل على الحدث.'
  END writing_task
FROM public.lessons l JOIN public.units u ON l.unit_id=u.id
JOIN public.grades g ON g.id=u.grade_id JOIN public.curricula cu ON cu.id=g.curriculum_id
JOIN public.countries c ON c.id=cu.country_id JOIN ac ON ac.lesson_id=l.id
WHERE c.code='BH' AND g.grade_number=2 AND l.status='published'
 AND l.lesson_type='assessment' AND l.title LIKE 'مراجعة %'
 AND ac.n=3 AND ac.total=3
 AND l.content LIKE '%عنوان التدريب:%'
 AND NOT EXISTS(SELECT 1 FROM student_lesson_progress p WHERE p.lesson_id=l.id)
 AND NOT EXISTS(SELECT 1 FROM question_attempts qa JOIN questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id)
 AND NOT EXISTS(SELECT 1 FROM lesson_activity_attempts at JOIN lesson_activities aa ON aa.id=at.activity_id WHERE aa.lesson_id=l.id);
DO $preflight$
DECLARE n integer; bad integer;
BEGIN
 SELECT count(*) INTO n FROM bh_g2_nine_review;
 IF n<>9 THEN RAISE EXCEPTION 'Expected nine BH G2 original review lessons, got %',n; END IF;
 SELECT count(*) INTO bad FROM bh_g2_nine_review WHERE length(passage)<90 OR length(passage)>500;
 IF bad<>0 THEN RAISE EXCEPTION 'Cannot extract original source paragraph in % lesson(s)',bad; END IF;
END $preflight$;

INSERT INTO public.lesson_activities
 (lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required)
SELECT x.lesson_id,v.title,v.t,
 'إثراء أصلي من ضاديوم. النشاط تطبيقي اختياري بإشراف المعلم؛ لا يحسب اكتماله درجة أو إثبات إتقان.',
 v.content,v.ord,0,true,v.section,v.prompt,'{}'::jsonb,false
FROM bh_g2_nine_review x
CROSS JOIN LATERAL (VALUES
 (4,'listening','أصغي إلى الفكرة وأحدد دليلًا','الاستماع',
  'استمع إلى الفقرة الأصلية في درس «'||x.title||'» ثم اذكر معلومة واحدة وجدت لها دليلًا في النص.',
  jsonb_build_object('origin','DADYOOM_BH_G2_NINE_REVIEW_27_20261031',
    'requiresTeacherRead',true,'text',x.passage,
    'listeningQuestion','ما المعلومة أو الفكرة التي سمعتها؟ ما اللفظ الذي يدل عليها؟',
    'bookContentUnverified',true)),
 (5,'speaking','أشرح المثال لصديقي','التحدث',
  'اختر كلمة أو جملة من الفقرة الأصلية لدرس «'||x.title||'» ثم اشرح سبب اختيارك بصوت واضح لزميلك.',
  jsonb_build_object('origin','DADYOOM_BH_G2_NINE_REVIEW_27_20261031',
    'originalReference','فقرة ضاديوم الأصلية: '||x.passage,
    'teacherObservationRequired',true,'bookContentUnverified',true)),
 (6,'writing','أكتب ثم أراجع بنفسي','الكتابة',x.writing_task,
  jsonb_build_object('origin','DADYOOM_BH_G2_NINE_REVIEW_27_20261031',
    'originalText',x.passage,'writingTask',x.writing_task,
    'letter',CASE WHEN x.title LIKE '%الإملاء%' THEN 'إ' ELSE 'ب' END,
    'teacherFeedbackRequired',true,'bookContentUnverified',true))
) AS v(ord,t,title,section,prompt,content);

DO $verify$
DECLARE n integer; ids integer; bad integer; six integer;
BEGIN
 SELECT count(*),count(DISTINCT lesson_id),count(*) FILTER(WHERE points<>0 OR answer<>'{}'::jsonb OR is_required OR NOT is_published)
 INTO n,ids,bad FROM lesson_activities WHERE content->>'origin'='DADYOOM_BH_G2_NINE_REVIEW_27_20261031';
 IF n<>27 OR ids<>9 OR bad<>0 THEN RAISE EXCEPTION 'Rollback bad 27/9/0 counts: %/%/%',n,ids,bad; END IF;
 SELECT count(*) INTO six FROM bh_g2_nine_review x WHERE
 (SELECT count(*) FILTER(WHERE is_published) FROM lesson_activities a WHERE a.lesson_id=x.lesson_id)=6;
 IF six<>9 THEN RAISE EXCEPTION 'Rollback missing six activities for % review lessons',9-six; END IF;
END $verify$;
COMMIT;
