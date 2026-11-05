-- Dadyoom 2026-11-05: tightly guarded correction to 14 existing PS G2/G3 T2 2020-book-derived explanations.
-- Historical 2020 print ONLY: NO certification of 2024 educational packs or 2026–27 full textbook.
-- Original complete student-book lessons ALREADY EXIST in production. DO NOT RE-INSERT OR REPLAY older SQL.
-- Changes exactly 14 individualized three-objective arrays; one factual solar/lunar article example fix.
-- NO DELETE/INSERT, no changes to student history, attempts, assessments, learning progress or source links.
-- RUN ONCE; fail closed on any unexpected title, term, source, body or extra/missing/multiple matching records.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
CREATE TEMP TABLE ps14_objective_refine (
  id uuid PRIMARY KEY, grade_number integer NOT NULL, title text NOT NULL,
  objectives jsonb NOT NULL
) ON COMMIT DROP;
INSERT INTO ps14_objective_refine VALUES
('0ff4bdb7-f245-4885-a820-1b45a551bb1e'::uuid,2,'النمر والحطاب','["أن يحدد الطالب النمر والقرد والحطاب، ويرتب ثلاثة أحداث من الحكاية ترتيبًا صحيحًا.","أن يفسر سبب ربط النمر بالشجرة، ويستنتج علاقة التكبر وسوء التقدير بالنتيجة.","أن يميز اللام الشمسية في «النمر» والقمرية في «الإنسان»، ثم يلخص الفكرة في ثلاث جمل."]'::jsonb),
('3c48bea9-016c-4f28-90aa-7d3c23d6aca3'::uuid,2,'صباح جديد','["أن يحدد الطالب بلالًا ولميس والأم، ويعرض سؤال الطفلين عن غروب الشمس.","أن يفسر تعاقب الليل والنهار تفسيرًا علميًا مبسطًا مرتبطًا بدوران الأرض دون الخلط بالغرق.","أن يوظف الضميرين «هو» و«هي» في جملتين ويقارن بين الشروق والغروب."]'::jsonb),
('01aaabd0-1826-4cec-a6db-10bf52796908'::uuid,2,'حيلة فلاح','["أن يرتب الطالب أحداث سرقة الثور ولقاء الفلاح باللص وكشف الحقيقة.","أن يفسر كيف كشف سؤال الفلاح عن عين الثور ادعاء اللص دون دليل.","أن يميز لام التعريف الشمسية في «الثور» والقمرية في «الفلاح»، ويكتب سؤالًا يبدأ بـ«أيّ»."]'::jsonb),
('c2b76e9a-794b-4a7c-b8f1-d2d02d408135'::uuid,2,'يوم الطفل الفلسطيني','["أن يلخص الطالب موضوع كلمة سامر في الإذاعة المدرسية بمناسبة يوم الطفل الفلسطيني.","أن يذكر أربعة حقوق للطفل وردت في موضوع القراءة ويميز بينها وبين الأماني.","أن يصوغ جملتين عن حقوق الأطفال وأملهم باستعمال «نحن» وحرف الجر «في»."]'::jsonb),
('dfb59b2a-6694-4072-b4c4-f4f9b43fb424'::uuid,2,'لدي حلم','["أن يعرف الطالب شخصية عباس بن فرناس وحلم الطيران الذي يعالجه نص القراءة.","أن يرتب ثلاث مراحل من الملاحظة ومحاولة الطيران ويبين أهمية التعلم من التجربة.","أن يستخرج ثلاثة أفعال ماضية ويحولها إلى المضارع ثم يكتب جملة عن حلم علمي."]'::jsonb),
('5a8109d7-c8f0-4b9c-9abe-ae393e7180ea'::uuid,2,'الببغاء الثرثار','["أن يحدد الطالب الببغاء والزرافة والغزال ويعرض كيف انتشر خبر القنفذ غير المعقول.","أن يستنتج من الأحداث خطورة ترديد الشائعات دون تفكير أو تحقق.","أن يصوغ سؤالين للتحقق من خبر مستخدمًا «هل» و«لماذا» ثم يميز السؤال من الخبر."]'::jsonb),
('039e51a0-f035-4180-946c-a8d5adbcb2d8'::uuid,2,'في البقالة','["أن يحدد الطالب دور سليم ومريم والعاملين والأب في أحداث متجر البقالة.","أن يفسر أثر إخفاء تاريخ صلاحية المواد الغذائية والطريقة المناسبة لإبلاغ الجهات المختصة.","أن يميز الماضي والمضارع في ثلاثة أفعال ويكتب تنبيهًا مهذبًا عن فحص تواريخ الصلاحية."]'::jsonb),
('3cbac251-9120-4180-a9ef-2656b43a9a30'::uuid,3,'الراعي والذئب','["أن يميز الطالب بين استغاثات الراعي الكاذبة وظهور الذئب الحقيقي ويرتبها.","أن يفسر كيف أدى تكرار الكذب إلى فقدان الراعي ثقة أهل القرية.","أن يكتب جملة نهي عن الكذب ويلخص العبرة في جملتين."]'::jsonb),
('4eb20fb4-5859-415f-86e0-294bf14ff6c8'::uuid,3,'أحب أن أكون','["أن يطابق الطالب فارسًا وسعاد وفاطمة ومسعودًا مع المهن التي اختاروها في الحوار.","أن يفسر ارتباط المهنة بالميول والمهارات وخدمة المجتمع باستخدام مثالين.","أن يكتب ثلاث جمل عن مهنة مستقبلية مستخدمًا سين الاستقبال وصيغتي المذكر والمؤنث."]'::jsonb),
('fe4f76b8-7984-4623-ba6f-1ca9e10bdd2d'::uuid,3,'الغراب والثعلب','["أن يرتب الطالب مشهد الغراب والجبن ومديح الثعلب وسقوط الجبن ترتيبًا صحيحًا.","أن يعلل كيف خدع الثعلب الغراب بالثناء غير الصادق ويستنتج العبرة.","أن يصف الشخصيتين بصفات مناسبة ويفسر النتيجة في جملة تتضمن «لأن»."]'::jsonb),
('9e78ee24-df40-4899-bbbc-5cde06a885f0'::uuid,3,'في حديقة الحيوان','["أن يسرد الطالب ترتيب زيارة التلميذات إلى الحديقة ودور الدليل والمعلمة.","أن يصف الفيل والقرود والكنغر والأسد بصفات أو حركات وردت في الدرس.","أن يصوغ أسلوب تعجب صحيحًا ويحول اسمين من المفرد إلى الجمع."]'::jsonb),
('150bdd0a-9a4f-45d1-afa9-a892b7a3e01b'::uuid,3,'طبيب الأسد','["أن يوضح الطالب سبب خوف الحيوانات من الأسد وكيف تنكر القرد في صورة طبيب.","أن يفسر النتيجة الرمزية للحيلة ويميز بين الحكاية الخيالية والعلاج الطبي الحقيقي.","أن يحول ثلاثة أفعال من الماضي إلى المضارع ويصوغ سؤالًا عن السبب والنتيجة."]'::jsonb),
('3713ff45-3c5a-4535-af2f-6aa7177cdbe3'::uuid,3,'الصديق وقت الضيق','["أن يحدد الطالب موقف الرفاق عند ظهور الدب، وماذا فعل الرجل المتروك وحده في الحكاية.","أن يستنتج معنى «الصديق وقت الضيق» ويذكر سلوكًا آمنًا يدل على الوفاء.","أن يصوغ جملة شرطية باستخدام «إذا» وجملة تعبر عن أهمية التعاون."]'::jsonb),
('375f5229-940e-44e4-bf39-47ea5bbd1a64'::uuid,3,'أول فدائي في الإسلام','["أن يعرف الطالب دور علي بن أبي طالب رضي الله عنه في قصة الهجرة النبوية.","أن يرتب ثلاثة أحداث من ليلة الهجرة ويوضح معنى الشجاعة وتحمل المسؤولية.","أن يكتب أسماء الأعلام في القصة كتابة صحيحة ويصوغ جملًا باستعمال «قبل، أثناء، بعد»."]'::jsonb);
DO $guard$
DECLARE n integer;
BEGIN
 SELECT COUNT(*) INTO n FROM ps14_objective_refine;
 IF n<>14 THEN RAISE EXCEPTION 'Expected exactly 14 objective refinements; got %',n; END IF;
 SELECT COUNT(*) INTO n FROM ps14_objective_refine t
 JOIN public.lessons l ON l.id=t.id AND l.title=t.title AND l.status='published' AND l.semester=2
 JOIN public.units u ON u.id=l.unit_id AND u.semester=2
 JOIN public.grades g ON g.id=u.grade_id AND g.grade_number=t.grade_number
 JOIN public.curricula cu ON cu.id=g.curriculum_id
 JOIN public.countries c ON c.id=cu.country_id AND c.code='PS'
 WHERE length(l.content)>2900 AND l.content LIKE '%[نهاية شرح ضاديوم الأصلي المبني على أحداث الكتاب 2020]%'
   AND l.content LIKE '%2026–2027%' AND l.source_pdf_url LIKE '%wepal.net%'
   AND jsonb_typeof(t.objectives)='array' AND jsonb_array_length(t.objectives)=3;
 IF n<>14 THEN RAISE EXCEPTION 'Preflight failed. 14 unmodified 2020-edition G2/G3 T2 published records required; got %',n; END IF;
 SELECT COUNT(*) INTO n FROM (
    SELECT g.grade_number,l.title,COUNT(*) n
    FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id
    JOIN public.curricula cu ON cu.id=g.curriculum_id
    JOIN public.countries c ON c.id=cu.country_id
    JOIN ps14_objective_refine t ON t.title=l.title AND t.grade_number=g.grade_number
    WHERE c.code='PS' AND l.status='published' AND COALESCE(l.semester,u.semester)=2
    GROUP BY g.grade_number,l.title HAVING COUNT(*)<>1
 ) repeated;
 IF n<>0 THEN RAISE EXCEPTION 'Duplicate lesson title detected; refuse edits'; END IF;
 SELECT COUNT(*) INTO n FROM public.lessons WHERE id='01aaabd0-1826-4cec-a6db-10bf52796908'::uuid AND content LIKE '%' || 'أتدرب على اللام الشمسية والقمرية في «الثور» و«السوق» و«الناس»، وأكتب سؤالًا يبدأ بـ«أيّ».' || '%';
 IF n<>1 THEN RAISE EXCEPTION 'The phonics fix cannot find its expected exact old text'; END IF;
END $guard$;
UPDATE public.lessons l SET
 learning_objectives=t.objectives,
 content=CASE WHEN l.id='01aaabd0-1826-4cec-a6db-10bf52796908'::uuid
              THEN replace(l.content,'أتدرب على اللام الشمسية والقمرية في «الثور» و«السوق» و«الناس»، وأكتب سؤالًا يبدأ بـ«أيّ».','أميز اللام الشمسية في «الثور» و«السوق» و«الناس»، واللام القمرية في «الفلاح» و«الغطاء»، وأكتب سؤالًا يبدأ بـ«أيّ».') ELSE l.content END,
 updated_at=now()
FROM ps14_objective_refine t
WHERE l.id=t.id AND l.title=t.title;
DO $verify$
DECLARE n integer;
BEGIN
 SELECT COUNT(*) INTO n FROM public.lessons l JOIN ps14_objective_refine t ON l.id=t.id
 WHERE l.learning_objectives=t.objectives AND l.status='published' AND l.semester=2;
 IF n<>14 THEN RAISE EXCEPTION 'Post-write specific learning objectives failed, count %',n; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.lessons WHERE id='01aaabd0-1826-4cec-a6db-10bf52796908'::uuid AND content LIKE '%' || 'أميز اللام الشمسية في «الثور» و«السوق» و«الناس»، واللام القمرية في «الفلاح» و«الغطاء»، وأكتب سؤالًا يبدأ بـ«أيّ».' || '%') THEN
    RAISE EXCEPTION 'Post-write phonics repair missing';
 END IF;
END $verify$;
COMMIT;
-- Verification: SELECT the 14 IDs and 3 objectives and the G2 phonics expression on production. Never replay without reason.
