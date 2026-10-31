-- Bahrain G1 semester 2: six published placeholders that lack actual story/chant body.
-- Add newly ORIGINAL Dadyoom supplementary reading bodies (NOT 2026-27 Ministry texts)
-- and five optional contextual tasks per lesson. 6 lessons / 30 tasks.
-- Teacher editorial approval, official book matching, and live listening QA remain mandatory.
-- Preserve existing titles/IDs/questions/student progress and publication status.

BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';

CREATE TEMP TABLE bh_g1_t2_six_authored_content(
 lesson_id uuid PRIMARY KEY, title text NOT NULL, kind text NOT NULL,
 authored_body text NOT NULL
) ON COMMIT DROP;

INSERT INTO bh_g1_t2_six_authored_content(lesson_id,title,kind,authored_body)
VALUES
('b240a275-dff3-4e13-bf27-5ac23ccba783'::uuid,'أنشودة الوحدة الأولى: بحرين يا أغلى وطن','chant',$BODY$
بحرينُ يا بيتَ الأمانْ
فيكِ المودّةُ والحنانْ
أرعى الحديقةَ مع أسرتي
وأصونُ شاطئَكِ الجميلَ بكلِّ امتنانْ
$BODY$),
('0b2fadc8-2986-464e-a20f-4d80eb701464'::uuid,'أنشودة الوحدة الثالثة: في حينا حديقة','chant',$BODY$
في حيِّنا حديقةٌ جميلةْ
فيها زهورٌ وأشجارٌ ظليلةْ
نسقي النباتَ ولا نكسرُ غصنًا
فتبقى حديقتُنا نظيفةً وأصيلةْ
$BODY$),
('b1399c8a-a218-484b-b4c2-a007114d9d78'::uuid,'أنشودة الوحدة الثانية: هيا نقرأ','chant',$BODY$
هيّا نقرأْ يا أصدقاءْ
في الكتبِ معرفةٌ وضياءْ
أقرأُ سطرًا ثم أحكي
ما فهمتُهُ بكلِّ صفاءْ
$BODY$),
('86743b0e-68e5-4916-9dbc-14db16ece6e1'::uuid,'قصة الوحدة الأولى: حمدان يزور مملكة البحرين','story',$BODY$
زار حمدان مملكة البحرين مع أسرته. شاهد علم البحرين، وقال: «ما أجمل الألوان!». اصطحبته أسرته إلى متحف، فشاهد صورًا وقوارب قديمة. سأله والده: «ماذا أحببت اليوم؟». قال حمدان: «أحببت أن أعرف كيف عاش الناس وعملوا». ثم وضع ورقته في سلة المهملات؛ فهو يحب المكان النظيف. عاد حمدان مسرورًا، وروى لأخته شيئًا تعلمه في رحلته.
$BODY$),
('1438079a-19fc-4fb3-b31b-7bb1f3134ad2'::uuid,'قصة الوحدة الثالثة: كيف أحافظ على صحتي؟','story',$BODY$
استيقظت ليلى صباحًا، وغسلت يديها قبل الإفطار. شربت الماء، وأكلت فاكهة مع أسرتها. في المدرسة لعبت في الساحة وقت الاستراحة، ثم غسلت يديها قبل الطعام. قالت لها معلمتها: «العادات الصغيرة تحافظ على صحتنا». عادت ليلى إلى البيت، ورتبت حقيبتها، ونامت مبكرًا. وفي اليوم التالي أخبرت صديقتها عن عادة صحية تعلمتها.
$BODY$),
('c9e0b182-0348-4508-8780-68cd0e3e5dbc'::uuid,'قصة الوحدة الثانية: فاطمة تحب القراءة','story',$BODY$
ذهبت فاطمة إلى مكتبة المدرسة مع معلمتها. اختارت كتابًا فيه صور جميلة، وجلست تقرأ بهدوء. وجدت كلمة جديدة، فسألت المعلمة عن معناها. بعد القراءة قالت لصديقتها: «أحببت القصة لأنها علمتني التعاون». وضعت علامة ورقية عند الصفحة التي توقفت عندها، ثم أعادت الكتاب إلى مكانه. في البيت رسمت فاطمة مشهدًا من قصتها، وروته لأسرتها بكلماتها.
$BODY$);

DO $scope$
DECLARE n int; b int;
BEGIN
 SELECT count(*) INTO n FROM bh_g1_t2_six_authored_content;
 IF n<>6 THEN RAISE EXCEPTION 'Expected six original texts got %',n; END IF;
 SELECT count(*) INTO b
 FROM bh_g1_t2_six_authored_content s
 LEFT JOIN public.lessons l ON l.id=s.lesson_id
 LEFT JOIN public.units u ON u.id=l.unit_id
 LEFT JOIN public.grades g ON g.id=u.grade_id
 LEFT JOIN public.curricula cu ON cu.id=g.curriculum_id
 LEFT JOIN public.countries c ON c.id=cu.country_id
 WHERE c.code IS DISTINCT FROM 'BH' OR g.grade_number IS DISTINCT FROM 1
   OR l.semester IS DISTINCT FROM 2 OR l.status IS DISTINCT FROM 'published'
   OR l.title IS DISTINCT FROM s.title
   OR (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=l.id)<>1
   OR s.kind NOT IN('chant','story')
   OR length(s.authored_body)<70 OR length(s.authored_body)>700
   OR l.content LIKE '%نص إثراء مستقل جديد من ضاديوم%'
   OR EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
   OR EXISTS(SELECT 1 FROM public.question_attempts qa JOIN public.questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id)
   OR EXISTS(SELECT 1 FROM public.lesson_activity_attempts aa JOIN public.lesson_activities a ON a.id=aa.activity_id WHERE a.lesson_id=l.id);
 IF b<>0 THEN RAISE EXCEPTION 'Scope/duplication/student-history failed for % lesson(s)',b; END IF;
END $scope$;

UPDATE public.lessons l
SET content=l.content||E'\n\n'||'نص إثراء مستقل جديد من ضاديوم (من تأليف ضاديوم، وليس نص القصة أو الأنشودة في كتاب الوزارة، ولم يعتمد بعد من المعلم):'||E'\n\n'||
 btrim(s.authored_body)||E'\n\n'||
 'فهم النص الأصلي: استمع إلى النص من المعلم، ثم سمِّ الشخصية أو الكلمة المهمة، واستشهد بعبارة أو سلوك منه. لا تنسب أحداث هذه المادة المستقلة إلى الكتاب المدرسي. المستوى الداعم: إشارة أو كلمة؛ الأساسي: جملة ودليل؛ المتقدم: فكرتان مع تبرير. يراجع المعلم التعبير والقراءة؛ لا يمنح الإتمام وحده درجة إتقان.',
 learning_objectives=jsonb_build_array(
  'أن يقرأ المتعلم جملة أو سطرًا من النص الأصلي الجديد في «'||s.title||'» بدعم مناسب.',
  'أن يذكر المتعلم فكرة أو سلوكًا من النص ويستدل بكلمة أو عبارة تدعمه.',
  'أن يحترم المتعلم دور زملائه في القراءة والمشاركة ويصغي دون مقاطعة.'
 ),
 updated_at=now()
FROM bh_g1_t2_six_authored_content s WHERE l.id=s.lesson_id;

INSERT INTO public.lesson_activities
(lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required)
SELECT s.lesson_id,v.title,v.activity_type,
 'تدريب من نص ضاديوم الأصلي المستقل؛ بإشراف المعلم. لا يعادل نص وزارة التربية ولا يثبت الحفظ الرسمي أو الإتقان الآلي.',
 v.public_content,v.ord,0,true,v.section,v.prompt,'{}'::jsonb,false
FROM bh_g1_t2_six_authored_content s
CROSS JOIN LATERAL (VALUES
 (2,'listening','أستمع للنص المستقل','الاستماع',
  'استمع إلى '||CASE WHEN s.kind='chant' THEN 'أبيات الأنشودة' ELSE 'القصة' END||' الأصلية من ضاديوم في «'||s.title||'». ما الكلمة أو السلوك الذي تذكرته؟',
  jsonb_build_object('origin','DADYOOM_BH_G1_T2_SIX_ORIGINAL_BODIES_30_20261031',
  'requiresTeacherRead',true,'text',btrim(s.authored_body),
  'listeningQuestion','ما الفكرة أو الكلمة التي سمعتها؟ اذكر شاهدًا بسيطًا.',
  'sourceKind','independent Dadyoom authored enrichment','bookContentUnverified',true)),
 (3,'reading','أقرأ وأجد دليلًا','القراءة',
  'اقرأ من النص الأصلي المستقل «'||s.title||'» جملة مع معلمك، ثم أشر إلى كلمة تدل على المكان أو العمل أو القيمة.',
  jsonb_build_object('origin','DADYOOM_BH_G1_T2_SIX_ORIGINAL_BODIES_30_20261031',
  'originalText',btrim(s.authored_body),'teacherReadSupport',true,'bookContentUnverified',true)),
 (4,'speaking','أحكي ما فهمت','التحدث',
  'احكِ لزميلك فكرة واحدة من نص «'||s.title||'» في جملتين. يمكن الاستعانة بصورة أو كلمة من النص.',
  jsonb_build_object('origin','DADYOOM_BH_G1_T2_SIX_ORIGINAL_BODIES_30_20261031',
  'sourceContext',btrim(s.authored_body),'teacherObservationRequired',true,'bookContentUnverified',true)),
 (5,'writing','أكتب كلمة وأرسم معناها','الكتابة',
  'اختر كلمة من النص الأصلي في «'||s.title||'»، اكتبها أو تتبع حروفها وارسم معناها. يراجع المعلم عملك.',
  jsonb_build_object('origin','DADYOOM_BH_G1_T2_SIX_ORIGINAL_BODIES_30_20261031',
  'originalReference',btrim(s.authored_body),'letter','ا','supportsDrawing',true,
  'bookContentUnverified',true)),
 (6,'reading','أقارن وأستنتج','القراءة',
  CASE WHEN s.kind='chant'
  THEN 'اختر سطرين من أنشودة ضاديوم الأصلية «'||s.title||'». ما القيمة المشتركة؟ أي كلمة دلت عليها؟'
  ELSE 'اختر حدثين من قصة ضاديوم الأصلية «'||s.title||'». أيهما حدث أولًا؟ وما الدليل من السطر؟'
  END,
  jsonb_build_object('origin','DADYOOM_BH_G1_T2_SIX_ORIGINAL_BODIES_30_20261031',
  'originalText',btrim(s.authored_body),'teacherObservationRequired',true,
  'bookContentUnverified',true))
) AS v(ord,activity_type,title,section,prompt,public_content);

DO $verify$
DECLARE n int; ids int; bad int; lessons int;
BEGIN
 SELECT count(*),count(DISTINCT lesson_id),
 count(*) FILTER(WHERE answer<>'{}'::jsonb OR points<>0 OR is_required OR NOT is_published)
 INTO n,ids,bad
 FROM public.lesson_activities
 WHERE content->>'origin'='DADYOOM_BH_G1_T2_SIX_ORIGINAL_BODIES_30_20261031';
 IF n<>30 OR ids<>6 OR bad<>0 THEN
 RAISE EXCEPTION 'Atomic rollback: expected 30 optional key-free tasks in six lessons, got %/% bad %',n,ids,bad;
 END IF;
 SELECT count(*) INTO lessons FROM bh_g1_t2_six_authored_content s
 JOIN public.lessons l ON l.id=s.lesson_id
 WHERE l.content LIKE '%نص إثراء مستقل جديد من ضاديوم%'
 AND l.content LIKE '%'||btrim(s.authored_body)||'%'
 AND (SELECT count(*) FILTER(WHERE a.is_published) FROM public.lesson_activities a WHERE a.lesson_id=l.id)=6;
 IF lessons<>6 THEN RAISE EXCEPTION 'Atomic rollback: source-content/6-activity check failed on % lessons',6-lessons; END IF;
END $verify$;
COMMIT;
