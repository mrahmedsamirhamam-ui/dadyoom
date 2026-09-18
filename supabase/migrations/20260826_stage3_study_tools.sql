create table if not exists public.edu_lesson_ai_artifacts (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  kind text not null check (
    kind in (
      'summary',
      'slides',
      'flashcards',
      'study_guide',
      'concept_map',
      'video_storyboard'
    )
  ),
  prompt_version text not null default 'stage3-v1',
  content jsonb not null default '{}'::jsonb,
  provider text,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, kind, prompt_version)
);

alter table public.edu_lesson_ai_artifacts enable row level security;

drop policy if exists "authenticated_read_lesson_ai_artifacts"
  on public.edu_lesson_ai_artifacts;

create policy "authenticated_read_lesson_ai_artifacts"
  on public.edu_lesson_ai_artifacts
  for select
  to authenticated
  using (true);

create table if not exists public.edu_lesson_notebooks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  notes text not null default '',
  pinned_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

alter table public.edu_lesson_notebooks enable row level security;

drop policy if exists "students_read_own_lesson_notebook"
  on public.edu_lesson_notebooks;
create policy "students_read_own_lesson_notebook"
  on public.edu_lesson_notebooks
  for select to authenticated
  using (auth.uid() = student_id);

drop policy if exists "students_insert_own_lesson_notebook"
  on public.edu_lesson_notebooks;
create policy "students_insert_own_lesson_notebook"
  on public.edu_lesson_notebooks
  for insert to authenticated
  with check (auth.uid() = student_id);

drop policy if exists "students_update_own_lesson_notebook"
  on public.edu_lesson_notebooks;
create policy "students_update_own_lesson_notebook"
  on public.edu_lesson_notebooks
  for update to authenticated
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);
