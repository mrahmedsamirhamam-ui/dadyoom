-- DADYOOM | 2026-10-31 | 57 Palestinian published G1-3 lessons, zero existing activities.
-- 3 optional, source-grounded FORMATIVE activities per lesson; 171 total.
-- NO answer keys: answer = '{}' and points = 0. These are completion-only, not graded mastery.
-- No ministry syllabus certification, no prerecorded audio claim, no learner history changes.
-- Execute ONLY on the Dadyoom platform project (hvqsvtomhlxavmfqoxfz).
-- Atomic rollback on mismatched scope/count; DO NOT rerun after successful application.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

DO $safe_batch$
DECLARE
  candidate_count integer;
  inserted_count integer;
  invalid_count integer;
BEGIN
  SELECT count(*) INTO candidate_count
  FROM public.lessons l
  JOIN public.units u ON u.id=l.unit_id
  JOIN public.grades g ON g.id=u.grade_id
  JOIN public.curricula cu ON cu.id=g.curriculum_id
  JOIN public.countries c ON c.id=cu.country_id
  WHERE c.code='PS' AND g.grade_number BETWEEN 1 AND 3
    AND l.status='published'
    AND l.title IS NOT NULL AND length(l.content)>350
    AND jsonb_typeof(l.vocabulary)='array'
    AND jsonb_array_length(l.vocabulary)>=3
    AND (SELECT count(*) FROM public.questions q WHERE q.lesson_id=l.id)>=3
    AND NOT EXISTS (SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=l.id)
    AND NOT EXISTS (SELECT 1 FROM public.student_lesson_progress sp WHERE sp.lesson_id=l.id)
    AND NOT EXISTS (SELECT 1 FROM public.question_attempts qa JOIN public.questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id)
    AND NOT EXISTS (SELECT 1 FROM public.lesson_activity_attempts aa JOIN public.lesson_activities a ON a.id=aa.activity_id WHERE a.lesson_id=l.id);

  IF candidate_count <> 57 THEN
    RAISE EXCEPTION 'Expected 57 PS G1-3 unused published lessons with zero activities, got %', candidate_count;
  END IF;

  WITH candidates AS (
    SELECT l.id AS lesson_id, l.title, g.grade_number AS grade,
      l.vocabulary->0->>'word' AS w1,
      l.vocabulary->1->>'word' AS w2,
      l.vocabulary->2->>'word' AS w3,
      l.title LIKE 'حرف %' AS is_letter,
      trim(split_part(split_part(l.content,
        CASE
          WHEN strpos(l.content,'نقرأ ونفهم:')>0 THEN 'نقرأ ونفهم:'
          WHEN strpos(l.content,'أقرأ وأفهم:')>0 THEN 'أقرأ وأفهم:'
          WHEN strpos(l.content,'نص القراءة الأصلي:')>0 THEN 'نص القراءة الأصلي:'
          WHEN strpos(l.content,'أقرأ الموقف:')>0 THEN 'أقرأ الموقف:'
          WHEN strpos(l.content,'أقرأ وألاحظ:')>0 THEN 'أقرأ وألاحظ:'
          ELSE 'MISSING_SOURCE_HEADING'
        END,2), E'\n\n',1)) AS passage
    FROM public.lessons l
    JOIN public.units u ON u.id=l.unit_id
    JOIN public.grades g ON g.id=u.grade_id
    JOIN public.curricula cu ON cu.id=g.curriculum_id
    JOIN public.countries c ON c.id=cu.country_id
    WHERE c.code='PS' AND g.grade_number BETWEEN 1 AND 3
      AND l.status='published'
      AND length(l.content)>350 AND l.title IS NOT NULL
      AND jsonb_typeof(l.vocabulary)='array' AND jsonb_array_length(l.vocabulary)>=3
      AND (SELECT count(*) FROM public.questions q WHERE q.lesson_id=l.id)>=3
      AND NOT EXISTS (SELECT 1 FROM public.lesson_activities a WHERE a.lesson_id=l.id)
      AND NOT EXISTS (SELECT 1 FROM public.student_lesson_progress sp WHERE sp.lesson_id=l.id)
      AND NOT EXISTS (SELECT 1 FROM public.question_attempts qa JOIN public.questions q ON q.id=qa.question_id WHERE q.lesson_id=l.id)
      AND NOT EXISTS (SELECT 1 FROM public.lesson_activity_attempts aa JOIN public.lesson_activities a ON a.id=aa.activity_id WHERE a.lesson_id=l.id)
  )
  INSERT INTO public.lesson_activities
    (lesson_id,title,activity_type,instructions,content,activity_order,
     points,is_published,section,prompt,answer,is_required)
  SELECT p.lesson_id, v.title, v.activity_type,
         'إثراء أصلي اختياري بإشراف المعلم أو ولي الأمر؛ إتمام المهمة ليس حكمًا على الإتقان.',
         v.content, v.ord, 0, true, v.section, v.prompt, '{}'::jsonb, false
  FROM candidates p
  CROSS JOIN LATERAL (
    VALUES
      (1, 'listening', 'أستمع وألتقط الدليل', 'الاستماع',
        CASE WHEN p.is_letter
          THEN 'استمع إلى جملة «'||p.title||'» ثم سمّ الصوت الأول في «'||p.w1||'» و«'||p.w2||'».'
          ELSE 'استمع إلى النص الأصلي «'||p.title||'» وأخبر معلمك عن حدث واحد أو معلومة سمعتها.' END,
        jsonb_build_object(
          'origin','DADYOOM_PS_G123_57_ORIGINAL_FORMATIVE_20261031',
          'grade',p.grade,'requiresTeacherRead',true,'text',p.passage,
          'listeningQuestion',CASE WHEN p.is_letter
             THEN 'أي صوت تشترك فيه «'||p.w1||'» و«'||p.w2||'» في البداية؟'
             ELSE 'ما الحدث الذي تذكرته بعد الاستماع؟ ما دليلك؟' END)),
      (2, 'reading', 'أقرأ وأستدل من النص', 'القراءة',
        CASE WHEN p.is_letter
           THEN 'اقرأ الكلمات «'||p.w1||'»، «'||p.w2||'»، «'||p.w3||'» وحدد صوت الحرف الأول في كل كلمة.'
           ELSE 'اقرأ فقرة «'||p.title||'» وحدد جملة أو موقفًا يوضح معنى «'||p.w1||'» أو يرتبط بها.' END,
        jsonb_build_object(
          'origin','DADYOOM_PS_G123_57_ORIGINAL_FORMATIVE_20261031',
          'grade',p.grade,'originalText',p.passage,
          'examples',jsonb_build_array(p.w1,p.w2,p.w3))),
      (3,
        CASE WHEN p.is_letter THEN 'writing' ELSE 'speaking' END,
        CASE WHEN p.is_letter THEN 'أكتب حرفي وأستخدمه' ELSE 'أتحدث وأفسر الفكرة' END,
        CASE WHEN p.is_letter THEN 'الكتابة' ELSE 'التحدث' END,
        CASE WHEN p.is_letter
          THEN 'اكتب حرف البداية في كلمة «'||p.w1||'» بخط واضح، ثم اكتب كلمة ثانية من درس «'||p.title||'» في دفترك.'
          ELSE 'تحدث بجملتين عن «'||p.title||'»، واستخدم مفردتي «'||p.w1||'» و«'||p.w2||'» لتفسير فكرتك.' END,
        jsonb_build_object(
          'origin','DADYOOM_PS_G123_57_ORIGINAL_FORMATIVE_20261031',
          'grade',p.grade,'letter',left(p.w1,1),
          'examples',jsonb_build_array(p.w1,p.w2,p.w3),
          'assessment','teacher observation, completion only'))
  ) AS v(ord,activity_type,title,section,prompt,content)
  WHERE length(p.passage)>30
    AND length(coalesce(p.w1,''))>1
    AND length(coalesce(p.w2,''))>1
    AND length(coalesce(p.w3,''))>1;

  GET DIAGNOSTICS inserted_count=ROW_COUNT;
  IF inserted_count<>171 THEN
    RAISE EXCEPTION 'Atomic rollback: expected 171 non-graded original activities, inserted %', inserted_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM public.lesson_activities a
  WHERE a.content->>'origin'='DADYOOM_PS_G123_57_ORIGINAL_FORMATIVE_20261031'
    AND (a.answer <> '{}'::jsonb OR a.points<>0 OR a.is_required
      OR NOT a.is_published
      OR (a.activity_type='listening' AND length(a.content->>'text')<=30)
      OR (a.activity_type='reading' AND length(a.content->>'originalText')<=30));
  IF invalid_count<>0 THEN
    RAISE EXCEPTION 'Atomic rollback: % invalid formative records',invalid_count;
  END IF;

  RAISE NOTICE 'Inserted exactly 171 optional zero-key, zero-score activities across 57 PS G1-3 lessons';
END $safe_batch$;
COMMIT;
