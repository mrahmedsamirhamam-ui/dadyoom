-- DADYOOM INTERNATIONAL A1: DESIGN PROPOSAL ONLY. NOT AN APPLIED MIGRATION.
-- REVIEW IN A CLONED/ISOLATED DATABASE FIRST. DO NOT RUN ON PRODUCTION WITHOUT
-- AN APPROVED MIGRATION, BACKUP, REVERT PLAN AND AUTH/RLS TEST EVIDENCE.
-- No ALTER, DROP, DELETE or backfill of existing curricula, grades, units or lessons.
-- Everything stays DRAFT until human rights, language and pedagogy review.

CREATE TABLE IF NOT EXISTS public.non_native_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  cefr_level text NOT NULL CHECK (cefr_level IN ('A1','A2','B1','B2','C1','C2')),
  instruction_language text NOT NULL DEFAULT 'en'
    CHECK (instruction_language ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  title_ar text NOT NULL,
  title_en text NOT NULL,
  version_label text NOT NULL DEFAULT '0.1-alpha',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','in_review','approved','published')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT non_native_track_publish_gate CHECK
    (status <> 'published' OR reviewed_at IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.non_native_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES public.non_native_tracks(id) ON DELETE RESTRICT,
  unit_number integer NOT NULL CHECK (unit_number > 0),
  title_ar text NOT NULL,
  title_en text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','in_review','approved','published')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (track_id,unit_number),
  CONSTRAINT non_native_unit_publish_gate CHECK
    (status <> 'published' OR reviewed_at IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.non_native_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.non_native_units(id) ON DELETE RESTRICT,
  lesson_number integer NOT NULL CHECK (lesson_number > 0),
  title_ar text NOT NULL,
  title_en text NOT NULL,
  can_do_ar text NOT NULL,
  can_do_en text NOT NULL,
  primary_skill text NOT NULL
    CHECK (primary_skill IN ('reading','writing','listening','speaking','interaction')),
  instruction_language text NOT NULL DEFAULT 'en'
    CHECK (instruction_language ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  content_rights text NOT NULL DEFAULT 'original'
    CHECK (content_rights IN ('original','licensed','public-domain')),
  rights_verified_at timestamptz,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','in_review','approved','published')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unit_id,lesson_number),
  CONSTRAINT non_native_lesson_publish_gate CHECK
    (status <> 'published' OR (reviewed_at IS NOT NULL AND rights_verified_at IS NOT NULL))
);

-- Explanation is locale-specific rather than hardcoding explanation_en/fr fields.
-- SELECT explanation FROM ... WHERE instruction_language='en' provides explanation_en.
-- New language codes can be added without ALTER TABLE.
CREATE TABLE IF NOT EXISTS public.non_native_lesson_localizations (
  lesson_id uuid NOT NULL REFERENCES public.non_native_lessons(id) ON DELETE RESTRICT,
  instruction_language text NOT NULL
    CHECK (instruction_language ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  title text NOT NULL,
  explanation text NOT NULL,
  worked_example text NOT NULL,
  review_status text NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft','in_review','approved')),
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lesson_id,instruction_language),
  CONSTRAINT non_native_locale_publish_gate CHECK
    (review_status <> 'approved' OR (reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL))
);

-- Mapping a lesson to an external framework requires separate evidence and reviewer sign-off.
-- Never reuse copyrighted exam items or an official logo in app content.
CREATE TABLE IF NOT EXISTS public.non_native_framework_alignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.non_native_lessons(id) ON DELETE RESTRICT,
  framework text NOT NULL CHECK (framework IN ('CEFR','CAMBRIDGE','IB')),
  framework_code text NOT NULL,
  framework_version text,
  source_url text NOT NULL,
  alignment_state text NOT NULL DEFAULT 'candidate'
    CHECK (alignment_state IN ('candidate','verified','rejected')),
  verified_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  verified_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id,framework,framework_code),
  CONSTRAINT non_native_alignment_publish_gate CHECK
    (alignment_state <> 'verified' OR (verified_by IS NOT NULL AND verified_at IS NOT NULL))
);

-- Original national lesson records stay unchanged. This is a reviewed reusable link only.
CREATE TABLE IF NOT EXISTS public.non_native_legacy_lesson_links (
  lesson_id uuid NOT NULL REFERENCES public.non_native_lessons(id) ON DELETE RESTRICT,
  existing_lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE RESTRICT,
  match_state text NOT NULL DEFAULT 'candidate'
    CHECK (match_state IN ('candidate','reviewed','rejected')),
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  reviewed_at timestamptz,
  PRIMARY KEY (lesson_id,existing_lesson_id),
  CONSTRAINT non_native_reuse_gate CHECK
    (match_state <> 'reviewed' OR (reviewer_id IS NOT NULL AND reviewed_at IS NOT NULL))
);

-- Server-authoritative progress metadata, not raw recordings or personal transcripts.
-- No write grants to clients; store individual evidence only after validated server grading.
CREATE TABLE IF NOT EXISTS public.non_native_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  lesson_id uuid NOT NULL REFERENCES public.non_native_lessons(id) ON DELETE RESTRICT,
  activity_count integer NOT NULL DEFAULT 0 CHECK (activity_count >= 0),
  independently_checked_at timestamptz,
  review_due_at timestamptz,
  last_activity_at timestamptz,
  PRIMARY KEY (user_id,lesson_id)
);

CREATE INDEX IF NOT EXISTS non_native_lessons_unit_idx ON public.non_native_lessons(unit_id);
CREATE INDEX IF NOT EXISTS non_native_alignment_lookup_idx
  ON public.non_native_framework_alignments(framework,framework_code);
CREATE INDEX IF NOT EXISTS non_native_progress_review_idx
  ON public.non_native_progress(user_id,review_due_at);

-- Explicitly revoke inherited access. Publish only reviewed public metadata.
REVOKE ALL ON public.non_native_tracks,public.non_native_units,
  public.non_native_lessons,public.non_native_lesson_localizations,
  public.non_native_framework_alignments,public.non_native_legacy_lesson_links,
  public.non_native_progress FROM PUBLIC,anon,authenticated;

ALTER TABLE public.non_native_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_native_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_native_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_native_lesson_localizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_native_framework_alignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_native_legacy_lesson_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_native_progress ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.non_native_tracks,public.non_native_units,
  public.non_native_lessons,public.non_native_lesson_localizations TO anon,authenticated;
GRANT SELECT ON public.non_native_progress TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.non_native_tracks,public.non_native_units,
  public.non_native_lessons,public.non_native_lesson_localizations,
  public.non_native_framework_alignments,public.non_native_legacy_lesson_links,
  public.non_native_progress TO service_role;

CREATE POLICY non_native_tracks_public_read ON public.non_native_tracks
  FOR SELECT TO anon,authenticated
  USING (status='published' AND reviewed_at IS NOT NULL);
CREATE POLICY non_native_units_public_read ON public.non_native_units
  FOR SELECT TO anon,authenticated
  USING (
    status='published' AND reviewed_at IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.non_native_tracks t
      WHERE t.id=track_id AND t.status='published' AND t.reviewed_at IS NOT NULL)
  );
CREATE POLICY non_native_lessons_public_read ON public.non_native_lessons
  FOR SELECT TO anon,authenticated
  USING (
    status='published' AND reviewed_at IS NOT NULL AND rights_verified_at IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.non_native_units u
      WHERE u.id=unit_id AND u.status='published' AND u.reviewed_at IS NOT NULL)
  );
CREATE POLICY non_native_localizations_public_read ON public.non_native_lesson_localizations
  FOR SELECT TO anon,authenticated
  USING (
    review_status='approved' AND reviewed_at IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.non_native_lessons l
      WHERE l.id=lesson_id AND l.status='published' AND l.reviewed_at IS NOT NULL)
  );
CREATE POLICY non_native_progress_owner_read ON public.non_native_progress
  FOR SELECT TO authenticated USING ((select auth.uid())=user_id);

-- No public/client INSERT/UPDATE/DELETE policies are created.
-- No grant to anon/authenticated for assessment keys, reuse mappings or external alignments.
-- Review must verify service_role is server-only, not exposed through NEXT_PUBLIC_.
-- In a full implementation, publish the lesson only after all required approved
-- localizations/assessments exist; this cross-table gate lives in the review service.
