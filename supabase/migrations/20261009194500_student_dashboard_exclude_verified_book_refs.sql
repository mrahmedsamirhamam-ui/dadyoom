-- Keep book-title reference cards in the source database, but exclude them
-- from student dashboard lesson links and published lesson totals.
-- These 30 UUIDs are the exact BOOK_REFERENCE_IDS already audited in
-- lib/curriculum/verified-book-reference.ts (LY 3, OM 5, TN 8, YE 14).
-- No lesson/activity/progress/student data is updated or deleted.
-- CREATE OR REPLACE preserves the existing function signature and grants.
CREATE OR REPLACE FUNCTION public.get_student_dashboard_lessons(
  p_country_code text,
  p_grade_number integer,
  p_limit integer DEFAULT 24
)
RETURNS TABLE(
  id uuid,
  title text,
  estimated_minutes integer,
  lesson_number integer,
  total_count bigint
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT
    l.id,
    l.title,
    l.estimated_minutes,
    l.lesson_number,
    count(*) OVER () AS total_count
  FROM public.lessons l
  JOIN public.units u ON u.id = l.unit_id
  JOIN public.grades g ON g.id = u.grade_id AND g.is_active = true
  JOIN public.curricula cu ON cu.id = g.curriculum_id AND cu.is_active = true
  JOIN public.countries c ON c.id = cu.country_id AND c.is_active = true
  WHERE l.status = 'published'
    AND g.grade_number = p_grade_number
    AND c.code = upper(trim(p_country_code))
    -- Exact provenance IDs: never infer textbook cards from generic titles.
    AND l.id <> ALL (ARRAY[
      '409a3723-ac04-4b9f-828f-d78a6fa16f5d'::uuid,
      'fa77fc34-0c9e-439c-819a-d21dd9193218'::uuid,
      '5fc3a3eb-1ac8-4c26-ad74-04a1116bc221'::uuid,
      '54de9949-783f-4597-9849-931c439eede8'::uuid,
      '159c3d30-51c5-4036-b7d5-0c2be14b0ffa'::uuid,
      'a478bfc8-f2be-4789-9207-d26cd07da0ea'::uuid,
      'c9e04d71-05c6-4a4b-9ce1-4ae8dcab80e0'::uuid,
      '9ef20c8a-16b1-494a-bf20-863e10a2890a'::uuid,
      'f7314947-c47e-4506-92bc-e53b398f2e71'::uuid,
      '22b6db36-cc06-481c-a096-f4326ea33d24'::uuid,
      'a2529f0a-364c-4557-93a5-a0f7f8ff8684'::uuid,
      'f527eb04-cb5d-4712-98db-a3eeb39c1ce5'::uuid,
      'c3d2fe7b-5b23-4870-b80f-defe0e4bb92b'::uuid,
      'de3d48b7-bff5-44e3-9d0f-8cd6818a2194'::uuid,
      'd6938c46-ab5b-44b9-9018-ff2003ee9545'::uuid,
      'cd78ed80-a6b2-4e9d-a4c4-2e5b86f03fe0'::uuid,
      'a20af910-9105-43f6-9a0e-fbba7cd83cf0'::uuid,
      'da3d9cad-c051-48c1-bb8a-c6949ffbdd1e'::uuid,
      '4a9d8b2e-36ce-4e5a-b46d-860a121cebaf'::uuid,
      '6fcc7fac-64c9-486c-9bb9-f874e5e4c03b'::uuid,
      '4446ece4-b120-4433-88e1-94eeeb929b08'::uuid,
      '14cc723b-78be-4b17-8490-437700601df2'::uuid,
      'cb988aba-45fc-45c9-8903-3af59122b330'::uuid,
      '5d356fbc-5910-4890-a408-4ab7d67d7ee5'::uuid,
      'dccac621-d773-4bee-8c6e-a60c966d5d0c'::uuid,
      '7d736715-539a-4d5b-8445-56ad13820f2b'::uuid,
      '28c7fa13-2ecb-4fe5-862a-8237cf1db1ce'::uuid,
      'c7602ca8-c2f4-4862-b30c-dcf165aefbf1'::uuid,
      '669a7009-920e-40c0-bd4e-d590ec4a396d'::uuid,
      'a9a3a610-39a8-41f9-8c4b-7b65784ee9c3'::uuid
    ]::uuid[])
  ORDER BY l.lesson_number ASC NULLS LAST, l.id
  LIMIT greatest(1, least(coalesce(p_limit, 24), 50));
$function$;
