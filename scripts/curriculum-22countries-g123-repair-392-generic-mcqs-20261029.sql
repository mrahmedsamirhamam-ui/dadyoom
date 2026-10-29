-- Dadyoom original supplementary curriculum: 22 countries x Grades 1-3.
-- Refines 392 NO-ATTEMPT generic MCQs in 196 existing lessons; does NOT certify official textbook alignment.
-- Entire operation atomic; aborts if any source exemplar, history, inventory, or keyed answer format drifts.
-- Every corrected question is lesson-example grounded, independently authored, grade-specific, and NOT a ministry quote.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE TEMP TABLE dadyoom_g123_repair_templates ON COMMIT DROP AS
SELECT title::text, grade::int, position::int, new_question::text,
 option_a::text, option_b::text, option_c::text, correct_answer::text,
 explanation::text
FROM (VALUES
  ('الجملة الفعلية البسيطة', 1, 1, 'أيّ جملة تبدأ بفعل، مثل المثال «زرعَ الطفلُ زهرةً»؟', 'سقى الفلاحُ الزرعَ.', 'الفلاحُ نشيطٌ.', 'الزهرةُ جميلةٌ.', 'a', 'تبدأ «سقى الفلاحُ الزرعَ» بالفعل «سقى»، ولذلك هي جملة فعلية.'),
  ('الجملة الفعلية البسيطة', 1, 2, 'في جملة «زرعَ الطفلُ زهرةً»، مَن الذي قام بالزرع؟', 'الزهرةُ', 'الطفلُ', 'الحديقةُ', 'b', 'الطفل هو من قام بفعل الزرع؛ نعرف الفاعل بالسؤال عمّن قام بالعمل.'),
  ('الجملة الفعلية البسيطة', 2, 1, 'رتّب «الفلاحُ، سقى، الزرعَ» في جملة فعلية صحيحة.', 'الفلاحُ الزرعَ سقى.', 'الزرعَ الفلاحُ سقى.', 'سقى الفلاحُ الزرعَ.', 'c', 'نبدأ بالفعل «سقى»، ثم نذكر الفاعل «الفلاحُ»، ثم «الزرعَ».'),
  ('الجملة الفعلية البسيطة', 2, 2, 'ما الفعل في المثال «زرعَ الطفلُ زهرةً»؟', 'زرعَ', 'الطفلُ', 'زهرةً', 'a', '«زرعَ» يدل على حدث وقع، أما الطفل فقام بالحدث والزهرة وقع عليها.'),
  ('الجملة الفعلية البسيطة', 3, 1, 'ما المفعول به في «زرعَ الطفلُ زهرةً»؟', 'الطفلُ', 'زهرةً', 'زرعَ', 'b', '«زهرةً» هي الشيء الذي وقع عليه فعل الزرع، فهي مفعول به.'),
  ('الجملة الفعلية البسيطة', 3, 2, 'لماذا تعدّ «سقى الفلاحُ الزرعَ» جملة فعلية؟', 'لأنها تبدأ باسم.', 'لأنها لا تحتوي فاعلًا.', 'لأنها تبدأ بالفعل «سقى» ويتبعه الفاعل.', 'c', 'الجملة الفعلية تبدأ بفعل، وفي المثال جاء «سقى» ثم «الفلاحُ».'),
  ('كتابة جملة واضحة', 1, 1, 'أيّ عبارة تعبّر عن معنى مكتمل؟', 'الطفلُ في', 'قرأَ الطفلُ كتابًا.', 'في المدرسةِ', 'b', '«قرأَ الطفلُ كتابًا.» جملة مكتملة المعنى، على عكس العبارة الناقصة «الطفلُ في».'),
  ('كتابة جملة واضحة', 1, 2, 'ما العلامة المناسبة لنهاية الجملة الخبرية «قرأَ الطفلُ كتابًا»؟', 'النقطة (.)', 'علامة الاستفهام (؟)', 'الفاصلة (،)', 'a', 'الجملة تخبر عن حدث وليست سؤالًا، لذا تُختَم بنقطة.'),
  ('كتابة جملة واضحة', 2, 1, 'ما الترتيب الذي يعطي جملة واضحة من «الزهرةَ / سقت / ليلى»؟', 'الزهرةَ ليلى سقت.', 'سقت الزهرةَ ليلى.', 'سقت ليلى الزهرةَ.', 'c', 'نرتب الكلمات لتصبح «سقت ليلى الزهرةَ.»، وهي جملة فعلية واضحة.'),
  ('كتابة جملة واضحة', 2, 2, 'لماذا لا تُعدّ «الطفلُ في» جملة مكتملة المعنى؟', 'لأنها تحتوي حرف جر.', 'لأن المعنى لم يكتمل بعد حرف الجر.', 'لأنها تبدأ باسم.', 'b', 'نحتاج كلمة تكمل معنى «في»، مثل «المدرسةِ»، حتى نفهم الجملة.'),
  ('كتابة جملة واضحة', 3, 1, 'أي جملة مكتوبة بترتيب واضح وعلامة وقف مناسبة؟', 'سقت ليلى الزهرةَ.', 'الزهرةَ سقت ليلى...', 'ليلى الزهرةَ سقت؟', 'a', 'الجملة الأولى تؤدي المعنى بترتيب واضح وتنتهي بنقطة مناسبة.'),
  ('كتابة جملة واضحة', 3, 2, 'أي كلمة تكمل «الطفلُ في ...» لتصبح جملة مفهومة؟', 'ثم', 'بِ', 'المدرسةِ.', 'c', '«الطفلُ في المدرسةِ.» تركيب مكتمل يبين مكان الطفل.'),
  ('مراجعة مهاراتي الأساسية', 1, 1, 'مَن الذي زرع الوردة في «زرعَ سامرٌ وردةً في الحديقة»؟', 'الحديقةُ', 'سامرٌ', 'الوردةُ', 'b', '«سامرٌ» هو الشخص الذي قام بعمل الزرع في المثال المقروء.'),
  ('مراجعة مهاراتي الأساسية', 1, 2, 'أيّ كلمة في المثال تبدأ بحرف الزاي؟', 'سامرٌ', 'وردةً', 'زرعَ', 'c', 'تبدأ كلمة «زرعَ» بحرف الزاي، ويمكن سماعه عند قراءة الكلمة.'),
  ('مراجعة مهاراتي الأساسية', 2, 1, 'أين زرع سامر الوردة حسب الجملة المقروءة؟', 'في الحديقةِ', 'في الصفِّ', 'في المكتبةِ', 'a', 'وردت عبارة «في الحديقة» لتحديد مكان زراعة الوردة في المثال.'),
  ('مراجعة مهاراتي الأساسية', 2, 2, 'ما الزوج الذي يضم الفعل والفاعل بالترتيب في «زرعَ سامرٌ وردةً»؟', 'سامرٌ ووردةً', 'زرعَ وسامرٌ', 'وردةً والحديقةِ', 'b', 'الفعل «زرعَ» ثم الفاعل «سامرٌ» الذي قام بالزرع.'),
  ('مراجعة مهاراتي الأساسية', 3, 1, 'ما العبارة التي تحدد مكان الحدث في «زرعَ سامرٌ وردةً في الحديقة»؟', 'سامرٌ وردةً', 'زرعَ سامرٌ', 'في الحديقةِ', 'c', 'شبه الجملة «في الحديقة» يحدد مكان وقوع الحدث.'),
  ('مراجعة مهاراتي الأساسية', 3, 2, 'أي جملة تعيد صياغة المثال دون تغيير معناه؟', 'غرس سامرٌ وردةً في الحديقة.', 'زرع سامر شجرةً في الصف.', 'قطف سامر وردةً من الحديقة.', 'a', '«غرس» قريب من «زرع»، وبقي الفاعل والمفعول والمكان كما في المثال.'),
  ('أدوات الاستفهام', 1, 1, 'أي أداة استفهام نسأل بها عن المكان في «... الحقيبة؟»؟', 'متى', 'أين', 'من', 'b', 'نسأل عن المكان بأداة الاستفهام «أين»، فنقول: «أين الحقيبة؟».'),
  ('أدوات الاستفهام', 1, 2, 'ما أداة السؤال المناسبة لإجابة «يوم الخميس»؟', 'متى', 'من', 'أين', 'a', 'الإجابة «يوم الخميس» تدل على زمن، ولذلك نسأل عنها بأداة «متى».')
) AS v(title,grade,position,new_question,option_a,option_b,option_c,correct_answer,explanation);

DO $repair$
DECLARE
  total_generic integer;
  matched integer;
  unsafe integer;
  updated integer;
  collision integer;
BEGIN
  IF (SELECT COUNT(*) FROM pg_temp.dadyoom_g123_repair_templates) <> 20 THEN
    RAISE EXCEPTION 'Expected exactly 20 skill/grade/position templates';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_temp.dadyoom_g123_repair_templates
    GROUP BY title,grade,position HAVING COUNT(*) <> 1) THEN
    RAISE EXCEPTION 'Duplicate curriculum question template';
  END IF;

  SELECT COUNT(*) INTO total_generic
  FROM public.questions q JOIN public.lessons l ON l.id=q.lesson_id
  JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
  WHERE l.status='published' AND g.grade_number BETWEEN 1 AND 3
    AND q.question IN ('ما المهارة الرئيسة التي يتدرب عليها هذا الدرس؟','كيف تتحقق من إتقان المهارة الأساسية في هذا الدرس؟');
  IF total_generic <> 392 THEN
    RAISE EXCEPTION 'Generic assessment inventory changed: % rather than 392',total_generic;
  END IF;

  SELECT COUNT(*) INTO matched
  FROM public.questions q JOIN public.lessons l ON l.id=q.lesson_id
  JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
  JOIN public.curricula c ON c.id=g.curriculum_id
  JOIN public.countries co ON co.id=c.country_id
  JOIN pg_temp.dadyoom_g123_repair_templates t
    ON t.title=l.title AND t.grade=g.grade_number
    AND q.question=(CASE WHEN t.position=1 THEN 'ما المهارة الرئيسة التي يتدرب عليها هذا الدرس؟' ELSE 'كيف تتحقق من إتقان المهارة الأساسية في هذا الدرس؟' END)
  WHERE l.status='published'
    AND (t.title <> 'أدوات الاستفهام' OR co.code='EG')
    AND CASE t.title
      WHEN 'الجملة الفعلية البسيطة'
        THEN l.content ILIKE '%زرعَ الطفلُ زهرةً%' AND l.content ILIKE '%الفلاحُ، سقى، الزرعَ%'
      WHEN 'كتابة جملة واضحة'
        THEN l.content ILIKE '%قرأَ الطفلُ كتابًا%' AND l.content ILIKE '%الزهرةَ / سقت / ليلى%'
      WHEN 'مراجعة مهاراتي الأساسية'
        THEN l.content ILIKE '%زرعَ سامرٌ وردةً%' AND l.content ILIKE '%تبدأ بزاي%'
      WHEN 'أدوات الاستفهام'
        THEN l.content ILIKE '%أين الحقيبة؟%' AND l.content ILIKE '%يوم الخميس%'
      ELSE false END;
  IF matched <> 392 THEN
    RAISE EXCEPTION 'Source-grounded target inventory mismatch: % of 392',matched;
  END IF;

  SELECT COUNT(*) INTO unsafe
  FROM public.questions q JOIN public.lessons l ON l.id=q.lesson_id
  JOIN public.units u ON u.id=l.unit_id JOIN public.grades g ON g.id=u.grade_id
  JOIN pg_temp.dadyoom_g123_repair_templates t ON t.title=l.title AND t.grade=g.grade_number
  WHERE l.status='published' AND q.question =
       CASE WHEN t.position=1 THEN 'ما المهارة الرئيسة التي يتدرب عليها هذا الدرس؟' ELSE 'كيف تتحقق من إتقان المهارة الأساسية في هذا الدرس؟' END
    AND (q.correct_answer<>'a' OR jsonb_typeof(q.options)<>'array'
         OR jsonb_array_length(q.options)<>3
         OR q.options->0->>'id'<>'a' OR q.options->1->>'id'<>'b'
         OR q.options->2->>'id'<>'c'
         OR EXISTS(SELECT 1 FROM public.question_attempts qa WHERE qa.question_id=q.id)
         OR EXISTS(SELECT 1 FROM public.student_lesson_progress sp WHERE sp.lesson_id=l.id));
  IF unsafe <> 0 THEN
    RAISE EXCEPTION 'Question attempt, progress, key or options changed in % rows',unsafe;
  END IF;

  SELECT COUNT(*) INTO collision FROM pg_temp.dadyoom_g123_repair_templates t
    WHERE t.new_question IN (SELECT q.question FROM public.questions q);
  IF collision > 0 THEN
    RAISE EXCEPTION 'New question text already present in % templates',collision;
  END IF;

  UPDATE public.questions q
  SET question=t.new_question,
      options=jsonb_build_array(
        jsonb_build_object('id','a','text',t.option_a),
        jsonb_build_object('id','b','text',t.option_b),
        jsonb_build_object('id','c','text',t.option_c)),
      correct_answer=t.correct_answer,
      explanation=t.explanation,
      updated_at=now()
  FROM public.lessons l
  JOIN public.units u ON u.id=l.unit_id
  JOIN public.grades g ON g.id=u.grade_id
  JOIN public.curricula c ON c.id=g.curriculum_id
  JOIN public.countries co ON co.id=c.country_id
  JOIN pg_temp.dadyoom_g123_repair_templates t ON t.title=l.title AND t.grade=g.grade_number
  WHERE q.lesson_id=l.id AND l.status='published'
    AND q.question=(CASE WHEN t.position=1 THEN 'ما المهارة الرئيسة التي يتدرب عليها هذا الدرس؟' ELSE 'كيف تتحقق من إتقان المهارة الأساسية في هذا الدرس؟' END)
    AND (t.title<>'أدوات الاستفهام' OR co.code='EG')
    AND CASE t.title
      WHEN 'الجملة الفعلية البسيطة'
        THEN l.content ILIKE '%زرعَ الطفلُ زهرةً%' AND l.content ILIKE '%الفلاحُ، سقى، الزرعَ%'
      WHEN 'كتابة جملة واضحة'
        THEN l.content ILIKE '%قرأَ الطفلُ كتابًا%' AND l.content ILIKE '%الزهرةَ / سقت / ليلى%'
      WHEN 'مراجعة مهاراتي الأساسية'
        THEN l.content ILIKE '%زرعَ سامرٌ وردةً%' AND l.content ILIKE '%تبدأ بزاي%'
      WHEN 'أدوات الاستفهام'
        THEN l.content ILIKE '%أين الحقيبة؟%' AND l.content ILIKE '%يوم الخميس%'
      ELSE false END
    AND NOT EXISTS (SELECT 1 FROM public.question_attempts qa WHERE qa.question_id=q.id)
    AND NOT EXISTS (SELECT 1 FROM public.student_lesson_progress sp WHERE sp.lesson_id=l.id);
  GET DIAGNOSTICS updated=ROW_COUNT;
  IF updated <> 392 THEN
    RAISE EXCEPTION 'Atomic rollback: changed % rather than 392',updated;
  END IF;
  RAISE NOTICE 'DADYOOM_G123_SOURCE_GROUNDED_GENERIC_MCQ_REPAIRS=%',updated;
END
$repair$;
COMMIT;
-- Verify separately with a read-only SELECT; keep all official-syllabus and human review gates closed.
