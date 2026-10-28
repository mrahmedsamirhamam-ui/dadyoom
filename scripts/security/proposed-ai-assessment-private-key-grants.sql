-- PROPOSAL ONLY, NOT A PRODUCTION MIGRATION.
-- Never run against real Supabase. Explicit disposable DB + test flag required.
-- The existing ai_assessments RLS owns rows by student_email, but currently
-- authenticated users can SELECT correct_answer/explanation and forge their
-- own answer key via raw Data API UPDATE/INSERT. Row ownership is not key
-- confidentiality or authoritative scoring.
DO $guard$
BEGIN
  IF current_database() <> 'shadow_ai_keys'
     OR current_setting('dadyoom.ai_keys_rehearsal', true)
        IS DISTINCT FROM 'enabled'
  THEN
    RAISE EXCEPTION 'PRODUCTION_AI_KEY_REVOKE_BLOCKED_DISPOSABLE_TEST_ONLY';
  END IF;
END
$guard$;

-- The public choices field is raw JSONB. Keep this part of the proposal
-- only if every existing row is an array of plain strings. Refuse future
-- nested object structures carrying isCorrect/correctAnswer or similar.
-- The CHECK is intentionally also rehearsed for non-string test insertions.
ALTER TABLE public.ai_assessments
  ADD CONSTRAINT ai_assessments_public_choices_strings_only
  CHECK (
    jsonb_typeof(choices) = 'array'
    AND NOT jsonb_path_exists(
      choices,
      '$[*] ? (@.type() != "string")'
    )
  );

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.ai_assessments
  FROM anon, authenticated;
REVOKE SELECT ON public.ai_assessments FROM anon, authenticated;

-- Allow the app's existing student RLS SELECT projections, NOT
-- correct_answer/explanation. The service_role retains private-key access
-- and all previously granted server-side authoring rights.
GRANT SELECT (
  id, student_email, title, passage, question, choices, skill,
  difficulty, created_at, completed, lesson_id
) ON public.ai_assessments TO anon, authenticated;

-- No policy removed and no security-definer view introduced. The existing
-- auth.email() ownership policy remains in force for each returned row.
-- Do not deploy until other Data API consumers, Preview roles and migration
-- rollback rehearsals have been verified with the actual cloud config.
