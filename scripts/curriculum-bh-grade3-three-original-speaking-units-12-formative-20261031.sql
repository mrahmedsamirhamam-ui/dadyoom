-- Dadyoom Bahrain grade 3 / three original speaking units: 4 new activities each.
-- No publisher material, zero secret answers, no automatic academic mastery.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
CREATE TEMP TABLE bh_g3_three_speaking ON COMMIT DROP AS
WITH ac AS(SELECT lesson_id,count(*) FILTER(WHERE is_published) n,count(*) total FROM public.lesson_activities GROUP BY lesson_id)
SELECT l.id lesson_id,l.title,
  trim(split_part(split_part(l.content,'النص التعليمي الأصلي من ضاديوم:',2),E'\n\n',1)) passage,
  trim(split_part(split_part(l.content,'مفردات مستهدفة:',2),'.',1)) terms,
  l.learning_objectives previous_objectives
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula cu ON cu.id=g.curriculum_id JOIN public.countries c ON c.id=cu.country_id
JOIN ac ON ac.lesson_id=l.id
WHERE c.code='BH' AND g.grade_number=3 AND l.status='published'
  AND l.lesson_type='speaking' AND l.title LIKE 'التحدث — الوحدة%'
  AND ac.n=2 AND ac.total=2
  AND l.content LIKE '%النص التعليمي الأصلي من ضاديوم:%'
  AND l.content LIKE '%مفردات مستهدفة:%'
  AND NOT EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
  AND NOT EXISTS(SELECT 1 FROM public.question_attempts qa JOIN public.questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id)
  AND NOT EXISTS(SELECT 1 FROM public.lesson_activity_attempts at JOIN public.lesson_activities a ON a.id=at.activity_id WHERE a.lesson_id=l.id);
DO $pre$
DECLARE n integer; bad integer;
BEGIN
 SELECT count(*) INTO n FROM bh_g3_three_speaking;
 IF n<>3 THEN RAISE EXCEPTION 'Expected three first-semester BH G3 speaking modules, got %',n; END IF;
 SELECT count(*) INTO bad FROM bh_g3_three_speaking WHERE length(passage)<150 OR length(terms)<10 OR terms NOT LIKE '%،%';
 IF bad<>0 THEN RAISE EXCEPTION 'Unsafe original text extraction in % speaking modules',bad; END IF;
END $pre$;
INSERT INTO public.lesson_activities
(lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required)
SELECT src.lesson_id,v.title,v.t,
 'تدريب تكويني أصلي من ضاديوم، يُنفذ بمساندة المعلم ويقيّم ملاحظيًا؛ تسجيل الإتمام ليس إثبات إتقان.',
 v.content,v.ord,0,true,v.section,v.prompt,'{}'::jsonb,false
FROM bh_g3_three_speaking src
CROSS JOIN LATERAL (VALUES
 (3,'listening','أستمع لأفهم الموقف','الاستماع',
  'استمع إلى الموقف الأصلي المرتبط بدرس «'||src.title||'»، ثم لخص الفكرة بجملة واستدل بتفصيل مسموع.',
  jsonb_build_object('origin','DADYOOM_BH_G3_THREE_SPEAKING_12_20261031',
    'requiresTeacherRead',true,'text',src.passage,
    'listeningQuestion','ما الفكرة المركزية؟ اذكر حدثًا أو عبارة تثبتها.',
    'bookContentUnverified',true)),
 (4,'reading','أحدد الفكرة والدليل','القراءة',
  'اقرأ الموقف الأصلي «'||src.title||'» بمساعدة المعلم، ثم اختر عبارة تدل على الاحترام أو التعاون أو الشعور المناسب للموقف.',
  jsonb_build_object('origin','DADYOOM_BH_G3_THREE_SPEAKING_12_20261031',
    'originalText',src.passage,'targetTerms',src.terms,
    'bookContentUnverified',true)),
 (5,'writing','أكتب سببًا وشاهدًا','الكتابة',
  'اكتب جملتين عن موقف الدرس: اذكر الفكرة في الأولى ودليلًا من النص في الثانية، ثم راجع علامات الترقيم مع معلمك.',
  jsonb_build_object('origin','DADYOOM_BH_G3_THREE_SPEAKING_12_20261031',
    'originalText',src.passage,'letter','ا',
    'teacherFeedbackRequired',true,'bookContentUnverified',true)),
 (6,'speaking','أعيد صياغة الموقف بطريقة محترمة','التحدث',
  'كوّن حوارًا بديلًا من ثلاث جمل حول موقف «'||src.title||'». وزّع الأدوار مع زميلك واستعمل إحدى المفردات «'||src.terms||'».',
  jsonb_build_object('origin','DADYOOM_BH_G3_THREE_SPEAKING_12_20261031',
    'examples',to_jsonb(string_to_array(src.terms,'،')),
    'supportsTurnTaking',true,'teacherObservationRequired',true,
    'bookContentUnverified',true))
) AS v(ord,t,title,section,prompt,content);

UPDATE public.lessons l SET learning_objectives=jsonb_build_array(
  'أن يحدد المتعلم الفكرة الرئيسة في نص «'||src.title||'» بجملة واحدة بعد الاستماع.',
  'أن يدعم المتعلم رأيه بتفصيل واحد من النص ثم يعيد صياغة الموقف في ثلاث جمل.',
  'أن يحترم المتعلم آراء زملائه ويتبادل أدوار الحوار بإنصات وأدب.'
),updated_at=now()
FROM bh_g3_three_speaking src WHERE l.id=src.lesson_id;

DO $verify$
DECLARE n integer; ids integer; bad integer; six integer;
BEGIN
 SELECT count(*),count(DISTINCT lesson_id),count(*) FILTER(WHERE answer<>'{}'::jsonb OR points<>0 OR is_required OR NOT is_published)
 INTO n,ids,bad FROM public.lesson_activities WHERE content->>'origin'='DADYOOM_BH_G3_THREE_SPEAKING_12_20261031';
 IF n<>12 OR ids<>3 OR bad<>0 THEN RAISE EXCEPTION 'Atomic rollback for speaking tasks: % / % / %',n,ids,bad; END IF;
 SELECT count(*) INTO six FROM bh_g3_three_speaking s JOIN public.lessons l ON l.id=s.lesson_id
 WHERE l.learning_objectives->>0 LIKE '%'||s.title||'%'
 AND (SELECT count(*) FILTER(WHERE is_published) FROM lesson_activities a WHERE a.lesson_id=l.id)=6;
 IF six<>3 THEN RAISE EXCEPTION 'Atomic rollback for objective / activity mismatch in % G3 lessons',3-six; END IF;
END $verify$;
COMMIT;
