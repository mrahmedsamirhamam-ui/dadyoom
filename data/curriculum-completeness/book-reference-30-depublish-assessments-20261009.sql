-- Book-only reference nodes should never expose legacy assessments as live
-- activities. No rows are deleted, no question scores or student progress are
-- modified, and 30 precise lesson IDs are validated before any write.
DO $dadyoom$
DECLARE
  book_ids uuid[] := ARRAY[
    '409a3723-ac04-4b9f-828f-d78a6fa16f5d',
    'fa77fc34-0c9e-439c-819a-d21dd9193218',
    '5fc3a3eb-1ac8-4c26-ad74-04a1116bc221',
    '54de9949-783f-4597-9849-931c439eede8',
    '159c3d30-51c5-4036-b7d5-0c2be14b0ffa',
    'a478bfc8-f2be-4789-9207-d26cd07da0ea',
    'c9e04d71-05c6-4a4b-9ce1-4ae8dcab80e0',
    '9ef20c8a-16b1-494a-bf20-863e10a2890a',
    'f7314947-c47e-4506-92bc-e53b398f2e71',
    '22b6db36-cc06-481c-a096-f4326ea33d24',
    'a2529f0a-364c-4557-93a5-a0f7f8ff8684',
    'f527eb04-cb5d-4712-98db-a3eeb39c1ce5',
    'c3d2fe7b-5b23-4870-b80f-defe0e4bb92b',
    'de3d48b7-bff5-44e3-9d0f-8cd6818a2194',
    'd6938c46-ab5b-44b9-9018-ff2003ee9545',
    'cd78ed80-a6b2-4e9d-a4c4-2e5b86f03fe0',
    'a20af910-9105-43f6-9a0e-fbba7cd83cf0',
    'da3d9cad-c051-48c1-bb8a-c6949ffbdd1e',
    '4a9d8b2e-36ce-4e5a-b46d-860a121cebaf',
    '6fcc7fac-64c9-486c-9bb9-f874e5e4c03b',
    '4446ece4-b120-4433-88e1-94eeeb929b08',
    '14cc723b-78be-4b17-8490-437700601df2',
    'cb988aba-45fc-45c9-8903-3af59122b330',
    '5d356fbc-5910-4890-a408-4ab7d67d7ee5',
    'dccac621-d773-4bee-8c6e-a60c966d5d0c',
    '7d736715-539a-4d5b-8445-56ad13820f2b',
    '28c7fa13-2ecb-4fe5-862a-8237cf1db1ce',
    'c7602ca8-c2f4-4862-b30c-dcf165aefbf1',
    '669a7009-920e-40c0-bd4e-d590ec4a396d',
    'a9a3a610-39a8-41f9-8c4b-7b65784ee9c3'
  ]::uuid[];
  matching integer;
  used integer;
  changed integer;
BEGIN
  SELECT count(*) INTO matching
  FROM public.lessons l
  JOIN public.units u ON u.id=l.unit_id
  JOIN public.grades g ON g.id=u.grade_id
  JOIN public.curricula c ON c.id=g.curriculum_id
  JOIN public.countries co ON co.id=c.country_id
  WHERE l.id=ANY(book_ids) AND l.status='published'
    AND char_length(btrim(coalesce(l.content,'')))<350
    AND (
      (co.code='LY' AND l.title LIKE '%تغطية كتابية تكاملية%')
      OR (co.code='YE' AND u.title='اللغة العربية — حزمة الكتب الرسمية')
      OR (co.code='TN' AND u.title='اللغة العربية — حزمة الكتاب الرسمي')
      OR (co.code='OM' AND u.title='كتب اللغة العربية الرسمية المعتمدة — 2026/2027')
    );
  IF matching<>30 THEN
    RAISE EXCEPTION 'BOOK_REFERENCES_IDENTITY_MISMATCH_%',matching;
  END IF;

  SELECT count(*) INTO used FROM public.student_lesson_progress
  WHERE lesson_id=ANY(book_ids);
  IF used<>0 THEN RAISE EXCEPTION 'BOOK_REFERENCES_PROGRESS_IN_USE_%',used; END IF;

  SELECT count(*) INTO used FROM public.lesson_activity_attempts att
  JOIN public.lesson_activities a ON a.id=att.activity_id
  WHERE a.lesson_id=ANY(book_ids);
  IF used<>0 THEN RAISE EXCEPTION 'BOOK_REFERENCES_ACTIVITY_ATTEMPTS_IN_USE_%',used; END IF;

  SELECT count(*) INTO used FROM public.question_attempts att
  JOIN public.questions q ON q.id=att.question_id
  WHERE q.lesson_id=ANY(book_ids);
  IF used<>0 THEN RAISE EXCEPTION 'BOOK_REFERENCES_QUESTION_ATTEMPTS_IN_USE_%',used; END IF;

  UPDATE public.lesson_activities
    SET is_published=false, updated_at=now()
  WHERE lesson_id=ANY(book_ids) AND is_published=true;
  GET DIAGNOSTICS changed = ROW_COUNT;

  IF changed<>90 THEN RAISE EXCEPTION 'BOOK_REFERENCES_ACTIVITY_COUNT_MISMATCH_%',changed; END IF;

  SELECT count(*) INTO used FROM public.lesson_activities
  WHERE lesson_id=ANY(book_ids) AND is_published=true;
  IF used<>0 THEN RAISE EXCEPTION 'BOOK_REFERENCES_STILL_PUBLISHED_%',used; END IF;
END $dadyoom$;