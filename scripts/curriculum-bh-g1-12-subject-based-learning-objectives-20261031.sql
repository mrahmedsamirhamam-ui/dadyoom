-- Align 12 actual published Bahrain G1 teaching objectives with the subject of each lesson.
-- Two short, assessable behavioral objectives (listening comprehension; phonics)
-- and one observable affective/citizenship objective. No student progress or assessment changes.
-- Execute only once, guarded by exact country/grade/title and expected prestate.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
CREATE TEMP TABLE source_objectives(
 lesson_id uuid PRIMARY KEY, exact_title text NOT NULL, target_letter text NOT NULL,
 source_story text NOT NULL, objective_affective text NOT NULL
) ON COMMIT DROP;
INSERT INTO source_objectives VALUES
('7edbc90b-db11-4a44-9639-09beb1ba430b'::uuid,'الدرس الأول: حرف (ب) (1)','ب','صباح أسرتي','أن يعبّر الطالب عن التعاون الأسري بجملة واحدة أثناء الحوار.'),
('60914ad2-b8a2-43ec-8d28-5bdbc5b6d6f4'::uuid,'الدرس الثاني: حرف (ب) (2)','ب','حقيبة بدر','أن يلتزم الطالب بالإنصات لزميله خلال تبادل الحديث عن التنظيم.'),
('f3acba28-bd07-4127-8900-775a3deaa895'::uuid,'الدرس الثالث: حرف (م)','م','زيارة العم جابر','أن يعبّر الطالب عن احترام الأقارب بجملة مناسبة بعد الاستماع.'),
('0f24e423-0fcb-4101-a278-f29d36076a07'::uuid,'الدرس الرابع: حرف (د)','د','لوحة دانية','أن يشارك الطالب بعبارة مشجعة لزميله أثناء الحديث عن التعاون.'),
('c6a7628c-b04c-4af9-aa33-9e44e3b89854'::uuid,'الدرس السادس: حرف (ح)','ح','في الطابور الصباحي','أن يذكر الطالب قاعدة واحدة لاحترام النظام في الطابور عند الحوار.'),
('96466541-3009-4f29-a17d-6e77e71e6836'::uuid,'الدرس السابع: حرف (ر)','ر','الخبر المفرح','أن يُظهر الطالب احترام دور زميله في الحديث عن ركن القراءة.'),
('b0b7f330-c833-44db-8625-3a790efce1f2'::uuid,'الدرس الثامن: حرف (س)','س','هيا نرسم','أن يوجه الطالب عبارة تشجيع واحدة لرسم زميله دون سخرية.'),
('e57fb95e-0d5b-4a52-9e8d-f541216cc8d4'::uuid,'الدرس التاسع: حرف (ل)','ل','المدرسة الجميلة','أن يذكر الطالب سلوكًا واحدًا للمحافظة على نظافة المدرسة.'),
('69c32ad8-e737-444a-92cc-044919e87540'::uuid,'الدرس الحادي عشر: حرف (ج)','ج','أين جارنا جاسم؟','أن يستخدم الطالب عبارة مهذبة واحدة للسؤال عن الجيران.'),
('1145b186-c334-4ced-a98e-8a5bf1f28ddc'::uuid,'الدرس الثاني عشر: حرف (ن)','ن','الصديقة الجديدة','أن يرحب الطالب بزميل جديد مستخدمًا عبارة لطيفة واحدة.'),
('f6419bab-fee6-4436-9f50-54a4da934999'::uuid,'الدرس الثالث عشر: حرف (ع)','ع','الحية بيه','أن يعبّر الطالب بجملة واحدة عن تقديره للتراث البحريني.'),
('0eb8f691-50e6-4329-bfc9-271a4822d283'::uuid,'الدرس الرابع عشر: حرف (ت)','ت','مسابقة بطل الحي','أن يذكر الطالب سلوكًا واحدًا يدل على احترام قواعد المنافسة.');
DO $preflight$
DECLARE records integer;bad integer;
BEGIN
 SELECT count(*) INTO records FROM source_objectives;
 IF records <> 12 THEN RAISE EXCEPTION 'Expected twelve exact lessons, got %',records; END IF;
 SELECT count(*) INTO bad FROM source_objectives e
 LEFT JOIN public.lessons l ON l.id=e.lesson_id
 LEFT JOIN public.units u ON u.id=l.unit_id
 LEFT JOIN public.grades g ON g.id=u.grade_id
 LEFT JOIN public.curricula cu ON cu.id=g.curriculum_id
 LEFT JOIN public.countries c ON c.id=cu.country_id
 WHERE l.id IS NULL OR c.code<>'BH' OR g.grade_number<>1 OR l.semester<>1
 OR l.status<>'published' OR l.title<>e.exact_title
 OR l.learning_objectives IS NULL OR jsonb_array_length(l.learning_objectives)<>3
 OR l.learning_objectives::text LIKE '%قصة ضاديوم%'
 OR NOT l.content LIKE '%'||e.source_story||'%'
 OR NOT l.content LIKE '%أولًا: أستمع وأفهم%'
 OR EXISTS(SELECT 1 FROM public.student_lesson_progress sp WHERE sp.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM public.question_attempts qa JOIN public.questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM public.lesson_activity_attempts aa JOIN public.lesson_activities a ON a.id=aa.activity_id WHERE a.lesson_id=l.id);
 IF bad<>0 THEN RAISE EXCEPTION 'Unsafe target or student activity in % rows; rolling back',bad; END IF;
END $preflight$;
UPDATE public.lessons l SET
 learning_objectives=jsonb_build_array(
 'أن يذكر الطالب حدثين صحيحين من قصة ضاديوم «'||e.source_story||'» بعد الاستماع.',
 'أن يحدد الطالب موضع حرف «'||e.target_letter||'» في ثلاث كلمات معروضة.',
 e.objective_affective
 ),updated_at=now()
 FROM source_objectives e WHERE l.id=e.lesson_id;
DO $verify$
DECLARE passed integer;
BEGIN
 SELECT count(*) INTO passed FROM public.lessons l
 JOIN source_objectives e ON e.lesson_id=l.id
 WHERE jsonb_array_length(l.learning_objectives)=3
 AND l.learning_objectives->>0 LIKE '%حدثين صحيحين%'
 AND l.learning_objectives->>1 LIKE '%ثلاث كلمات%'
 AND l.learning_objectives->>2=e.objective_affective;
 IF passed<>12 THEN RAISE EXCEPTION 'Rollback! Only % objectives updated',passed; END IF;
END $verify$;
COMMIT;
