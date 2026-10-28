-- READ ONLY: verify the 2026-10-28 reversible quarantine of 26 unused
-- Bahrain G2/G3 OCR-derived generic reading scaffolds and their 78 activities.
-- Lessons and questions must remain in the database; never delete them.
-- Source of exact UUIDs: data/curriculum-audits/bahrain-grade2-3-ocr-scaffolds-quarantine-20261028.json
WITH target(id) AS (
 VALUES
  '654718af-c44e-46fc-ba72-b5197db5c37d'::uuid,,
  'adfd0323-749f-4cf0-b750-3a302d638410'::uuid,,
  '6e4d93d6-a643-4a6b-beee-13029bbc9c2e'::uuid,,
  'd2ab86c4-0dcb-43c3-83b3-b6f37dfe1192'::uuid,,
  'ff429925-5b12-45fd-a70d-bcca4e44161b'::uuid,,
  '3aef6a6f-07e1-441c-aa6b-cdafbc892e12'::uuid,,
  'd7d90bfc-6735-4af2-83bd-46531e156792'::uuid,,
  'a23ac0b0-dd0d-4d14-b409-016a1875e759'::uuid,,
  '95aeda04-ecfd-4a69-92f1-f04b69344486'::uuid,,
  '5dc5ce0d-4b13-4225-971a-a219d6b6623d'::uuid,,
  'a4daa277-e13e-4831-9f4f-83c375df4519'::uuid,,
  '4d8e8581-ad50-4104-87ac-9d8ea863d474'::uuid,,
  'a56e2d49-0730-4761-b7c3-7bcca8657db3'::uuid,,
  'c6be603c-f937-42f7-b62b-b91ea0ca6ec2'::uuid,,
  '71fe9d64-cf0e-4d8e-86cc-5ca300311025'::uuid,,
  '6655c117-38ba-4aa8-ba52-3344fb82bfe4'::uuid,,
  'bcd56434-2259-446b-b304-3823b8a24599'::uuid,,
  '4b1e8f5f-db1e-4e97-b4ff-16e5c424dcaa'::uuid,,
  '9aaa5eae-039a-42c9-b0e4-5faa0048c8b2'::uuid,,
  'a15fc47b-6efe-4f1e-984a-5f9889aa7b06'::uuid,,
  '3c3c5c85-6e74-45f3-9879-5b3dadd68342'::uuid,,
  'caafb159-0c8a-4d4d-9741-dacf7d68092f'::uuid,,
  'b04bc780-c60f-40f1-8026-4267cd3d4092'::uuid,,
  '4004a382-1e7c-4de7-b2f9-5565e8bc44c2'::uuid,,
  '2f9bb320-3348-4f3f-8b85-2030ae914b5e'::uuid,,
  '2b1d57ef-2e2b-4235-9bf6-fec7b72bdc0f'::uuid
), scope AS (
 SELECT t.id,l.status,l.content
 FROM target t
 LEFT JOIN public.lessons l ON l.id=t.id
)
SELECT
 count(*) expected_lessons,
 count(*) FILTER(WHERE status='draft') draft_lessons,
 count(*) FILTER(WHERE status='published') still_exposed_lessons,
 count(*) FILTER(WHERE content LIKE 'يتناول هذا الدرس موضوع%') matched_scaffolds,
 (SELECT count(*) FROM public.lesson_activities a JOIN target t ON t.id=a.lesson_id) retained_activities,
 (SELECT count(*) FROM public.lesson_activities a JOIN target t ON t.id=a.lesson_id WHERE a.is_published) still_exposed_activities,
 (SELECT count(*) FROM public.questions q JOIN target t ON t.id=q.lesson_id) retained_question_rows,
 (SELECT count(*) FROM public.student_lesson_progress s JOIN target t ON t.id=s.lesson_id) recorded_progress,
 (SELECT count(*) FROM public.question_attempts at JOIN public.questions q ON q.id=at.question_id JOIN target t ON t.id=q.lesson_id) question_attempts,
 (SELECT count(*) FROM public.lesson_activity_attempts at JOIN public.lesson_activities a ON a.id=at.activity_id JOIN target t ON t.id=a.lesson_id) activity_attempts
FROM scope;
