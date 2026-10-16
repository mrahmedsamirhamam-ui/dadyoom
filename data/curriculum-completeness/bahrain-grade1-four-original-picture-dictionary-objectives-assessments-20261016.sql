-- Four additional original Dadyoom first-grade picture-dictionary support lessons.
-- The lessons already exist and remain published; we do not change textbook
-- provenance, lesson titles or official 2026-27 TOC assertions.
-- Target only the identified BH grade-1 term-1 lessons with empty objectives.
WITH proposed(id,objectives) AS (
 VALUES ('f7018637-c901-4cd6-aa7c-2819daaa6554'::uuid,'["أن يميّز المتعلم ثلاثة أسماء لحيوانات من بطاقات ضاديوم المصورة.","أن يربط المتعلم اسم الحيوان بوصف بسيط ويستخدمه في جملة شفوية."]'::jsonb),
('022b1a1d-e918-4538-8f41-87f765c1f416'::uuid,'["أن يتعرّف المتعلم مفردات هاتف وحافلة ورسالة من نشاط ضاديوم.","أن يميّز المتعلم وسيلة للتنقل ووسيلة للتواصل في أمثلة بسيطة."]'::jsonb),
('a0d8a189-e2b5-408d-bf98-e80307bc0378'::uuid,'["أن يسمّي المتعلم ثلاث مهن مستهدفَة في نشاط قاموسي المصور.","أن يربط المتعلم اسم المهنة بالعمل الذي يقوم به صاحبها."]'::jsonb),
('db6d40b0-d41f-439e-9be4-acd74fcb057f'::uuid,'["أن يتعرّف المتعلم مفردات مطر وشمس وغيم في نشاط ضاديوم.","أن يختار المتعلم وصفًا صحيحًا لحالة طقس مألوفة."]'::jsonb)
), eligible AS (
 SELECT p.id,p.objectives FROM proposed p
 JOIN public.lessons l ON l.id=p.id
 JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula c ON c.id=g.curriculum_id
 JOIN public.countries co ON co.id=c.country_id
 WHERE co.code='BH' AND g.grade_number=1 AND l.semester=1
 AND l.status='published' AND l.title='قاموسي المصور'
)
UPDATE public.lessons l SET learning_objectives=e.objectives
FROM eligible e
WHERE l.id=e.id
 AND (l.learning_objectives IS NULL OR l.learning_objectives='[]'::jsonb);
WITH proposed(id,ord,question,options,correct_answer,explanation) AS (
VALUES
('f7018637-c901-4cd6-aa7c-2819daaa6554'::uuid,1,'أي حيوان يسبح في الماء من كلمات النشاط؟','[{"id":"a","text":"قطة"},{"id":"b","text":"سمكة"},{"id":"c","text":"طائر"},{"id":"d","text":"أسد"}]'::jsonb,'b','في قاموس ضاديوم المصور وردت السمكة مثالًا لحيوان يسبح.'),
('f7018637-c901-4cd6-aa7c-2819daaa6554'::uuid,2,'أي حيوان من كلمات النشاط يستطيع الطيران عادة؟','[{"id":"a","text":"قطة"},{"id":"b","text":"سمكة"},{"id":"c","text":"حصان"},{"id":"d","text":"طائر"}]'::jsonb,'d','الطائر من الحيوانات التي تستطيع الطيران، وهو من المفردات المتدرب عليها.'),
('022b1a1d-e918-4538-8f41-87f765c1f416'::uuid,1,'أي كلمة تدل على شيء يمكن كتابته وإرساله؟','[{"id":"a","text":"حافلة"},{"id":"b","text":"طريق"},{"id":"c","text":"رسالة"},{"id":"d","text":"كرسي"}]'::jsonb,'c','الرسالة يمكن أن نكتبها ونرسلها إلى الآخرين.'),
('022b1a1d-e918-4538-8f41-87f765c1f416'::uuid,2,'بماذا يمكن أن ينتقل الركاب من مكان إلى آخر؟','[{"id":"a","text":"حافلة"},{"id":"b","text":"رسالة"},{"id":"c","text":"هاتف"},{"id":"d","text":"قلم"}]'::jsonb,'a','الحافلة وسيلة نقل للركاب، بخلاف الرسالة والهاتف.'),
('a0d8a189-e2b5-408d-bf98-e80307bc0378'::uuid,1,'من يساعد التلاميذ على فهم الدروس في المدرسة؟','[{"id":"a","text":"مزارع"},{"id":"b","text":"معلم"},{"id":"c","text":"سائق"},{"id":"d","text":"رسام"}]'::jsonb,'b','المعلم يشرح الدروس ويساعد التلاميذ على تعلمها.'),
('a0d8a189-e2b5-408d-bf98-e80307bc0378'::uuid,2,'من يعمل في زراعة الأرض والعناية بالنباتات؟','[{"id":"a","text":"طبيب"},{"id":"b","text":"معلم"},{"id":"c","text":"طيار"},{"id":"d","text":"مزارع"}]'::jsonb,'d','المزارع يزرع الأرض ويعتني بالنباتات.'),
('db6d40b0-d41f-439e-9be4-acd74fcb057f'::uuid,1,'أي كلمة تدل على قطرات ماء تنزل من السماء؟','[{"id":"a","text":"شمس"},{"id":"b","text":"رياح"},{"id":"c","text":"مطر"},{"id":"d","text":"قمر"}]'::jsonb,'c','المطر هو قطرات الماء التي تسقط من الغيوم إلى الأرض.'),
('db6d40b0-d41f-439e-9be4-acd74fcb057f'::uuid,2,'أي كلمة تدل على السحاب في السماء؟','[{"id":"a","text":"غيم"},{"id":"b","text":"شمس"},{"id":"c","text":"تراب"},{"id":"d","text":"دفتر"}]'::jsonb,'a','الغيم اسم للسحاب الذي نراه في السماء.')
), eligible AS (
 SELECT p.* FROM proposed p
 JOIN public.lessons l ON l.id=p.id
 JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula c ON c.id=g.curriculum_id
 JOIN public.countries co ON co.id=c.country_id
 WHERE co.code='BH' AND g.grade_number=1 AND l.semester=1
 AND l.status='published' AND l.title='قاموسي المصور'
)
INSERT INTO public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
SELECT id,ord,question,'multiple_choice',options,correct_answer,explanation,1
FROM eligible
ON CONFLICT(lesson_id,question_order) DO NOTHING
RETURNING lesson_id,question_order;