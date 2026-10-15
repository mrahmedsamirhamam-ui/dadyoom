-- First applied to Dadyoom production using Supabase migration tools
-- on 2026-10-15. This table never modifies lessons or audit-book status.
create table if not exists public.curriculum_toc_evidence (
 scope_key text primary key check(char_length(scope_key) between 4 and 240),
 source_url text not null check(char_length(source_url) between 15 and 600),
 toc_outline text not null check(char_length(toc_outline) between 5 and 12000),
 reviewer_notes text not null default '' check(char_length(reviewer_notes)<=2000),
 review_state text not null default 'submitted_for_review' check(review_state in ('submitted_for_review','needs_correction')),
 updated_by uuid not null references auth.users(id) on delete restrict,
 updated_at timestamptz not null default now()
);
create index if not exists curriculum_toc_evidence_updated_idx on public.curriculum_toc_evidence(updated_at desc);
alter table public.curriculum_toc_evidence enable row level security;
revoke all on table public.curriculum_toc_evidence from public, anon, authenticated;
grant select, insert, update on table public.curriculum_toc_evidence to service_role;
comment on table public.curriculum_toc_evidence is
 'Private reviewer-provided TOC evidence for manual 1:1 matching, never certified or auto-published.';
