-- DADYOOM REVIEW ONLY - NOT A PRODUCTION MIGRATION
-- One lesson objective from existing public.lesson_learning_objectives.
-- DO NOT auto-copy objectives from lessons.learning_objectives JSON;
-- they need educator review, syllabus identity, duplicates and rights checks.
-- Needs P0 #57 and #117 resolved before exposing student activity or scores.
BEGIN;

CREATE TABLE IF NOT EXISTS public.objective_curriculum_alignments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  learning_objective_id uuid NOT NULL
    REFERENCES public.lesson_learning_objectives(id) ON DELETE RESTRICT,
  framework text NOT NULL
    CHECK (framework IN ('national','cambridge','ib','cefr')),
  framework_code text NOT NULL CHECK (length(trim(framework_code)) > 0),
  framework_version text NOT NULL CHECK (length(trim(framework_version)) > 0),
  country_code text NOT NULL DEFAULT ''
    CHECK (country_code = '' OR country_code ~ '^[A-Z]{2}$'),
  source_url text,
  verification_status text NOT NULL DEFAULT 'draft'
    CHECK (verification_status IN ('draft','reviewed','rejected')),
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  CONSTRAINT only_reviewed_mapping_is_approved CHECK (
    (verification_status = 'reviewed' AND verified_at IS NOT NULL
       AND verified_by IS NOT NULL AND source_url IS NOT NULL)
    OR (verification_status <> 'reviewed'
       AND verified_at IS NULL AND verified_by IS NULL)
  ),
  CONSTRAINT national_alignment_country CHECK (
    framework <> 'national' OR country_code <> ''
  ),
  UNIQUE(learning_objective_id, framework, framework_code,
         framework_version, country_code)
);

CREATE TABLE IF NOT EXISTS public.objective_delivery_strategies (
  learning_objective_id uuid NOT NULL
    REFERENCES public.lesson_learning_objectives(id) ON DELETE RESTRICT,
  strategy text NOT NULL CHECK (strategy IN ('visual','inquiry','creative')),
  title text NOT NULL,
  explanation text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(content) = 'object'),
  editorial_status text NOT NULL DEFAULT 'draft'
    CHECK (editorial_status IN ('draft','approved','rejected')),
  approved_at timestamptz,
  PRIMARY KEY (learning_objective_id, strategy),
  CONSTRAINT strategy_review_consistency CHECK (
    (editorial_status='approved' AND approved_at IS NOT NULL)
    OR (editorial_status<>'approved' AND approved_at IS NULL)
  )
);

-- Blueprints store visible prompts and general rubrics; NEVER answer keys,
-- expected answers, student scores, or opaque grader configuration.
CREATE TABLE IF NOT EXISTS public.objective_assessment_blueprints (
  learning_objective_id uuid NOT NULL
    REFERENCES public.lesson_learning_objectives(id) ON DELETE RESTRICT,
  tier text NOT NULL CHECK (tier IN ('support','application','challenge')),
  response_mode text NOT NULL CHECK (response_mode IN
    ('visual_choice','drag_drop','short_answer','constructed_response')),
  prompt text NOT NULL,
  public_rubric jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(public_rubric)='array'),
  formative_hint text,
  requires_human_review boolean NOT NULL DEFAULT false,
  editorial_status text NOT NULL DEFAULT 'draft'
    CHECK (editorial_status IN ('draft','approved','rejected')),
  approved_at timestamptz,
  PRIMARY KEY (learning_objective_id, tier),
  CONSTRAINT challenges_manual_check CHECK (
    tier <> 'challenge' OR
    (response_mode='constructed_response' AND requires_human_review)
  ),
  CONSTRAINT hints_formative_only CHECK (tier='support' OR formative_hint IS NULL),
  CONSTRAINT blueprint_review_consistency CHECK (
    (editorial_status='approved' AND approved_at IS NOT NULL)
    OR (editorial_status<>'approved' AND approved_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS ix_objective_framework
  ON public.objective_curriculum_alignments(framework, country_code, framework_version)
  WHERE verification_status='reviewed';

-- Safe default: RLS plus NO client grants for new tables.
-- Only a reviewed read-only endpoint may expose approved text after checking
-- signed-in user's lesson visibility. SERVER role may read via a server route.
ALTER TABLE public.objective_curriculum_alignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objective_delivery_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objective_assessment_blueprints ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.objective_curriculum_alignments FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.objective_delivery_strategies FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.objective_assessment_blueprints FROM PUBLIC, anon, authenticated;

-- service_role may author after separately verified admin/teacher permissions;
-- never put service-role credentials in a browser.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.objective_curriculum_alignments,
     public.objective_delivery_strategies,
     public.objective_assessment_blueprints
  TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.objective_curriculum_alignments_id_seq
  TO service_role;

-- A cross-country *concept* registry gives semantically identical objectives
-- one stable reference while preserving the official wording of each lesson.
CREATE TABLE IF NOT EXISTS public.objective_concept_registry (
  concept_code text PRIMARY KEY
    CHECK (length(trim(concept_code)) >= 8),
  canonical_description text NOT NULL
    CHECK (length(trim(canonical_description)) > 0),
  language_skill text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','reviewed','retired')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  CONSTRAINT concept_review_consistency CHECK (
    (status='reviewed' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
    OR (status<>'reviewed' AND reviewed_by IS NULL AND reviewed_at IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.lesson_objective_concept_map (
  learning_objective_id uuid PRIMARY KEY
    REFERENCES public.lesson_learning_objectives(id) ON DELETE RESTRICT,
  concept_code text NOT NULL
    REFERENCES public.objective_concept_registry(concept_code) ON DELETE RESTRICT,
  mapping_relation text NOT NULL CHECK (mapping_relation IN ('exact','partial','extension')),
  review_status text NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft','reviewed','rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  CONSTRAINT concept_mapping_review_consistency CHECK (
    (review_status='reviewed' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
    OR (review_status<>'reviewed' AND reviewed_by IS NULL AND reviewed_at IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS ix_lesson_objective_concept_code
  ON public.lesson_objective_concept_map(concept_code);

ALTER TABLE public.objective_concept_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_objective_concept_map ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.objective_concept_registry,
   public.lesson_objective_concept_map FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON
   public.objective_concept_registry,
   public.lesson_objective_concept_map TO service_role;

COMMIT;

-- REVIEW GATES: isolated PostgreSQL tests; student JWT read/write denial;
-- qualified teacher authoring and school tenant checks; lesson publishing and
-- full source mapping; child privacy; Security Advisors; reversible migration.
-- No answer key or authoritative attempt table is created by this proposal.
