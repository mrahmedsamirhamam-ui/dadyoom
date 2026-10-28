-- 2026-10-28 Dadyoom: read-only answer visibility audit
-- No answer text, student IDs, student attempts, or private note contents
-- are selected. Run against the linked production project after imports.
SELECT
  (SELECT count(*) FROM public.lessons WHERE status='published') AS published_lessons,
  (SELECT count(*) FROM public.questions) AS question_rows,
  (SELECT count(*) FROM public.lesson_teacher_notes) AS private_teacher_assessment_notes,
  (SELECT count(DISTINCT lesson_id) FROM public.lesson_teacher_notes) AS lessons_with_private_notes,
  (SELECT count(*) FROM public.lessons WHERE status='published'
    AND content ~ ('(^|'||chr(10)||')[[:space:]]*(مفتاح الإجابة:|مفتاح المراجعة الذاتية:|مفتاح المراجعة ومؤشرات الاستجابة الصحيحة:|مفتاح المراجعة:|الإجابة النموذجية:)')
  ) AS published_explicit_answer_key_violations,
  (SELECT count(*) FROM public.lessons WHERE status='published'
    AND content LIKE '%مفتاح المراجعة.%'
  ) AS remaining_non_answer_headings,
  (SELECT COUNT(*) FROM pg_constraint
    WHERE conrelid='public.lessons'::regclass
      AND conname='lessons_published_content_no_labelled_answer_keys'
      AND convalidated = true
  ) AS valid_publication_constraints,
  (SELECT COUNT(*) FROM pg_policies
    WHERE schemaname='public' AND tablename='lesson_teacher_notes'
      AND cmd='SELECT' AND qual NOT IN ('true','(true)')
  ) AS nontrivial_note_read_policies;
