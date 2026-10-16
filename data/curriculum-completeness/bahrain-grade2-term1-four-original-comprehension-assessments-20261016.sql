-- Original Dadyoom formative questions for four existing Bahrain grade-2 term-one lessons.
-- Classroom text checked against the existing original Dadyoom lesson body.
-- Official Plan1.pdf confirms scheduled TITLES ONLY; these questions are not ministry-book questions.
-- Idempotent and restricted to existing published Bahrain grade-2 term-one lesson UUIDs.
WITH proposed(lesson_id,question_order,question,options,correct_answer,explanation) AS (
 VALUES
 ('5959ac5f-e203-4c16-aa31-4f49e5ecc7e8'::uuid,1,'كم بطة ورد ذكرها مع السلحفاة في نص ضاديوم الداعم؟', '[{"id":"a","text":"بطتان"},{"id":"b","text":"ثلاث بطات"},{"id":"c","text":"بطة واحدة"},{"id":"d","text":"أربع بطات"}]'::jsonb, 'a', 'ورد في النص أن السلحفاة كانت مع بطتين، ولذلك الإجابة «بطتان».'),
 ('5959ac5f-e203-4c16-aa31-4f49e5ecc7e8'::uuid,2,'ماذا فعلت الصديقات عندما وجدن زجاجة فارغة قرب الماء؟', '[{"id":"a","text":"لعبن بالزجاجة"},{"id":"b","text":"رمين الزجاجة في الماء"},{"id":"c","text":"أخبرن المسؤول عن المكان"},{"id":"d","text":"ابتعدن دون إخبار أحد"}]'::jsonb, 'c', 'تعاونت الصديقات في إخبار المسؤول عن وجود الزجاجة، ولم يتعاملن مع النفايات بتهور.'),
 ('5959ac5f-e203-4c16-aa31-4f49e5ecc7e8'::uuid,3,'لماذا فرحت الصديقات في نهاية الحكاية؟', '[{"id":"a","text":"لأن المكان أصبح مزدحمًا"},{"id":"b","text":"لأنهن لعبن بالنفايات"},{"id":"c","text":"لأنهن ابتعدن عن البحيرة"},{"id":"d","text":"لأن التعاون ساعد على العناية بالمكان"}]'::jsonb, 'd', 'فرحن بالتعاون الذي يحافظ على نظافة البيئة وجمالها.'),
 ('eb4b06fd-841f-4d69-bd56-1cfbbfde9716'::uuid,1,'ماذا اختار خالد أن يفعل صباح العطلة؟', '[{"id":"a","text":"ترتيب الحقيبة"},{"id":"b","text":"قراءة قصة قصيرة"},{"id":"c","text":"اللعب بالكرة"},{"id":"d","text":"النوم طوال اليوم"}]'::jsonb, 'b', 'اختار خالد قراءة قصة قصيرة صباحًا وفق نص الاستماع الداعم من ضاديوم.'),
 ('eb4b06fd-841f-4d69-bd56-1cfbbfde9716'::uuid,2,'متى خطط خالد للعب بالكرة؟', '[{"id":"a","text":"في الصباح الباكر"},{"id":"b","text":"قبل النوم"},{"id":"c","text":"عصرًا"},{"id":"d","text":"بعد الذهاب للمدرسة"}]'::jsonb, 'c', 'قال النص إن خالد اختار اللعب بالكرة عصرًا.'),
 ('eb4b06fd-841f-4d69-bd56-1cfbbfde9716'::uuid,3,'لماذا رتب خالد حقيبته في المساء؟', '[{"id":"a","text":"ليستعد ليوم الدراسة التالي"},{"id":"b","text":"ليذهب للملعب"},{"id":"c","text":"ليزور المكتبة حالًا"},{"id":"d","text":"لأنه لم يجد كتابًا"}]'::jsonb, 'a', 'رتب خالد حقيبته في المساء استعدادًا لليوم الدراسي التالي.'),
 ('c273f75b-50de-4fa5-b04f-5cf25c86789f'::uuid,1,'بماذا غسلت دانة يديها بعد اللعب؟', '[{"id":"a","text":"بماء البحيرة"},{"id":"b","text":"بالعطر"},{"id":"c","text":"بالماء والصابون"},{"id":"d","text":"بالعصير"}]'::jsonb, 'c', 'غسلت دانة يديها بالماء والصابون قبل الأكل في نص ضاديوم الداعم.'),
 ('c273f75b-50de-4fa5-b04f-5cf25c86789f'::uuid,2,'متى غسلت دانة يديها؟', '[{"id":"a","text":"بعد تناول الطعام"},{"id":"b","text":"قبل تناول الطعام"},{"id":"c","text":"بعد النوم"},{"id":"d","text":"قبل الذهاب إلى ساحة اللعب"}]'::jsonb, 'b', 'غسلت يديها بعد العودة من اللعب وقبل تناول الطعام.'),
 ('c273f75b-50de-4fa5-b04f-5cf25c86789f'::uuid,3,'أي عادة صحية أخرى ذكرتها دانة؟', '[{"id":"a","text":"ترك الحقيبة في الساحة"},{"id":"b","text":"تأخير النوم كثيرًا"},{"id":"c","text":"تناول الطعام بيدين متسختين"},{"id":"d","text":"النوم في وقت مناسب"}]'::jsonb, 'd', 'ذكرت دانة أن النوم في وقت مناسب يساعد على المحافظة على الصحة.'),
 ('c9b512d5-6f6a-419b-a5ec-f75b68e2dd22'::uuid,1,'أي كلمة تبدأ بحرف الضاد؟', '[{"id":"a","text":"صبر"},{"id":"b","text":"ضوء"},{"id":"c","text":"طائر"},{"id":"d","text":"ظرف"}]'::jsonb, 'b', 'كلمة «ضوء» تبدأ بحرف الضاد (ض)، أما «صبر» فتبدأ بالصاد.'),
 ('c9b512d5-6f6a-419b-a5ec-f75b68e2dd22'::uuid,2,'بأي حرف تبدأ كلمة «طائر»؟', '[{"id":"a","text":"الظاء"},{"id":"b","text":"الصاد"},{"id":"c","text":"الطاء"},{"id":"d","text":"الضاد"}]'::jsonb, 'c', 'تبدأ كلمة «طائر» بحرف الطاء (ط)، وهو يختلف عن الظاء (ظ).'),
 ('c9b512d5-6f6a-419b-a5ec-f75b68e2dd22'::uuid,3,'بأي حرف تبدأ كلمة «ظرف»؟', '[{"id":"a","text":"الظاء"},{"id":"b","text":"الطاء"},{"id":"c","text":"الضاد"},{"id":"d","text":"الصاد"}]'::jsonb, 'a', 'تبدأ كلمة «ظرف» بحرف الظاء (ظ)، وهي من كلمات التدريب الأصلي في الدرس.')
), eligible AS (
 SELECT p.* FROM proposed p
 JOIN public.lessons l ON l.id=p.lesson_id
 JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula c ON c.id=g.curriculum_id
 JOIN public.countries co ON co.id=c.country_id
 WHERE co.code='BH' AND g.grade_number=2 AND l.semester=1
   AND l.status='published'
   AND l.source_pdf_url='https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf'
)
INSERT INTO public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
SELECT lesson_id,question_order,question,'multiple_choice',options,correct_answer,explanation,1
FROM eligible
ON CONFLICT (lesson_id,question_order) DO NOTHING
RETURNING lesson_id,question_order;