-- Reproducible source definition for the Dadyoom Core Arabic template bank.
-- The deterministic template data is stored in:
-- data/core-curriculum/dadyoom-core-templates-2026-2027.json

create table if not exists public.dadyoom_core_arabic_templates (
  band integer not null,
  global_no integer not null,
  unit_no integer not null,
  title text not null,
  lesson_type text not null,
  concept text not null,
  example text not null,
  vocab1 text not null,
  meaning1 text not null,
  vocab2 text not null,
  meaning2 text not null,
  vocab3 text not null,
  meaning3 text not null,
  primary key (band, global_no)
);

alter table public.dadyoom_core_arabic_templates
  enable row level security;
