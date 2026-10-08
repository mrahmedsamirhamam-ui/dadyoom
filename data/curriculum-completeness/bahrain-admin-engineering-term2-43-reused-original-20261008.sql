-- Dadyoom original supplementary teaching materials reused only where official imported
-- grade/title matches another Dadyoom supplementary lesson in a parallel Bahraini track.
-- Does not assert official-text equivalence or duplicate copyrighted ministry book material.
-- Scope: Bahrain admin/technology-engineering curriculum T2, grades 10-12; 43 placeholders.
-- Idempotent: retain existing title, source/provenance placeholder, student data and assessment attempts.
DO $dadyoom$
DECLARE
  rec record;
  source_mcq public.lesson_activities%ROWTYPE;
  source_writing public.lesson_activities%ROWTYPE;
  current_content text;
  options jsonb;
  question_content jsonb;
  reuse_marker constant text := 'DADYOOM_BH_ADMIN_ENG_T2_REUSED_ORIGINAL_43_20261008';
  total_matches integer;
  processed integer := 0;
BEGIN
  SELECT count(*) INTO total_matches
  FROM public.lessons l
  JOIN public.units u ON u.id = l.unit_id AND u.semester = 2
  JOIN public.grades g ON g.id = u.grade_id AND g.grade_number BETWEEN 10 AND 12
  JOIN public.curricula cu ON cu.id = g.curriculum_id AND cu.id = 'be64f476-7f4c-480b-ad31-14184d6c6e69'::uuid
  JOIN LATERAL (
    SELECT l2.id
    FROM public.lessons l2
    JOIN public.units u2 ON u2.id = l2.unit_id AND u2.semester = 2
    JOIN public.grades g2 ON g2.id = u2.grade_id
    WHERE g2.curriculum_id = 'e15ed6fd-370c-4980-b724-d0c19ec2c029'::uuid
      AND g2.grade_number = g.grade_number
      AND l2.title = l.title AND l2.status = 'published'
      AND char_length(coalesce(l2.content, '')) >= 500
    ORDER BY l2.sort_order, l2.id
    LIMIT 1
  ) src ON true
  WHERE l.status = 'published';
  IF total_matches <> 43 THEN
    RAISE EXCEPTION 'DADYOOM_BH_ADMIN_T2_MATCH_COUNT_MISMATCH: found %, expected 43', total_matches;
  END IF;

  FOR rec IN
    SELECT l.id target_id, l.title, l.sort_order, g.grade_number,
           src.id source_id, src.content source_content
    FROM public.lessons l
    JOIN public.units u ON u.id = l.unit_id AND u.semester = 2
    JOIN public.grades g ON g.id = u.grade_id AND g.grade_number BETWEEN 10 AND 12
    JOIN public.curricula cu ON cu.id = g.curriculum_id AND cu.id = 'be64f476-7f4c-480b-ad31-14184d6c6e69'::uuid
    JOIN LATERAL (
      SELECT l2.id, l2.content
      FROM public.lessons l2
      JOIN public.units u2 ON u2.id = l2.unit_id AND u2.semester = 2
      JOIN public.grades g2 ON g2.id = u2.grade_id
      WHERE g2.curriculum_id = 'e15ed6fd-370c-4980-b724-d0c19ec2c029'::uuid
        AND g2.grade_number = g.grade_number
        AND l2.title = l.title AND l2.status = 'published'
        AND char_length(coalesce(l2.content, '')) >= 500
      ORDER BY l2.sort_order, l2.id LIMIT 1
    ) src ON true
    WHERE l.status = 'published'
    ORDER BY g.grade_number, l.sort_order
  LOOP
    SELECT content INTO STRICT current_content
    FROM public.lessons WHERE id = rec.target_id FOR UPDATE;
    IF char_length(coalesce(current_content, '')) < 350 THEN
      UPDATE public.lessons
      SET content =
        'ضاديوم — إثراء تعليمي أصلي معاد توظيفه لمسار البحرين الإداري والتكنولوجي - الهندسي، الفصل الثاني، الصف '
        || rec.grade_number::text || '. لا يتضمن النص الوزاري ولا يثبت تطابق المصدرين.' || E'\n\n'
        || 'عنوان المهارة المعتمد في فهرس هذا المسار: ' || rec.title || E'\n\n'
        || rec.source_content || E'\n\n'
        || 'التطبيق المهني: وظّف مهارة الدرس في كتابة مذكرة أو عرض شفوي أو تفسير لغوي متعلق بموقف إداري أو تكنولوجي أو هندسي. '
        || 'قدم مثالًا مستقلًا، وحدد دليلك، وراجع الخصوصية والدقة عند استخدام أدوات رقمية.' || E'\n\n'
        || 'التمايز: بطاقة إرشادية للمبتدئ، مهمة تطبيقية للمستوى المتوقع، ونقد بديلين للمتقدم.' || E'\n\n'
        || 'ملاحظة السجل المستورد قبل الإثراء: ' || coalesce(current_content, ''),
        updated_at = now()
      WHERE id = rec.target_id AND status = 'published';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.lessons
      WHERE id = rec.target_id
        AND content LIKE 'ضاديوم — إثراء تعليمي أصلي معاد توظيفه لمسار البحرين الإداري%'
    ) THEN
      CONTINUE;
    END IF;

    SELECT * INTO source_mcq
    FROM public.lesson_activities
    WHERE lesson_id = rec.source_id AND activity_type = 'multiple_choice'
      AND content->>'notOfficialBook' = 'true'
      AND is_published = true
    ORDER BY activity_order, id LIMIT 1;

    SELECT * INTO source_writing
    FROM public.lesson_activities
    WHERE lesson_id = rec.source_id AND activity_type = 'writing'
      AND content->>'humanReviewRequired' = 'true'
      AND is_published = true
    ORDER BY activity_order, id LIMIT 1;

    IF source_mcq.id IS NULL OR source_writing.id IS NULL
       OR jsonb_array_length(source_mcq.content->'options') <> 4 THEN
      RAISE EXCEPTION 'DADYOOM_ADMIN_T2_MISSING_ORIGINAL_ASSESSMENTS at %', rec.target_id;
    END IF;
    options := source_mcq.content->'options';
    question_content := jsonb_set(
      source_mcq.content || jsonb_build_object(
        'origin', reuse_marker, 'notOfficialBook', true, 'ocrReview', 'pending',
        'reusedFromDadyoomOriginal', true, 'sourceLessonId', rec.source_id::text,
        'track', 'administrative_technology_engineering'
      ), '{options}',
      CASE (rec.sort_order % 4)
        WHEN 0 THEN options
        WHEN 1 THEN jsonb_build_array(options->1,options->2,options->3,options->0)
        WHEN 2 THEN jsonb_build_array(options->2,options->3,options->0,options->1)
        ELSE jsonb_build_array(options->3,options->0,options->1,options->2)
      END
    );

    INSERT INTO public.lesson_activities
      (lesson_id,title,activity_type,section,prompt,content,answer,
       activity_order,points,is_required,is_published)
    SELECT rec.target_id, 'فهم النص الإثرائي — المسار الإداري والهندسي',
      'multiple_choice','assessment', source_mcq.prompt, question_content,
      source_mcq.answer,
      coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=rec.target_id),0)+1,
      5,true,true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.lesson_activities WHERE lesson_id=rec.target_id
        AND activity_type='multiple_choice' AND content->>'origin'=reuse_marker
    );

    INSERT INTO public.lesson_activities
      (lesson_id,title,activity_type,section,prompt,content,answer,
       activity_order,points,is_required,is_published)
    SELECT rec.target_id, 'كتابة تطبيقية — مراجعة المعلم',
      'writing','practice',
      'في سياق الإدارة والتكنولوجيا والهندسة: ' || source_writing.prompt,
      source_writing.content || jsonb_build_object(
        'origin',reuse_marker,'notOfficialBook',true,'humanReviewRequired',true,
        'skillQualityAutoVerified',false,'reusedFromDadyoomOriginal',true,
        'sourceLessonId',rec.source_id::text, 'track','administrative_technology_engineering',
        'text','في سياق الإدارة والتكنولوجيا والهندسة: ' || source_writing.prompt
      ),
      source_writing.answer,
      coalesce((SELECT max(activity_order) FROM public.lesson_activities WHERE lesson_id=rec.target_id),0)+1,
      5,true,true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.lesson_activities WHERE lesson_id=rec.target_id
        AND activity_type='writing' AND content->>'origin'=reuse_marker
    );
    processed := processed + 1;
  END LOOP;
  IF processed <> 43 THEN
    RAISE EXCEPTION 'DADYOOM_ADMIN_T2_PROCESS_MISMATCH: %',processed;
  END IF;
END
$dadyoom$;