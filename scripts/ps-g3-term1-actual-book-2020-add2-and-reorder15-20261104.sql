-- Real Palestinian government textbook "لغتنا الجميلة" Grade3 Part1 CURRENT ministry portal link,
-- but print edition 2020 (DO NOT claim 2026 textbook content approval).
-- Adds two MISSING reading lessons with actual source story themes and grammar examples; reorders all 13 existing.
-- Replaces six generic fake standalone subject area headings with draft (NOT DELETE). Students untouched.
BEGIN;
SET LOCAL lock_timeout='5s';SET LOCAL statement_timeout='120s';
CREATE TEMP TABLE ps_g3_existing(
 lesson_id uuid PRIMARY KEY,title text NOT NULL,old_order int NOT NULL,
 source_page int NOT NULL,source_page_end int NOT NULL,new_order int NOT NULL
) ON COMMIT DROP;
INSERT INTO ps_g3_existing VALUES
('ab5f5652-d42e-4dc6-8935-17309920d1bc'::uuid,'ذهب الأرض',60,5,14,20),
('19417b64-223d-4341-9407-4c9b814a59f7'::uuid,'الأرنب والسلحفاة',61,15,24,21),
('06f6f726-17ca-482e-bba9-5baa87e5670d'::uuid,'الفأرة والثعبان',140,25,34,22),
('9875d6ad-5e99-4fc1-b517-fda9ee0eb339'::uuid,'قريتنا نظيفة',141,35,44,23),
('7927c89f-2e90-4e21-a5b8-145d2f9acdc0'::uuid,'دينا والقمر',172,45,54,24),
('0b32e1fe-f2f8-4c06-987d-10d7eddee40c'::uuid,'العصفورة تبني عشها',173,55,64,25),
('7916c843-51f3-4747-89a5-66625e06ad89'::uuid,'الخباز',174,85,94,28),
('20bb5c8b-ea3a-48a7-89b5-e0160545ca1e'::uuid,'عاقبة الطمع',152,95,104,29),
('fc39dc11-a056-41d4-a4ba-2f68b774e2fb'::uuid,'عروس البحر',153,105,114,30),
('a68241ce-fce4-463e-ab69-5864c57e0566'::uuid,'الذئب ومالك الحزين',151,115,124,31),
('2ecbf2f5-9621-4646-ac1a-c584ff17724e'::uuid,'المهر الصغير',142,125,134,32),
('79611ada-8039-4e9b-a988-92c2ff01b3aa'::uuid,'براء لا يعرف اليأس',143,135,144,33),
('6e188458-d390-481f-a085-661ea91c1b01'::uuid,'من نوادر جحا',154,145,153,34);
CREATE TEMP TABLE ps_g3_missing(
 title text PRIMARY KEY,new_order int NOT NULL,source_page int NOT NULL,
 source_page_end int NOT NULL,subject_body text NOT NULL,objectives jsonb NOT NULL
) ON COMMIT DROP;
INSERT INTO ps_g3_missing VALUES
('مكتبتي صديقتي',26,65,74,$subject0$[ضاديوم — درس كامل الشرح من فهرس الكتاب الفلسطيني الفعلي، وليس عنوانًا فقط]
المقرر: «لغتنا الجميلة»، الصف الثالث، الجزء الأول. الكتاب الرسمي المرتبط ببوابة التعليم الفلسطينية الحالية: https://elearn.azureedge.net/Books/c3/ar3-p1.pdf
الصفحات المطبوعة: 65–74. الطبعة الرابعة المطبوعة 2020؛ لم تثبت بعد مطابقة جميع تفاصيلها لأي نسخة منقحة لعام 2026–2027. هذا شرح مستقل من ضاديوم للموضوع الفعلي والأحداث الواردة في الكتاب، وليس نقلًا حرفيًا للنص الوزاري.

أولًا: أعرف موضوع درس «مكتبتي صديقتي»
ملخص أحداث القراءة الأصلية بأسلوب تعليمي جديد:
تستقبل سلمى زيارة صديقتها علا، التي تحمل لها هدية مغلفة. تفتح سلمى الهدية فتجد كتابًا مصورًا وتفرح به؛ لأنها محبة للقراءة. تدعو صديقتها إلى مشاهدة مكتبتها المنزلية. تشاهد علا الكتب مرتبة في رفوف متعددة: كتب مصورة وقصص وأدوات رسم وكتابة، وفي المكان حاسوب ومواد تعليمية. تقضي الصديقتان وقتًا نافعًا بين الكتب ومشاهدة موارد تعليمية.
أستنتج الفكرة الرئيسة وأميزها عن التفاصيل؛ فالدرس يعرض موقفًا مترابطًا له شخصيات وسبب ونتيجة. لا أتخيل أحداثًا لم ترد في القصة.

ثانيًا: أفهم الأحداث بترتيبها وأستدل
هدية علا كانت كتابًا مصورًا، وسلمى فرحت لأنها تحب الكتب. دهشة علا كانت من تنظيم المكتبة وتنوع محتوياتها. رتبت سلمى الأرفف لتسهيل العثور على أنواع مختلفة من الكتب.
أتدرب على ذكر البداية والوسط والنهاية في ثلاث جمل واضحة، وأستدل على الإجابة بحدث ورد في القصة بدل الاعتماد على التخمين. إذا لم أتذكر ترتيب الأحداث أرجع إلى الشرح وأعيد قراءته.

ثالثًا: أستمع وأوسع مفرداتي
«المكتبة العامة» عنوان الاستماع المرتبط بهذا الدرس في كتاب الوزارة، وهو منفصل عن قصة القراءة «مكتبتي صديقتي». يقرأه المعلم من المصدر المرخص إن توفر؛ لا نستبدله بالقصة الوصفية.
المفردات الأساسية: مُجِدَّة: نشيطة وجادة في دروسها؛ غلاف: ما يحيط بالكتاب أو الهدية؛ رفوف: ألواح ننظم عليها الكتب؛ مصوَّر: يحتوي على رسومات وصور؛ المكتبة: مكان تجمع فيه الكتب والموارد للقراءة والبحث.
أفسر كلمتين من سياقهما، ثم أضع إحداهما في جملة جديدة من إنشائي. أقرأ الجمل بصوت مفهوم وأقف عند علامة انتهاء الفكرة.

رابعًا: أفهم الموضوع اللغوي وأطبقه
أتأمل «هما صديقان» و«هما صديقتان»؛ «هما» للاثنين ذكرين أو اثنتين، ويختلف الاسم الوصفي بحسب المذكر والمؤنث. أكتب «هما قارئان» في وصف ولدين و«هما قارئتان» في وصف بنتين، ثم أراجع علامات التثنية. أوضح الفرق بين اللام الشمسية والقمرية في «الشاي» و«الكتاب».
أقارن المثالين وأشرح سبب التغيير في الكلمة، ثم أصوغ جملة جديدة صحيحة. أراجع كتابتي من اليمين إلى اليسار، وأنتبه إلى شكل الحرف أو الحركة قبل تسليم الجملة.

خامسًا: أفكر وأكتب وأتحدث
أسئلة فهم حقيقية من مضمون الدرس: ما نوع الهدية؟ ولماذا فرحت سلمى؟ كيف نظمت مكتبتها؟ ما الفرق بين «هما صديقان» و«هما صديقتان»؟ كيف تساعدنا المكتبة على التعلم؟
أعبر شفهيًا عن موقف مشابه بجملتين واضحتين، وأكتب خلاصة للدرس دون إعادة كتابة نص الكتاب؛ وأفصل بين رأيي والمعلومة التي أكدتها القصة. يمكن للمعلم توضيح الجزء الصعب بصورة أو بقراءة جملة مسموعة. يكون التقدير على فهم الموضوع والدليل لا على عدد الأنشطة.

[نهاية شرح ضاديوم لدرس الكتاب الفعلي]$subject0$,'["أن يلخص الطالب أحداث قصة «مكتبتي صديقتي» في ثلاث جمل مرتبة دون تغيير الشخصيات أو الحدث.","أن يفسر الطالب كلمتين من القصة ويجيب عن سؤالين بدليل من أحداثها.","أن يصف الطالب فائدة واحدة للمكتبة، ويحترم آراء زملائه حول اختيار الكتب."]'::jsonb),
('حذاء الحكيم',27,75,84,$subject1$[ضاديوم — درس كامل الشرح من فهرس الكتاب الفلسطيني الفعلي، وليس عنوانًا فقط]
المقرر: «لغتنا الجميلة»، الصف الثالث، الجزء الأول. الكتاب الرسمي المرتبط ببوابة التعليم الفلسطينية الحالية: https://elearn.azureedge.net/Books/c3/ar3-p1.pdf
الصفحات المطبوعة: 75–84. الطبعة الرابعة المطبوعة 2020؛ لم تثبت بعد مطابقة جميع تفاصيلها لأي نسخة منقحة لعام 2026–2027. هذا شرح مستقل من ضاديوم للموضوع الفعلي والأحداث الواردة في الكتاب، وليس نقلًا حرفيًا للنص الوزاري.

أولًا: أعرف موضوع درس «حذاء الحكيم»
ملخص أحداث القراءة الأصلية بأسلوب تعليمي جديد:
كان رجل حكيم يحاول اللحاق بقطار بدأ بالتحرك. وبينما يصعد سقط من قدمه حذاء واحد على السكة، ولم يستطع استعادته. فاختار سريعًا أن يضع الحذاء الآخر قرب الأول، حتى يستطيع شخص محتاج يعثر عليهما أن ينتفع بهما معًا. استغرب أصدقاؤه تصرفه، فشرح لهم أن الحذاء الواحد لم يعد نافعًا له، ولا لمن يجد فردة واحدة وحدها، أما الاثنتان فتصيران زوجًا ينتفع به صاحبه الجديد.
أستنتج الفكرة الرئيسة وأميزها عن التفاصيل؛ فالدرس يعرض موقفًا مترابطًا له شخصيات وسبب ونتيجة. لا أتخيل أحداثًا لم ترد في القصة.

ثانيًا: أفهم الأحداث بترتيبها وأستدل
الحدث الأول: محاولة اللحاق بالقطار. المشكلة: سقوط إحدى فردتي الحذاء. التصرف: ترك الثانية قرب الأولى. السبب: تحويل شيء فقده إلى نفع لشخص آخر. النتيجة: درس في حسن التصرف والإيثار.
أتدرب على ذكر البداية والوسط والنهاية في ثلاث جمل واضحة، وأستدل على الإجابة بحدث ورد في القصة بدل الاعتماد على التخمين. إذا لم أتذكر ترتيب الأحداث أرجع إلى الشرح وأعيد قراءته.

ثالثًا: أستمع وأوسع مفرداتي
عنوان الاستماع في دليل الكتاب لهذه الوحدة هو «الحسود والبخيل»، وله معنى يختلف عن قصة القراءة؛ لذلك لا أخلط بين شخصياته وأحداث حذاء الحكيم.
المفردات الأساسية: الحكيم: من يحسن التفكير واختيار التصرف؛ فردة الحذاء: قطعة واحدة من الزوج؛ انتفع: حصل على فائدة؛ الإيثار: تقديم نفع الآخرين حين نستطيع؛ تعجَّب: استغرب من الأمر.
أفسر كلمتين من سياقهما، ثم أضع إحداهما في جملة جديدة من إنشائي. أقرأ الجمل بصوت مفهوم وأقف عند علامة انتهاء الفكرة.

رابعًا: أفهم الموضوع اللغوي وأطبقه
أستخدم «هم» لمجموعة من الذكور أو مجموعة مختلطة في مثال مناسب: «هم مسافرون»، و«هن» لمجموعة من الإناث: «هن مسافرات». أميز التأنيث والتذكير في الوصف والجملة، وأنتبه إلى «ت» و«ة» و«ه» عند نهاية الكلمة في سياقها: «ذهبت»، «محطة»، «وجه».
أقارن المثالين وأشرح سبب التغيير في الكلمة، ثم أصوغ جملة جديدة صحيحة. أراجع كتابتي من اليمين إلى اليسار، وأنتبه إلى شكل الحرف أو الحركة قبل تسليم الجملة.

خامسًا: أفكر وأكتب وأتحدث
أسئلة فهم حقيقية من مضمون الدرس: لماذا كان الحكيم مستعجلًا؟ ما المشكلة التي حدثت عند القطار؟ لماذا ترك الحذاء الثاني؟ ما الذي سيتغير لو عثر شخص على فردة واحدة فقط؟ كيف يمكن أن نساعد غيرنا بأشياء لا نحتاج إليها؟
أعبر شفهيًا عن موقف مشابه بجملتين واضحتين، وأكتب خلاصة للدرس دون إعادة كتابة نص الكتاب؛ وأفصل بين رأيي والمعلومة التي أكدتها القصة. يمكن للمعلم توضيح الجزء الصعب بصورة أو بقراءة جملة مسموعة. يكون التقدير على فهم الموضوع والدليل لا على عدد الأنشطة.

[نهاية شرح ضاديوم لدرس الكتاب الفعلي]$subject1$,'["أن يلخص الطالب أحداث قصة «حذاء الحكيم» في ثلاث جمل مرتبة دون تغيير الشخصيات أو الحدث.","أن يفسر الطالب كلمتين من القصة ويجيب عن سؤالين بدليل من أحداثها.","أن يعلل الطالب تصرف الحكيم بوصفه إيثارًا، ويميز بين فعل نافع وآخر غير آمن."]'::jsonb);
CREATE TEMP TABLE ps_g3_generic(lesson_id uuid PRIMARY KEY,title text NOT NULL) ON COMMIT DROP;
INSERT INTO ps_g3_generic VALUES
('f97b1ba0-a323-4035-91a3-288cfbe9f738'::uuid,'الاستماع والتحدث — الفصل الأول'),
('011cdb18-ec52-4b1c-9501-60835e16d5c6'::uuid,'القراءة والفهم — الفصل الأول'),
('6d5ed515-27b3-4901-a16e-5ac65884b98d'::uuid,'النصوص والتذوق — الفصل الأول'),
('8ef85de4-700c-4e87-b15d-fd335f0454c1'::uuid,'النحو والبناء اللغوي — الفصل الأول'),
('5632ba54-7e29-4719-950c-762c052a1230'::uuid,'الإملاء والخط — الفصل الأول'),
('b77ae2f0-31d8-47e9-89ba-15cd1779795a'::uuid,'الكتابة والتعبير — الفصل الأول');
DO $guard$
DECLARE bad int;
BEGIN
 IF (SELECT count(*) FROM ps_g3_existing)<>13 OR (SELECT count(*) FROM ps_g3_missing)<>2
 OR (SELECT count(*) FROM ps_g3_generic)<>6 THEN RAISE EXCEPTION 'Expected 13 existing, 2 missing, 6 generic'; END IF;
 IF (SELECT count(DISTINCT n) FROM(SELECT new_order n FROM ps_g3_existing UNION ALL SELECT new_order FROM ps_g3_missing) v)<>15
 THEN RAISE EXCEPTION 'Duplicate book order'; END IF;
 SELECT count(*) INTO bad FROM (
 SELECT lesson_id,title,old_order FROM ps_g3_existing
 UNION ALL SELECT lesson_id,title,NULL::integer FROM ps_g3_generic
 ) x LEFT JOIN public.lessons l ON l.id=x.lesson_id
 LEFT JOIN public.units u ON u.id=l.unit_id LEFT JOIN public.grades g ON g.id=u.grade_id
 LEFT JOIN public.curricula cu ON cu.id=g.curriculum_id
 LEFT JOIN public.countries c ON c.id=cu.country_id
 WHERE l.id IS NULL OR l.title<>x.title OR l.status<>'published' OR l.semester<>1
 OR l.unit_id<>'5149edd7-6075-4840-b03b-bb8419b587e2'::uuid OR c.code<>'PS' OR g.grade_number<>3
 OR cu.academic_year<>'2026-2027' OR (x.old_order IS NOT NULL AND l.sort_order<>x.old_order)
 OR EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM public.question_attempts qa JOIN public.questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM public.lesson_activity_attempts aa JOIN public.lesson_activities a ON a.id=aa.activity_id WHERE a.lesson_id=l.id);
 IF bad<>0 THEN RAISE EXCEPTION 'Rollback: % unsafe existing lesson rows',bad; END IF;
 IF EXISTS(SELECT 1 FROM ps_g3_missing WHERE length(subject_body)<1800 OR jsonb_array_length(objectives)<>3)
 OR EXISTS(SELECT 1 FROM lessons WHERE unit_id='5149edd7-6075-4840-b03b-bb8419b587e2'::uuid AND (title IN(SELECT title FROM ps_g3_missing)
  OR sort_order BETWEEN 20 AND 34 AND id NOT IN(SELECT lesson_id FROM ps_g3_existing)))
 THEN RAISE EXCEPTION 'Rollback: pre-existing lessons or incomplete explanations'; END IF;
END $guard$;
UPDATE lessons l SET status='draft',updated_at=now() FROM ps_g3_generic g WHERE l.id=g.lesson_id;
UPDATE lessons l SET sort_order=x.new_order,source_pdf_url='https://elearn.azureedge.net/Books/c3/ar3-p1.pdf',
source_page_start=x.source_page,source_page_end=x.source_page_end,updated_at=now()
FROM ps_g3_existing x WHERE x.lesson_id=l.id;
INSERT INTO public.lessons(
 unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,content,learning_objectives,
 source_pdf_url,source_page_start,source_page_end,
 status,semester,is_free,estimated_minutes,official_content_scope)
SELECT '5149edd7-6075-4840-b03b-bb8419b587e2'::uuid,title,'ps-g3-p1-book-2020-p'||source_page,
NULL,new_order,'reading',
'درس موجود في فهرس كتاب «لغتنا الجميلة» الفلسطيني: شرح أحداثه ومعانيه والمهارات اللغوية المرتبطة به، بصياغة ضاديوم الأصلية.',
subject_body,objectives,'https://elearn.azureedge.net/Books/c3/ar3-p1.pdf',source_page,source_page_end,
'published',1,true,45,'official-book-unscheduled'
FROM ps_g3_missing;
DO $verify$
DECLARE n int;
BEGIN
 SELECT count(*) INTO n FROM ps_g3_existing x JOIN lessons l ON l.id=x.lesson_id
 WHERE l.sort_order=x.new_order AND l.status='published'
 AND l.source_pdf_url='https://elearn.azureedge.net/Books/c3/ar3-p1.pdf' AND l.source_page_start=x.source_page AND l.source_page_end=x.source_page_end;
 IF n<>13 THEN RAISE EXCEPTION 'Rollback existing 13, got %',n; END IF;
 SELECT count(*) INTO n FROM ps_g3_missing x JOIN lessons l ON l.unit_id='5149edd7-6075-4840-b03b-bb8419b587e2'::uuid AND l.title=x.title
 WHERE l.status='published' AND l.sort_order=x.new_order
 AND l.content LIKE '%[نهاية شرح ضاديوم لدرس الكتاب الفعلي]%' AND jsonb_array_length(l.learning_objectives)=3;
 IF n<>2 THEN RAISE EXCEPTION 'Rollback missing 2, got %',n; END IF;
 SELECT count(*) INTO n FROM ps_g3_generic x JOIN lessons l ON l.id=x.lesson_id WHERE l.status='draft';
 IF n<>6 THEN RAISE EXCEPTION 'Rollback generic 6, got %',n; END IF;
END $verify$;
COMMIT;
