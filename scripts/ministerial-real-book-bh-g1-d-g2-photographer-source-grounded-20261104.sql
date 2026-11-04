-- Confirmed 2026 Bahrain Ministry DIGITAL TEXTBOOK + teacher guide source-aligned subject gaps.
-- No Ministry copyrighted passage pasted. Correct lesson topic before older independent stories.
-- One-time production correction; source check by teacher remains required for image-only flipbook page matching.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
CREATE TEMP TABLE verified_teaching_topics (
 lesson_id uuid PRIMARY KEY,
 exact_title text NOT NULL, grade_number integer NOT NULL,
 previous_chars integer NOT NULL, code text NOT NULL,
 expected_existing_source_url text NOT NULL,
 verified_original_subject_summary text NOT NULL, new_learning_objectives jsonb NOT NULL
) ON COMMIT DROP;
INSERT INTO verified_teaching_topics VALUES
('0f24e423-0fcb-4101-a278-f29d36076a07'::uuid,'الدرس الرابع: حرف (د)',1,2927,'birthday','https://www.edunet.bh/e_content/level_1/stage_1/subject_ID_1/Part_1/e_books/Arabic-Baraem-G1-P1-2026/Arabic%20Baraem%20G1%20P1%202026/index.html',$lesson0$[ضاديوم — مقارنة مباشرة مع إرشادات وزارة التربية: حرف الدال، الاستماع «الاستعداد للاحتفال»]
هذا هو شرح الموضوع الرسمي كما تعرضه إرشادات الوزارة الإلكترونية، بصياغة ضاديوم التعليمية؛ ليس نسخًا حرفيًا لنص الكتاب. المصدر: https://www.edunet.bh/e_content/level_1/stage_1/subject_ID_1/Part_1/lessons/G1--Latter-D---alaistimae%281%29/G1--Latter-D---alaistimae%281%29.pdf
الكتاب الرقمي الرسمي المشار إليه في قاعدة ضاديوم: https://www.edunet.bh/e_content/level_1/stage_1/subject_ID_1/Part_1/e_books/Arabic-Baraem-G1-P1-2026/Arabic%20Baraem%20G1%20P1%202026/index.html
تنبيه دقة: جرى استخراج إرشادات المعلم وفحص أحداثها نصيًا. صفحات الكتاب المصوّرة ما زال يلزم التحقق البصري منها قبل الاعتماد النهائي.

ما موضوع الاستماع الحقيقي؟
يتناول النص استعداد بدر للاحتفال بعيد ميلاده السادس. يصحب والدته لشراء مستلزمات الاحتفال؛ يختار زينة من البالونات، وتختار والدته شرائط مناسبة، ثم يتوجهان إلى محل الحلويات لإعداد كعكة المناسبة. الشخصيتان الأساسيتان هنا بدر وأمه، وليس دانية ومعلمتها. أما قصة ضاديوم «لوحة دانية» أسفل الصفحة فهي إثراء مستقل عن مناسبة مدرسية، ولا تُستعمل للإجابة عن أسئلة النص الوزاري.

أولًا: أفهم الأحداث وأرتّبها
البداية: استعداد بدر للمناسبة والخروج مع أمه. الوسط: البحث عن زينة الاحتفال داخل متجر الألعاب. النهاية: الانتقال إلى محل الحلويات لطلب الكعكة. ألاحظ أن ذكر المكان وتسلسل الأحداث يساعدان على الفهم. أسرد هذه الخطوات بكلماتي، وأتجنب إضافة تفاصيل لم يذكرها المصدر.

ثانيًا: أجيب انطلاقًا من النص المقرر
من صاحب المناسبة؟ بدر. ما عمره في هذه المناسبة؟ ست سنوات. من رافقه؟ أمه. ما المكان الذي زاراه أولًا لشراء مستلزمات الاحتفال؟ متجر الألعاب. ماذا احتاجا بعد الزينة؟ إعداد كعكة من محل الحلويات. لا أخلط هذه الإجابات بأسئلة القصة الإثرائية الأخرى.

ثالثًا: أفهم الكلمات والأفكار
«الاستعداد» يعني تجهيز ما نحتاجه قبل الحدث. «الزينة» أشياء نستخدمها لتجميل المكان. «الاختيار المسؤول» أن أنتقي ما يناسب الغرض والميزانية والتوجيهات. وعند الذهاب للتسوق مع الأسرة أحترم قواعد السلامة، وأستمع إلى توجيهات الراشد.

رابعًا: حرف الدال في سياقه
أنطق «دَ، دِ، دُ»، ثم أميز «د» في أول «دُمى»، ووسط «مدرسة»، وآخر «عيد». ألاحظ أن حرف الدال لا يتصل بالحرف الذي يليه في الرسم العربي. أكتب الحرف في كلمات قصيرة بمساعدة المعلم، دون الخلط بين صوت الدال وبين تفاصيل قصة الاستماع.

خامسًا: تقويم موضوع الدرس
أطلب من المتعلم ترتيب ثلاث بطاقات تمثل: متجر الألعاب، اختيار الزينة، محل الحلويات. ثم أسأله أن يذكر شخصيتين أو شخصًا ومكانًا من النص، ويحدد حرف الدال في كلمة «عيد». ويمكن للمتقدم أن يشرح كيف نستعد لمناسبة أسرية بأدب ومسؤولية. لا يعتمد هذا التقويم على قصة ضاديوم الخيالية الأخرى.

[نهاية ملحق ضاديوم المصحَّح على مصدر الوزارة — الاستعداد للاحتفال]$lesson0$,'["أن يذكر الطالب شخصيتَي درس «الاستعداد للاحتفال» ومكانين من أحداثه بعد الاستماع إلى النص الوزاري.","أن يرتب الطالب ثلاثة أحداث من استعداد بدر للمناسبة بعباراته مع التمييز بين المصدر الرسمي والقصة الإثرائية.","أن يحدد الطالب موضع حرف «د» في ثلاث كلمات ويوضح سلوكًا مسؤولًا عند الاختيار."]'::jsonb),
('c7e36129-4923-4443-8681-9fb3ffd8e249'::uuid,'القراءة: الـمصوّر الصّغير براعم العربيّة',2,5063,'segments','https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf',$lesson1$[ضاديوم — مقارنة مباشرة مع إرشادات وزارة التربية: المصوّر الصغير، التحليل والتركيب]
مصدر أهداف مكوّن «أحلّل وأركّب وأتدرّب» في إرشادات الوزارة: https://www.edunet.bh/e_content/level_1/stage_2/subject_ID_1/Part_1/lessons/G2-L5-Wb-little-photographer-Ins/G2-L5-Wb-little-photographer-Ins.pdf
هذا شرح أصلي للمفاهيم الموجودة في الدليل، وليس نقلًا لتمارين الكتاب أو نص القراءة. جرت مراجعة ملف الإرشادات نصيًا، وتبقى مراجعة صفحات كتاب الطالب وتفاصيل جميع موضوعاته مطلوبة.

أولًا: أميز الكلمة داخل الجملة
الجملة تتكون من كلمات مرتبة تعطي معنى مفيدًا. مثال ضاديوم: «رسمت سارة صورة جميلة». أميز الكلمات الأربع: رسمت، سارة، صورة، جميلة. لا أحسب الحركة جزءًا مستقلًا ولا أقسم الكلمة إلى حروف عند عد كلمات الجملة.

ثانيًا: أفهم المقطع الصوتي والمد بالألف
المقطع جزء نسمعه عند نطق الكلمة بصورة متأنية. في المد بالألف يطول الصوت بعد الحرف المفتوح؛ مثل «با» في «باب»، و«سا» في «سالم». أقول الصوت القصير «بَ» ثم الطويل «با» وألاحظ الفرق. أتعرف المقطع الممدود في كلمة جديدة بمساعدة المعلم، وأربطه بنطق الكلمة الصحيح، لا بمجرد وجود الألف في أي موضع.

ثالثًا: أحلل كلمات ثم أركبها
أجزّئ الكلمة صوتيًا كما ينطقها المعلم، ثم أعيد تركيب المقاطع لتصبح كلمة مفهومة. للتوضيح: «كِـ / تَاب» يعاد تركيبها «كتاب»، و«دَ / را / جَة» تصبح «دراجة» مع مراعاة النطق الصحيح للحركات. أتحقق أن الكلمة الناتجة ذات معنى، ثم أضعها في جملة من إنشائي. ينتبه المعلم إلى الفرق بين المقطع الصوتي والحرف المكتوب.

رابعًا: أستعمل الضميرين «أنا» و«نحن»
«أنا» أتحدث به عن نفسي: «أنا أرسم صورة». «نحن» أتحدث به عن مجموعة أكون فردًا فيها: «نحن نرسم صورًا». ألاحظ التغير في الفعل من «أرسم» إلى «نرسم». أكون جملتين جديدتين، ثم أصحح جملة غير منسجمة مثل «نحن أرسم»، فالصحيح «نحن نرسم».

خامسًا: أطبق في فقرة مفيدة
أؤلف فقرة قصيرة جديدة: «أنا أحب التصوير. أحمل كاميرا مناسبة بإذن أسرتي. نحن نلتقط صورًا للطبيعة ونحافظ على المكان». أحدد ضميري المتكلم، ثم أختار كلمة أحللها إلى مقاطع مناسبة لمستواي وأعيد تركيبها. أراجع أن الفقرة مترابطة، وأن الأمثلة من تأليف ضاديوم لا من نص الكتاب المدرسي.

[نهاية ملحق ضاديوم المصحَّح على مصدر الوزارة — المصوّر الصغير]$lesson1$,'["أن يحلل الطالب جملة قصيرة إلى كلماتها ويميّز مقطعًا ممدودًا بالألف في كلمتين.","أن يعيد الطالب تركيب مقاطع صوتية لتكوين كلمتين مفيدتين، ثم يستخدم إحداهما في جملة.","أن يكوّن الطالب جملتين صحيحتين بالضميرين «أنا» و«نحن» ويتحقق من مطابقة الفعل للضمير."]'::jsonb);
DO $pre$
DECLARE wrong int;
BEGIN
 IF (SELECT count(*) FROM verified_teaching_topics)<>2 THEN
  RAISE EXCEPTION 'Expected two exact source-checked lessons';
 END IF;
 SELECT count(*) INTO wrong
 FROM verified_teaching_topics x
 LEFT JOIN public.lessons l ON l.id=x.lesson_id
 LEFT JOIN public.units u ON u.id=l.unit_id
 LEFT JOIN public.grades g ON g.id=u.grade_id
 LEFT JOIN public.curricula cu ON cu.id=g.curriculum_id
 LEFT JOIN public.countries c ON c.id=cu.country_id
 WHERE l.id IS NULL OR l.title<>x.exact_title OR c.code<>'BH'
 OR g.grade_number<>x.grade_number OR l.semester<>1 OR l.status<>'published'
 OR l.source_pdf_url<>x.expected_existing_source_url
 OR length(l.content)<>x.previous_chars
 OR l.content LIKE '%[ضاديوم — مقارنة مباشرة مع إرشادات وزارة التربية:%'
 OR jsonb_array_length(l.learning_objectives)<>3
 OR length(x.verified_original_subject_summary)<1450
 OR EXISTS(SELECT 1 FROM public.student_lesson_progress sp WHERE sp.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM public.question_attempts qa JOIN public.questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id)
 OR EXISTS(SELECT 1 FROM public.lesson_activity_attempts aa JOIN public.lesson_activities a ON a.id=aa.activity_id WHERE a.lesson_id=l.id);
 IF wrong<>0 THEN RAISE EXCEPTION 'Unsafe source/lesson/student history, % mismatches; rolling back',wrong; END IF;
END $pre$;
UPDATE public.lessons l
SET content=x.verified_original_subject_summary||E'\n\nــــــــــ\nالمادة الإثرائية المستقلة السابقة من ضاديوم (ليست النص الوزاري):\n\n'||l.content,
learning_objectives=x.new_learning_objectives,updated_at=now()
FROM verified_teaching_topics x WHERE x.lesson_id=l.id;
DO $post$
DECLARE n int;
BEGIN
 SELECT count(*) INTO n
 FROM verified_teaching_topics x JOIN public.lessons l ON l.id=x.lesson_id
 WHERE length(l.content)=x.previous_chars+length(x.verified_original_subject_summary)+length(E'\n\nــــــــــ\nالمادة الإثرائية المستقلة السابقة من ضاديوم (ليست النص الوزاري):\n\n')
 AND l.content LIKE '[ضاديوم — مقارنة مباشرة مع إرشادات وزارة التربية:%'
 AND l.content LIKE '%[نهاية ملحق ضاديوم المصحَّح على مصدر الوزارة%'
 AND l.content LIKE '%المادة الإثرائية المستقلة السابقة من ضاديوم%'
 AND l.learning_objectives=x.new_learning_objectives;
 IF n<>2 THEN RAISE EXCEPTION 'Rollback % / 2 lesson bodies updated',n; END IF;
END $post$;
COMMIT;
