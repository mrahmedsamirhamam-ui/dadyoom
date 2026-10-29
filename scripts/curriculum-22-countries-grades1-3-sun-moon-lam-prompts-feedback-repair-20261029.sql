-- DADYOOM Sun/Moon lam 22x3 original activity prompts and pedagogical feedback.
-- Single-use, production guarded: preserves UUIDs, answer keys, options, attempts, lesson text, status.
-- No grades or student rows are touched. Requires EXACT current template fingerprint.
-- Not evidence of ministerial syllabus alignment. Run only after independent access review.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';
DO $repair$
DECLARE
  n integer;
  target_count integer;
BEGIN
  SELECT count(*) INTO target_count
  FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
  JOIN public.grades g ON g.id=u.grade_id
  WHERE l.title='اللام الشمسية والقمرية' AND g.grade_number BETWEEN 1 AND 3 AND l.status='published';
  IF target_count <> 66 THEN RAISE EXCEPTION 'Expected exactly 66 published target lessons; got %',target_count; END IF;
  IF (SELECT count(DISTINCT co.code)
      FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
      JOIN public.grades g ON g.id=u.grade_id JOIN public.curricula cu ON cu.id=g.curriculum_id
      JOIN public.countries co ON co.id=cu.country_id
      WHERE l.title='اللام الشمسية والقمرية' AND g.grade_number BETWEEN 1 AND 3) <> 22
    THEN RAISE EXCEPTION 'Country coverage has changed'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id
    WHERE l.title='اللام الشمسية والقمرية' AND g.grade_number BETWEEN 1 AND 3
      AND ((SELECT count(*) FROM public.questions q WHERE q.lesson_id=l.id)<>5
      OR (SELECT count(*) FROM public.lesson_activities a WHERE a.lesson_id=l.id)<>3
      OR jsonb_array_length(l.learning_objectives)<>3)
  ) THEN RAISE EXCEPTION 'Per-lesson content counts changed'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.lessons l
    WHERE l.title='اللام الشمسية والقمرية' AND
      (EXISTS(SELECT 1 FROM public.student_lesson_progress p WHERE p.lesson_id=l.id)
      OR EXISTS(SELECT 1 FROM public.lesson_mastery m WHERE m.lesson_id=l.id)
      OR EXISTS(SELECT 1 FROM public.questions q JOIN public.question_attempts qa ON qa.question_id=q.id WHERE q.lesson_id=l.id)
      OR EXISTS(SELECT 1 FROM public.questions q JOIN public.student_answers sa ON sa.question_id=q.id WHERE q.lesson_id=l.id)
      OR EXISTS(SELECT 1 FROM public.lesson_activities a JOIN public.lesson_activity_attempts aa ON aa.activity_id=a.id WHERE a.lesson_id=l.id))
  ) THEN RAISE EXCEPTION 'Learner work exists: stop, do not rewrite'; END IF;
  IF (SELECT count(*) FROM public.lesson_activities a JOIN public.lessons l ON l.id=a.lesson_id
      WHERE l.title='اللام الشمسية والقمرية' AND
        (a.prompt LIKE 'ما المهارة الرئيسة%' OR a.prompt LIKE 'أي اختيار يطبّق ما تعلمته%' OR a.prompt LIKE 'طبّق «التمييز%'))<>198
    THEN RAISE EXCEPTION 'Unexpected activity prompt fingerprint'; END IF;
  IF (SELECT count(*) FROM public.questions q JOIN public.lessons l ON l.id=q.lesson_id
      WHERE l.title='اللام الشمسية والقمرية' AND q.explanation
       LIKE 'المثال «%» يطابق قاعدة اللام الشمسية أو القمرية المشروحة مع الدرس.')<>330
    THEN RAISE EXCEPTION 'Unexpected explanation fingerprint'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.questions q JOIN public.lessons l ON l.id=q.lesson_id
    WHERE l.title='اللام الشمسية والقمرية'
      AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(q.options) op WHERE op->>'id'=q.correct_answer)
  ) THEN RAISE EXCEPTION 'Invalid current answer-option reference'; END IF;
  UPDATE public.lesson_activities a
  SET prompt=CASE
    WHEN a.activity_order=3 AND g.grade_number=1
       THEN a.instructions || E'\n' || 'بعد القراءة، اختر كلمة شمسية وكلمة قمرية جديدتين، وانطق كلتيهما داخل جملة قصيرة بمساعدة زميلك.'
    WHEN a.activity_order=3 AND g.grade_number=2
       THEN a.instructions || E'\n' || 'كوّن جملتين قصيرتين من إنشائك: إحداهما تتضمن كلمة شمسية والأخرى كلمة قمرية، ثم اقرأهما لزميلك.'
    WHEN a.activity_order=3 AND g.grade_number=3
       THEN a.instructions || E'\n' || 'اكتب جملة من إنشائك تضم كلمة شمسية وأخرى قمرية، وفسّر شفهيًا سبب إدغام اللام في الأولى وإظهارها في الثانية.'
    ELSE a.instructions END,
    updated_at=now()
  FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
  JOIN public.grades g ON g.id=u.grade_id
  WHERE a.lesson_id=l.id AND l.title='اللام الشمسية والقمرية'
    AND g.grade_number BETWEEN 1 AND 3
    AND (a.prompt LIKE 'ما المهارة الرئيسة%' OR a.prompt LIKE 'أي اختيار يطبّق ما تعلمته%' OR a.prompt LIKE 'طبّق «التمييز%');
  GET DIAGNOSTICS n=ROW_COUNT;
  IF n<>198 THEN RAISE EXCEPTION 'Activity updates mismatch: %',n; END IF;
  UPDATE public.questions q
  SET explanation=CASE
    WHEN g.grade_number=1 AND q.question_order=1
      THEN 'نكتب لام «الـ» دائمًا، لكننا لا ننطقها مستقلة قبل الحرف الشمسي؛ ونلاحظ الشدة على الحرف التالي.'
    WHEN g.grade_number=1 AND q.question_order=2
      THEN 'مع الحرف القمري نسمع صوت لام «الـ» واضحًا؛ لذلك نميّز هذه الكلمة عن الكلمات ذات اللام الشمسية.'
    WHEN g.grade_number=1 AND q.question_order=3
      THEN 'الحرف الذي يأتي بعد لام التعريف شمسي؛ لذلك تدغم اللام فيه وينطق الحرف مشددًا، مع بقاء اللام مكتوبة.'
    WHEN g.grade_number=1 AND q.question_order=4
      THEN 'في الكلمتين القمريتين نسمع لام التعريف قبل الحرف التالي، ولا ندغمها فيه.'
    WHEN g.grade_number=1 AND q.question_order=5
      THEN 'في الكلمتين الشمسيتين لا نسمع لام التعريف منفصلة، ونلفظ الحرف التالي مشددًا.'
    WHEN g.grade_number=2 AND q.question_order=1
      THEN 'الحرف التالي لـ«الـ» في المثال حرف شمسي؛ لذلك تدغم فيه اللام وتظهر الشدة على الحرف في القراءة المضبوطة.'
    WHEN g.grade_number=2 AND q.question_order=2
      THEN 'الحرف التالي لـ«الـ» في المثال حرف قمري؛ لذلك نظهر صوت اللام قبل النطق به.'
    WHEN g.grade_number=2 AND q.question_order=3
      THEN 'نسمع اللام بوضوح في الاسم المبدوء بـ«الـ» إذا جاء بعدها حرف قمري.'
    WHEN g.grade_number=2 AND q.question_order=4
      THEN 'الإدغام يعني أن اللام الشمسية لا تُنطق منفردة؛ ويُنطق الحرف الشمسي التالي مشددًا.'
    WHEN g.grade_number=2 AND q.question_order=5
      THEN 'الكلمة الشمسية تُدغم فيها اللام في الحرف التالي؛ أما الكلمة القمرية فتُظهر اللام عند القراءة، وكلتاهما تُكتب باللام.'
    WHEN g.grade_number=3 AND q.question_order=1
      THEN 'سبب الإدغام هو وقوع حرف شمسي بعد لام التعريف، فتُكتب اللام لكن يندمج صوتها في الحرف التالي المشدد.'
    WHEN g.grade_number=3 AND q.question_order=2
      THEN 'الدليل الصوتي هو ظهور اللام عند القراءة قبل الحرف القمري؛ فلا تُدغم في الحرف التالي.'
    WHEN g.grade_number=3 AND q.question_order=3
      THEN 'وجود حرف شمسي مباشرةً بعد «الـ» يقتضي إدغام صوت اللام، ويُضبط الحرف الشمسي بالشدة.'
    WHEN g.grade_number=3 AND q.question_order=4
      THEN 'لام التعريف القمرية ظاهرة في النطق والكتابة؛ لذلك نسمعها قبل الحرف القمري التالي.'
    WHEN g.grade_number=3 AND q.question_order=5
      THEN 'القاعدة المشتركة في الكتابة هي إثبات «الـ»؛ والاختلاف في الصوت: إدغام اللام قبل الشمسي وإظهارها قبل القمري.'
    ELSE q.explanation END,
    updated_at=now()
  FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
  JOIN public.grades g ON g.id=u.grade_id
  WHERE q.lesson_id=l.id AND l.title='اللام الشمسية والقمرية'
    AND g.grade_number BETWEEN 1 AND 3
    AND q.explanation LIKE 'المثال «%» يطابق قاعدة اللام الشمسية أو القمرية المشروحة مع الدرس.';
  GET DIAGNOSTICS n=ROW_COUNT;
  IF n<>330 THEN RAISE EXCEPTION 'Explanation updates mismatch: %',n; END IF;
END
$repair$;
COMMIT;
-- Rollback procedure: only from a verified pre-change backup and under identical
-- no-attempt guards; NEVER overwrite teacher edits or recreate old generic content.
