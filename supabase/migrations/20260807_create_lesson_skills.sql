create table if not exists public.lesson_skills (
  id uuid primary key default gen_random_uuid(),

  lesson_id uuid not null
    references public.lessons(id)
    on delete cascade,

  skill text not null
    check (char_length(trim(skill)) > 0),

  created_at timestamptz not null default now(),

  constraint lesson_skills_lesson_skill_unique
    unique (lesson_id, skill)
);

create index if not exists idx_lesson_skills_skill
  on public.lesson_skills(skill);

create index if not exists idx_lesson_skills_lesson_id
  on public.lesson_skills(lesson_id);

alter table public.lesson_skills
  enable row level security;

drop policy if exists lesson_skills_select
  on public.lesson_skills;

create policy lesson_skills_select
  on public.lesson_skills
  for select
  to authenticated
  using (true);

insert into public.lesson_skills (
  lesson_id,
  skill
)
select
  id,
  'الاستيعاب المباشر'
from public.lessons
where lesson_number = 1
on conflict (lesson_id, skill) do nothing;