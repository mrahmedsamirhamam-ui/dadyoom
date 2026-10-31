-- Dadyoom BH grade 3: original source body practices, October 31 2026.
-- 4 first-recorded semester-2 texts with 2 published activities + 6 existing semester-1 texts with 3.
-- Add 4 to each of four and 3 to each of six = 34 new OPTIONAL activities.
-- Do not publish the preexisting 1 unpublished activity on any of the four sem2 lessons.
-- Never claim these source passages/poems are 2026-27 ministry textbook content.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';

CREATE TEMP TABLE dadyoom_bh_g3_ten_guarded ON COMMIT DROP AS
WITH counts AS(
 SELECT lesson_id,count(*) FILTER(WHERE is_published) live_count,count(*) all_count
 FROM public.lesson_activities GROUP BY lesson_id
)
SELECT l.id lesson_id,l.title,l.semester,counts.live_count,counts.all_count,
 btrim(split_part(split_part(l.content,
  CASE WHEN l.semester=2 THEN 'نص تعليمي أصلي داعم:'
  WHEN l.content LIKE '%نص قراءة أصلي:%' THEN 'نص قراءة أصلي:'
  ELSE 'النص التدريبي الأصلي:' END,2),E'\n\n',1)) passage
FROM public.lessons l
JOIN public.units u ON l.unit_id=u.id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula cu ON cu.id=g.curriculum_id
JOIN public.countries c ON c.id=cu.country_id
JOIN counts ON counts.lesson_id=l.id
WHERE c.code='BH' AND g.grade_number=3 AND l.status='published'
 AND (
 (l.semester=2 AND l.id IN(
 '72edeb7b-4506-4b17-902c-573e46f0a6e3'::uuid,
 'ab745f1f-3314-4210-a0f0-c44b998b9c98'::uuid,
 'aace1299-589d-4f24-9cc6-1c1849242019'::uuid,
 '0ab3e6ba-c3ea-4460-a659-70ee473a9216'::uuid)
 AND counts.live_count=2 AND counts.all_count=3
 AND l.content LIKE '%نص تعليمي أصلي داعم:%')
 OR
 (l.semester=1 AND l.id IN(
 'ef98f22d-b9ae-4a1f-9288-d9f5f81220a2'::uuid,
 '4b1a9c90-6023-4d03-a739-b7e98139a936'::uuid,
 '4bc90e75-a293-4106-9b52-3b5d72c15311'::uuid,
 '28123a61-ef4f-457b-a848-c0b6f9a63517'::uuid,
 '3a754fd2-c6d1-4e81-ae69-95c9abf8c3de'::uuid,
 '9954bcf1-2b6b-4e3d-8bd8-ad60e966f1f1'::uuid)
 AND counts.live_count=3 AND counts.all_count=3
 AND (l.content LIKE '%نص قراءة أصلي:%' OR l.content LIKE '%النص التدريبي الأصلي:%'))
 )
 AND NOT EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
 AND NOT EXISTS(SELECT 1 FROM public.question_attempts qa JOIN public.questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id)
 AND NOT EXISTS(SELECT 1 FROM public.lesson_activity_attempts aa JOIN public.lesson_activities a ON a.id=aa.activity_id WHERE a.lesson_id=l.id);

DO $preflight$
DECLARE n integer; g1 integer; g2 integer; errors integer;
BEGIN
 SELECT count(*),count(*) FILTER(WHERE semester=1),count(*) FILTER(WHERE semester=2)
 INTO n,g1,g2 FROM dadyoom_bh_g3_ten_guarded;
 IF n<>10 OR g1<>6 OR g2<>4 THEN
 RAISE EXCEPTION 'Expected 10 grade3 lessons (6 T1+4 T2); got % (T1 %,T2 %)',n,g1,g2;
 END IF;
 SELECT count(*) INTO errors FROM dadyoom_bh_g3_ten_guarded
 WHERE length(passage)<150 OR length(passage)>700
 OR title IS NULL OR passage NOT LIKE '% %';
 IF errors<>0 THEN RAISE EXCEPTION 'Unsafe source text anchor for % lesson(s)',errors; END IF;
END $preflight$;

-- Every lesson gets listening, oral evidence and teacher-reviewed writing.
-- Semester 2 receives a fourth source reading task, semester 1 already has 3 prior exercises.
INSERT INTO public.lesson_activities
(lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required)
SELECT t.lesson_id,v.task_title,v.task_kind,
 'تدريب تكويني أصلي مستقل؛ يقرأ المعلم النص عند الحاجة ويراجع الفهم. الإتمام مشاركة لا إتقان آلي، والنص ليس نص الوزارة.',
 v.public_data,v.ord,0,true,v.section,v.task_prompt,'{}'::jsonb,false
FROM dadyoom_bh_g3_ten_guarded t
CROSS JOIN LATERAL (VALUES
 (4,'listening','أستمع وأحدد الدليل','الاستماع',
  'استمع إلى النص الأصلي من ضاديوم لدرس «'||t.title||'». ما الحدث أو الموقف الذي سمعته؟ استشهد بعبارة من النص.',
  jsonb_build_object('origin','DADYOOM_BH_G3_TEN_SOURCE_BASED_34_20261031',
    'text',t.passage,'requiresTeacherRead',true,
    'listeningQuestion','ما الفكرة؟ ما دليل واحد من الكلام المسموع؟',
    'bookContentUnverified',true)),
 (5,'speaking','أناقش موقفًا بدليل','التحدث',
  'اختر تصرفًا أو فكرة من النص الأصلي المرتبط بدرس «'||t.title||'»، وقدّم رأيك لزميلك مع دليل نصي وسبب.',
  jsonb_build_object('origin','DADYOOM_BH_G3_TEN_SOURCE_BASED_34_20261031',
    'sourceContext',t.passage,'teacherObservationRequired',true,
    'differentiation','مبتدئ: كلمة ودليل بمساعدة. متوسط: جملة وشاهد. متمكن: رأي وشاهد وبديل معقول.',
    'bookContentUnverified',true)),
 (6,'writing','أكتب فكرة وشاهدًا','الكتابة',
  'اكتب جملتين عن درس «'||t.title||'»: فكرة من النص الأصلي في الأولى، وشاهدًا يدعمها في الثانية. اطلب مراجعة المعلم.',
  jsonb_build_object('origin','DADYOOM_BH_G3_TEN_SOURCE_BASED_34_20261031',
    'originalText',t.passage,'letter','ا','teacherFeedbackRequired',true,
    'bookContentUnverified',true)),
 (7,'reading','أقارن بين القول والفعل','القراءة',
  'اقرأ نص ضاديوم الداعم لدرس «'||t.title||'» ثم حدد قولًا أو فعلًا مهمًا وفسر أثره في معنى القطعة.',
  jsonb_build_object('origin','DADYOOM_BH_G3_TEN_SOURCE_BASED_34_20261031',
    'originalText',t.passage,'requiresTeacherRead',false,
    'bookContentUnverified',true))
) AS v(ord,task_kind,task_title,section,task_prompt,public_data)
WHERE t.semester=2 OR v.ord<7;

-- For the four previously unscheduled semester-2 lessons, replace generic objectives,
-- keeping their source editorial warnings and all the prior published/unpublished activities.
UPDATE public.lessons l SET
 learning_objectives=jsonb_build_array(
   'أن يحدد المتعلم الفكرة الرئيسة في نص ضاديوم الداعم لدرس «'||t.title||'» مع شاهد واحد.',
   'أن يعبر المتعلم عن موقف النص شفهيًا ويكتب جملتين تستندان إلى تفاصيله.',
   'أن يصغي المتعلم إلى زملائه ويشارك باحترام عند مناقشة أفكار النص.'
 ),
 updated_at=now()
FROM dadyoom_bh_g3_ten_guarded t
WHERE l.id=t.lesson_id AND t.semester=2;

DO $verify$
DECLARE n int; ids int; errors int; six int; pub_sem2 int; old_sem2 int;
BEGIN
 SELECT count(*),count(DISTINCT lesson_id),
 count(*) FILTER(WHERE points<>0 OR answer<>'{}'::jsonb OR is_required OR NOT is_published)
 INTO n,ids,errors
 FROM public.lesson_activities
 WHERE content->>'origin'='DADYOOM_BH_G3_TEN_SOURCE_BASED_34_20261031';
 IF n<>34 OR ids<>10 OR errors<>0 THEN
 RAISE EXCEPTION 'Rollback 34 safe activity rows / 10 lessons, got rows %, lessons %, bad %',n,ids,errors;
 END IF;
 SELECT count(*) INTO six FROM dadyoom_bh_g3_ten_guarded t
 WHERE (SELECT count(*) FILTER(WHERE a.is_published) FROM public.lesson_activities a WHERE a.lesson_id=t.lesson_id)=6;
 IF six<>10 THEN RAISE EXCEPTION 'Rollback: % of 10 have exactly six published activities',six; END IF;
 SELECT count(*) INTO pub_sem2 FROM dadyoom_bh_g3_ten_guarded t
 JOIN public.lessons l ON l.id=t.lesson_id
 WHERE t.semester=2 AND l.learning_objectives->>0 LIKE '%'||t.title||'%';
 SELECT count(*) INTO old_sem2 FROM dadyoom_bh_g3_ten_guarded t
 JOIN public.lesson_activities a ON a.lesson_id=t.lesson_id
 WHERE t.semester=2 AND NOT a.is_published;
 IF pub_sem2<>4 OR old_sem2<>4 THEN
 RAISE EXCEPTION 'Rollback: semester2 objective changes % or preserved draft tasks % differ from 4',pub_sem2,old_sem2;
 END IF;
END $verify$;
COMMIT;
