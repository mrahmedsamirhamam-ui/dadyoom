-- Dadyoom | 2026-10-31 | Bahrain G3 six original reading segments.
-- Original authored content for الأصدقاء الأربعة، الأمانة، الولع بالرسم (parts 1/2).
-- Three teacher-observed supplementary practices per existing lesson; no answer keys.
-- The official textbook stories and their edition have NOT been independently approved.

BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';

CREATE TEMP TABLE bh_g3_six_original_texts ON COMMIT DROP AS
WITH ac AS (
 SELECT lesson_id,count(*) FILTER (WHERE is_published) n,count(*) all_n
 FROM public.lesson_activities GROUP BY lesson_id)
SELECT l.id lesson_id,l.title,
 btrim(split_part(split_part(l.content,'النص التدريبي الأصلي:',2),E'\n\n',1)) original_passage
FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula cu ON cu.id=g.curriculum_id
JOIN public.countries c ON c.id=cu.country_id
JOIN ac ON ac.lesson_id=l.id
WHERE c.code='BH' AND g.grade_number=3 AND l.status='published'
 AND l.id IN (
  'c76caccf-b10c-4e96-830e-eac297305ee1'::uuid,
  '4509390f-419a-4944-8c52-c0fa6e0d9478'::uuid,
  'acaaaeb9-3feb-4936-9117-6e58719d189d'::uuid,
  '55cae677-e109-444d-a2f3-ad7e3bffc4c3'::uuid,
  '71c3fd3a-73c3-4fb6-8ccb-376f7e8d1c48'::uuid,
  '14d27121-7ec1-40d5-b705-d65271c89b0a'::uuid)
 AND l.content LIKE '%النص التدريبي الأصلي:%'
 AND ac.n=3 AND ac.all_n=3
 AND NOT EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
 AND NOT EXISTS(SELECT 1 FROM public.question_attempts qa JOIN public.questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id)
 AND NOT EXISTS(SELECT 1 FROM public.lesson_activity_attempts aa JOIN public.lesson_activities a ON a.id=aa.activity_id WHERE a.lesson_id=l.id);

DO $pre$
DECLARE n int; b int;
BEGIN
 SELECT count(*) INTO n FROM bh_g3_six_original_texts;
 IF n<>6 THEN RAISE EXCEPTION 'Expected six BH G3 original lesson segments, got %',n; END IF;
 SELECT count(*) INTO b FROM bh_g3_six_original_texts
 WHERE length(original_passage)<170 OR length(original_passage)>850
 OR original_passage NOT LIKE '%.';
 IF b<>0 THEN RAISE EXCEPTION 'Original source paragraph mismatch on % records',b; END IF;
END $pre$;

INSERT INTO public.lesson_activities
(lesson_id,title,activity_type,instructions,content,activity_order,
 points,is_published,section,prompt,answer,is_required)
SELECT s.lesson_id,v.title,v.type,
 'نشاط أصلي اختياري للتقويم التكويني. يلاحظ المعلم الدليل والتعبير؛ إتمام النشاط لا يمنح درجة أكاديمية.',
 v.public_content,v.ord,0,true,v.section,v.prompt,'{}'::jsonb,false
FROM bh_g3_six_original_texts s
CROSS JOIN LATERAL (VALUES
 (4,'listening','أستمع وأستخلص دليلاً','الاستماع',
 'استمع إلى فقرة ضاديوم الأصلية في «'||s.title||'»، ثم اذكر الفكرة الرئيسة ودليلًا من تصرف شخصية.',
 jsonb_build_object(
   'origin','DADYOOM_BH_G3_SIX_ORIGINAL_READING_18_20261031',
   'requiresTeacherRead',true,'text',s.original_passage,
   'listeningQuestion','ما موقف إحدى الشخصيات؟ أي عبارة مسموعة تدل عليه؟',
   'bookContentUnverified',true)),
 (5,'speaking','أعلّل اختياري في حوار','التحدث',
 'اختر موقفًا من نص ضاديوم الأصلي «'||s.title||'». اشرحه لزميلك في جملتين، واذكر سببًا أو دليلًا يقنعه.',
 jsonb_build_object(
   'origin','DADYOOM_BH_G3_SIX_ORIGINAL_READING_18_20261031',
   'sourceContext',s.original_passage,'teacherObservationRequired',true,
   'differentiation','الإشارة أو الجملة الواحدة للدعم؛ جملتان ودليل للمستوى الأساسي؛ بديل معقول وتبرير للتحدي.',
   'bookContentUnverified',true)),
 (6,'writing','أكتب الفكرة والشاهد','الكتابة',
 'اكتب فقرة قصيرة من جملتين عن «'||s.title||'»: الأولى للفكرة، والثانية لشاهد واضح من نص ضاديوم الأصلي. راجع الترقيم مع معلمك.',
 jsonb_build_object(
   'origin','DADYOOM_BH_G3_SIX_ORIGINAL_READING_18_20261031',
   'originalText',s.original_passage,'letter','ا',
   'teacherFeedbackRequired',true,
   'bookContentUnverified',true))
) AS v(ord,type,title,section,prompt,public_content);

DO $post$
DECLARE n int; ids int; b int; six int;
BEGIN
 SELECT count(*),count(DISTINCT lesson_id),
 count(*) FILTER (WHERE points<>0 OR answer<>'{}'::jsonb OR is_required OR NOT is_published)
 INTO n,ids,b FROM public.lesson_activities
 WHERE content->>'origin'='DADYOOM_BH_G3_SIX_ORIGINAL_READING_18_20261031';
 IF n<>18 OR ids<>6 OR b<>0 THEN RAISE EXCEPTION 'Atomic rollback G3 source exercise validation: % / % / %',n,ids,b; END IF;
 SELECT count(*) INTO six FROM bh_g3_six_original_texts s WHERE
 (SELECT count(*) FILTER (WHERE is_published) FROM public.lesson_activities a WHERE a.lesson_id=s.lesson_id)=6;
 IF six<>6 THEN RAISE EXCEPTION 'Atomic rollback G3 source count mismatch %',six; END IF;
END $post$;
COMMIT;
