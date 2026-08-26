
create table if not exists public.reading_passport_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  summary text,
  critical_reflection text,
  creative_response text,
  comprehension_score integer
    check (
      comprehension_score is null
      or comprehension_score between 0 and 100
    ),
  status text not null default 'started'
    check (status in ('started','completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, lesson_id)
);

alter table public.reading_passport_entries
  enable row level security;

drop policy if exists
  "Students can read own reading passport"
  on public.reading_passport_entries;

create policy
  "Students can read own reading passport"
on public.reading_passport_entries
for select
to authenticated
using (student_id = auth.uid());

drop policy if exists
  "Students can insert own reading passport"
  on public.reading_passport_entries;

create policy
  "Students can insert own reading passport"
on public.reading_passport_entries
for insert
to authenticated
with check (student_id = auth.uid());

drop policy if exists
  "Students can update own reading passport"
  on public.reading_passport_entries;

create policy
  "Students can update own reading passport"
on public.reading_passport_entries
for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

drop policy if exists
  "Students can delete own reading passport"
  on public.reading_passport_entries;

create policy
  "Students can delete own reading passport"
on public.reading_passport_entries
for delete
to authenticated
using (student_id = auth.uid());

create index if not exists
  reading_passport_student_idx
on public.reading_passport_entries(
  student_id,
  updated_at desc
);

create index if not exists
  reading_passport_lesson_idx
on public.reading_passport_entries(lesson_id);
