-- Dadyoom | BH G1 | 3 independently authored chants + 3 phonics unit-review lessons
-- 3 original participation-only activities per lesson: +18 across 6 existing published lessons.
-- Does NOT certify current ministry textbook alignment or memorized government poem.
-- Already applied statements must not be rerun: precondition exactly 3 activities per lesson.

BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
CREATE TEMP TABLE bh_g1_six_originals ON COMMIT DROP AS
WITH ac AS(
 SELECT lesson_id,count(*) FILTER (WHERE is_published) published_n,count(*) all_n
 FROM public.lesson_activities GROUP BY lesson_id)
SELECT l.id lesson_id,l.title,l.content,l.lesson_type,
 CASE WHEN l.title LIKE 'أنشودة الوحدة:%' THEN 'chant' ELSE 'phonics' END kind,
 CASE WHEN l.title LIKE 'أنشودة الوحدة:%'
      THEN btrim(split_part(l.content,E'\n\n',2))
      ELSE btrim(split_part(split_part(l.content,'اقرأ:',2),E'\n',1))
 END AS primary_text,
 CASE WHEN l.title LIKE 'أنشودة الوحدة:%' THEN ''
      WHEN l.content LIKE '%راجع الحروف:%'
      THEN btrim(split_part(split_part(l.content,'راجع الحروف:',2),E'\n',1))
      ELSE btrim(split_part(split_part(l.content,'الحروف:',2),E'\n',1))
 END AS letter_line
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula cu ON cu.id=g.curriculum_id
JOIN public.countries c ON c.id=cu.country_id
JOIN ac ON ac.lesson_id=l.id
WHERE c.code='BH' AND g.grade_number=1 AND l.status='published'
 AND l.title IN (
 'أنشودة الوحدة: أسرتي','أنشودة الوحدة: جاري','أنشودة الوحدة: مدرستي',
 'الدرس الخامس: أعزز مكتسباتي','الدرس العاشر: أعزز مكتسباتي',
 'الدرس الخامس عشر: أعزز مكتسباتي')
 AND ac.published_n=3 AND ac.all_n=3
 AND NOT EXISTS (SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
 AND NOT EXISTS (SELECT 1 FROM public.question_attempts q JOIN public.questions x ON x.id=q.question_id WHERE x.lesson_id=l.id)
 AND NOT EXISTS (SELECT 1 FROM public.lesson_activity_attempts x JOIN public.lesson_activities a ON a.id=x.activity_id WHERE a.lesson_id=l.id);

DO $validate$
DECLARE n int; b int;
BEGIN
 SELECT count(*) INTO n FROM bh_g1_six_originals;
 IF n<>6 THEN RAISE EXCEPTION 'Scope changed; expected exactly 6 unused BH G1 originals, got %',n; END IF;
 SELECT count(*) INTO b FROM bh_g1_six_originals
 WHERE length(primary_text)<15 OR length(primary_text)>260
 OR (kind='phonics' AND (length(letter_line)<5 OR primary_text NOT LIKE '%،%'))
 OR (kind='chant' AND (primary_text NOT LIKE '%'||E'\n'||'%'));
 IF b<>0 THEN RAISE EXCEPTION 'Unsafe extraction of original authored text, affected %',b; END IF;
END $validate$;

INSERT INTO public.lesson_activities
(lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required)
SELECT x.lesson_id,v.title,v.kind,
 'تدريب تكويني اختياري مرتبط بمحتوى ضاديوم الأصلي؛ يقوّمه المعلم بالملاحظة، وإتمامه لا يثبت الإتقان.',
 v.data,v.ord,0,true,v.section,v.prompt,'{}'::jsonb,false
FROM bh_g1_six_originals x
CROSS JOIN LATERAL (
VALUES
(4,'listening','أنصت للكلمات وأميزها','الاستماع',
 CASE WHEN x.kind='chant' THEN
   'استمع إلى أبيات ضاديوم الأصلية في «'||x.title||'» مع المعلم؛ كرر كلمة تدل على قيمة جميلة واشرح معناها.'
 ELSE
   'استمع إلى الكلمات «'||x.primary_text||'»، وارفع بطاقة الحرف الذي يبدأ به المثال المنطوق.'
 END,
 jsonb_build_object('origin','DADYOOM_BH_G1_SIX_SOURCE_ANCHORED_18_20261031',
  'requiresTeacherRead',true,'text',x.primary_text,
  'listeningQuestion',CASE WHEN x.kind='chant'
  THEN 'ما الكلمة التي أحببتها؟ ما معناها في الأنشودة؟'
  ELSE 'ما صوت الحرف الأول في الكلمة التي سمعتها؟' END,
  'bookContentUnverified',true)),
(5,CASE WHEN x.kind='chant' THEN 'speaking' ELSE 'reading' END,
 CASE WHEN x.kind='chant' THEN 'أعبر عن معنى الأنشودة' ELSE 'أقرأ بطاقات الكلمات' END,
 CASE WHEN x.kind='chant' THEN 'التحدث' ELSE 'القراءة' END,
 CASE WHEN x.kind='chant'
 THEN 'اختر عبارة من أنشودة ضاديوم «'||x.title||'»، وتحدث في جملتين عن السلوك أو الشعور الذي تعلمته منها.'
 ELSE 'اقرأ كلمات المراجعة «'||x.primary_text||'» مع المعلم، وحدد الحرف الأول في كلمتين بالاستناد إلى «'||x.letter_line||'».'
 END,
 jsonb_build_object('origin','DADYOOM_BH_G1_SIX_SOURCE_ANCHORED_18_20261031',
  'originalText',x.primary_text,
  'examples',CASE WHEN x.kind='phonics' THEN to_jsonb(string_to_array(x.primary_text,'،')) ELSE jsonb_build_array() END,
  'teacherObservationRequired',true,'bookContentUnverified',true)),
(6,'writing','أكتب أو أرسم وأفسر','الكتابة',
 CASE WHEN x.kind='chant'
 THEN 'ارسم موقفًا يوضح قيمة أو شعورًا من «'||x.title||'»، ثم انسخ كلمة أو اكتب جملة قصيرة عنه بمساعدة المعلم.'
 ELSE 'اختر كلمة من «'||x.primary_text||'»، واكتب حرفها الأول على السطر ثم استخدمها شفهيًا في جملة.'
 END,
 jsonb_build_object('origin','DADYOOM_BH_G1_SIX_SOURCE_ANCHORED_18_20261031',
  'letter',CASE WHEN x.kind='phonics' THEN left(btrim(split_part(x.primary_text,'،',1)),1) ELSE 'ا' END,
  'originalReference','من عمل ضاديوم المستقل: '||x.primary_text,
  'supportsDrawing',true,'bookContentUnverified',true))
) AS v(ord,kind,title,section,prompt,data);

DO $post$
DECLARE n int; unique_ids int; bad int; six int;
BEGIN
 SELECT count(*),count(DISTINCT lesson_id),
 count(*) FILTER(WHERE points<>0 OR answer<>'{}'::jsonb OR is_required OR NOT is_published)
 INTO n,unique_ids,bad
 FROM public.lesson_activities
 WHERE content->>'origin'='DADYOOM_BH_G1_SIX_SOURCE_ANCHORED_18_20261031';
 IF n<>18 OR unique_ids<>6 OR bad<>0 THEN RAISE EXCEPTION 'Rollback: bad 18/6/0 check %/%/%',n,unique_ids,bad; END IF;
 SELECT count(*) INTO six FROM bh_g1_six_originals x WHERE
 (SELECT count(*) FILTER (WHERE is_published) FROM public.lesson_activities a WHERE a.lesson_id=x.lesson_id)=6;
 IF six<>6 THEN RAISE EXCEPTION 'Rollback: 6 published tasks absent in % lessons',6-six; END IF;
END $post$;
COMMIT;
