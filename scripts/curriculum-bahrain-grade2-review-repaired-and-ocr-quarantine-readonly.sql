-- Bahrain Grade-2 first-term review QA (2026-27), read-only.
-- Nine new original revision lessons plus five draft-quarantined OCR duplicate IDs.
-- All lesson, question and activity IDs remain unchanged. No answer values are returned.
WITH repaired(id) AS (VALUES
 ('39bb7f33-1c1c-4bb6-8a8a-1dbef196010b'::uuid),
 ('585f530b-2893-49e0-90ec-6a4e6a797fa2'::uuid),
 ('8de1ef4f-818f-4e4d-ac8e-d8fcf5139081'::uuid),
 ('b3c9f3a5-da54-42cf-9978-801553cc4399'::uuid),
 ('a31947eb-a0bf-4236-9b79-f1b57ba7152c'::uuid),
 ('fc0d54ea-ce57-4ab3-ac37-b50cb980c651'::uuid),
 ('96f268d6-b9f5-4243-b7dc-540b9ba377bd'::uuid),
 ('d5039c94-4b90-4167-8b18-1f46dc62f0f6'::uuid),
 ('a3851ba2-d2ed-4167-aa44-470d93192039'::uuid)
), quarantined(id) AS (VALUES
 ('abf5e6fa-8e13-4668-85b3-ce7ef27b26e0'::uuid),
 ('a828dce7-aea3-4d61-b885-f26f249be942'::uuid),
 ('025822f8-ee2c-4ac5-aed9-2de5f4f4127b'::uuid),
 ('dadb9978-8770-4071-b54f-a6eb91d77fe7'::uuid),
 ('b6fc329a-39ba-435d-88be-46e7a2d31f1b'::uuid)
)
SELECT
 (SELECT count(*) FROM public.lessons l JOIN repaired r ON r.id=l.id
  WHERE l.status='published' AND l.content LIKE 'ضاديوم — مراجعة أصلية للصف الثاني بالبحرين%') repaired_published_lessons,
 (SELECT count(*) FROM public.questions q JOIN repaired r ON r.id=q.lesson_id) repaired_question_count,
 (SELECT count(*) FROM public.questions q JOIN repaired r ON r.id=q.lesson_id WHERE EXISTS(
   SELECT 1 FROM jsonb_array_elements(q.options) x WHERE x->>'id'=q.correct_answer
 )) repaired_valid_key_references,
 (SELECT count(*) FROM public.lesson_activities a JOIN repaired r ON r.id=a.lesson_id
   WHERE a.is_published AND a.content->>'origin'='DADYOOM_BH_G2_ORIGINAL_REVIEW_20261028') revised_published_activities,
 (SELECT count(*) FROM public.lesson_activities a JOIN repaired r ON r.id=a.lesson_id
  WHERE a.is_published AND public.dadyoom_published_activity_content_safe(a.content)) safe_published_activities,
 (SELECT count(*) FROM public.lessons l JOIN quarantined d ON d.id=l.id
   WHERE l.status='draft' AND l.content LIKE 'يتناول هذا الدرس موضوع%') quarantined_draft_lessons,
 (SELECT count(*) FROM public.lesson_activities a JOIN quarantined d ON d.id=a.lesson_id WHERE a.is_published) quarantined_still_exposed_activities,
 (SELECT count(*) FROM public.lesson_activities a JOIN quarantined d ON d.id=a.lesson_id) quarantined_retained_activities,
 (SELECT count(*) FROM public.questions q JOIN quarantined d ON d.id=q.lesson_id) quarantined_retained_questions,
 (SELECT count(*) FROM public.student_lesson_progress p
  WHERE p.lesson_id IN (SELECT id FROM repaired UNION ALL SELECT id FROM quarantined)) recorded_progress,
 (SELECT count(*) FROM public.question_attempts qa JOIN public.questions q ON q.id=qa.question_id
  WHERE q.lesson_id IN (SELECT id FROM repaired UNION ALL SELECT id FROM quarantined)) question_attempts,
 (SELECT count(*) FROM public.lesson_activity_attempts at JOIN public.lesson_activities a ON a.id=at.activity_id
  WHERE a.lesson_id IN (SELECT id FROM repaired UNION ALL SELECT id FROM quarantined)) activity_attempts;
