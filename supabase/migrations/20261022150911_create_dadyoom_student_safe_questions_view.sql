-- Applied to the Dadyoom public education Supabase project 2026-10-22.
-- Additive only. SECURITY INVOKER respects existing lessons/questions RLS.
CREATE VIEW public.dadyoom_student_questions
WITH (security_invoker = true, security_barrier = true)
AS
SELECT
  q.id,
  q.lesson_id,
  q.question_order,
  q.question,
  q.question_type,
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object('id', option_row.opt ->> 'id', 'text', option_row.opt ->> 'text')
      ORDER BY option_row.ord
    )
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(q.options) = 'array' THEN q.options ELSE '[]'::jsonb END
    ) WITH ORDINALITY AS option_row(opt, ord)
    WHERE jsonb_typeof(option_row.opt) = 'object'
      AND jsonb_typeof(option_row.opt -> 'id') = 'string'
      AND jsonb_typeof(option_row.opt -> 'text') = 'string'
  ), '[]'::jsonb) AS options,
  q.points
FROM public.questions q
JOIN public.lessons l ON l.id = q.lesson_id
WHERE l.status = 'published';

REVOKE ALL ON public.dadyoom_student_questions FROM PUBLIC;
GRANT SELECT ON public.dadyoom_student_questions TO anon, authenticated;
COMMENT ON VIEW public.dadyoom_student_questions IS
  'Published student questions only; answer keys and explanations excluded; invoker-RLS; nested options allowlisted.';
