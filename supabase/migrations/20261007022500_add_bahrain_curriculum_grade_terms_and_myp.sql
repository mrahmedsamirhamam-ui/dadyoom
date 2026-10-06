-- Bahrain non-secondary / special-program term audit support.
-- No lesson names are fabricated here. MYP Grade 8 is registered because
-- Edunet publishes Plan7 for 2026-2027, while detailed extraction remains pending.

create table if not exists public.curriculum_grade_terms (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.curricula(id) on delete cascade,
  grade_number integer not null check (grade_number between 1 and 13),
  academic_year text not null,
  semester smallint not null check (semester between 1 and 3),
  publication_status text not null check (
    publication_status in ('published','not-published-as-of-audit','unknown')
  ),
  detail_status text not null check (
    detail_status in (
      'detailed-imported',
      'partial-imported',
      'published-pending-extraction',
      'book-content-pending-extraction',
      'not-available-current-year',
      'unknown'
    )
  ),
  source_url text,
  audited_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(curriculum_id,grade_number,academic_year,semester)
);

alter table public.curriculum_grade_terms enable row level security;
drop policy if exists "curriculum_grade_terms_public_read"
on public.curriculum_grade_terms;
create policy "curriculum_grade_terms_public_read"
on public.curriculum_grade_terms
for select using (true);

create index if not exists curriculum_grade_terms_lookup_idx
on public.curriculum_grade_terms(
  curriculum_id,grade_number,academic_year,semester
);

-- Register the official MYP Grade 8 Arabic Language & Literature curriculum.
with bh as (
  select id from public.countries where code='BH' limit 1
)
insert into public.curricula (
  country_id,name_ar,name_en,academic_year,description,is_active
)
select
  bh.id,
  'اللغة العربية — اللغة والأدب — برنامج السنوات المتوسطة MYP',
  'Arabic Language & Literature — MYP',
  '2026-2027',
  'منهج رسمي للصف الثامن في برنامج السنوات المتوسطة MYP. خطة الفصل الأول منشورة رسميًا في Edunet Plan7؛ تفاصيل الدروس قيد الاستخراج الموثق.',
  true
from bh
on conflict (country_id,name_ar,academic_year)
do update set
  name_en=excluded.name_en,
  description=excluded.description,
  is_active=true;

insert into public.grades (
  curriculum_id,name_ar,name_en,grade_number,sort_order,is_active
)
select
  cur.id,
  'الصف الثامن — MYP',
  'Grade 8 — MYP',
  8,
  8,
  true
from public.curricula cur
join public.countries c on c.id=cur.country_id
where c.code='BH'
  and cur.name_ar='اللغة العربية — اللغة والأدب — برنامج السنوات المتوسطة MYP'
  and cur.academic_year='2026-2027'
on conflict (curriculum_id,name_ar)
do update set
  name_en=excluded.name_en,
  grade_number=8,
  sort_order=8,
  is_active=true;

-- Basic education: S1 is fully imported and classified.
insert into public.curriculum_grade_terms (
  curriculum_id,grade_number,academic_year,semester,
  publication_status,detail_status,source_url,audited_at,notes
)
select
  cur.id,
  g.grade_number,
  '2026-2027',
  1,
  'published',
  'detailed-imported',
  'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf',
  date '2026-10-06',
  'Official Bahrain basic-education Arabic semester-1 plan imported and semester-classified.'
from public.curricula cur
join public.countries c on c.id=cur.country_id
join public.grades g on g.curriculum_id=cur.id
where c.code='BH'
  and cur.name_ar='اللغة العربية'
  and cur.academic_year='2026-2027'
  and g.grade_number between 1 and 9
on conflict (curriculum_id,grade_number,academic_year,semester)
do update set
  publication_status=excluded.publication_status,
  detail_status=excluded.detail_status,
  source_url=excluded.source_url,
  audited_at=excluded.audited_at,
  notes=excluded.notes,
  updated_at=now();

-- Current-year S2 schedule has not been published in Edunet LessonsGuide as of audit.
insert into public.curriculum_grade_terms (
  curriculum_id,grade_number,academic_year,semester,
  publication_status,detail_status,source_url,audited_at,notes
)
select
  cur.id,
  g.grade_number,
  '2026-2027',
  2,
  'not-published-as-of-audit',
  'book-content-pending-extraction',
  'https://edunet.bh/Econtent/BooksGuide',
  date '2026-10-06',
  'Current 2026-2027 textbook guide is published, but the semester-2 lesson plan is not yet published. Book content may be imported when verified without claiming it is currently scheduled.'
from public.curricula cur
join public.countries c on c.id=cur.country_id
join public.grades g on g.curriculum_id=cur.id
where c.code='BH'
  and cur.name_ar='اللغة العربية'
  and cur.academic_year='2026-2027'
  and g.grade_number between 1 and 9
on conflict (curriculum_id,grade_number,academic_year,semester)
do update set
  publication_status=excluded.publication_status,
  detail_status=excluded.detail_status,
  source_url=excluded.source_url,
  audited_at=excluded.audited_at,
  notes=excluded.notes,
  updated_at=now();

-- MYP Grade 8: official S1 plan exists, exact lesson extraction still pending.
insert into public.curriculum_grade_terms (
  curriculum_id,grade_number,academic_year,semester,
  publication_status,detail_status,source_url,audited_at,notes
)
select
  cur.id,8,'2026-2027',1,
  'published','published-pending-extraction',
  'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
  date '2026-10-06',
  'Official Plan7 verified (3 pages, current 2026-2027). Exact lesson titles must be extracted before publication in Dadyoom.'
from public.curricula cur
join public.countries c on c.id=cur.country_id
where c.code='BH'
  and cur.name_ar='اللغة العربية — اللغة والأدب — برنامج السنوات المتوسطة MYP'
  and cur.academic_year='2026-2027'
on conflict (curriculum_id,grade_number,academic_year,semester)
do update set
  publication_status=excluded.publication_status,
  detail_status=excluded.detail_status,
  source_url=excluded.source_url,
  audited_at=excluded.audited_at,
  notes=excluded.notes,
  updated_at=now();

insert into public.curriculum_grade_terms (
  curriculum_id,grade_number,academic_year,semester,
  publication_status,detail_status,source_url,audited_at,notes
)
select
  cur.id,8,'2026-2027',2,
  'not-published-as-of-audit','unknown',
  'https://edunet.bh/Econtent/LessonsGuide',
  date '2026-10-06',
  'No current 2026-2027 semester-2 MYP Arabic plan was published in the Edunet lesson guide at audit time.'
from public.curricula cur
join public.countries c on c.id=cur.country_id
where c.code='BH'
  and cur.name_ar='اللغة العربية — اللغة والأدب — برنامج السنوات المتوسطة MYP'
  and cur.academic_year='2026-2027'
on conflict (curriculum_id,grade_number,academic_year,semester)
do update set
  publication_status=excluded.publication_status,
  detail_status=excluded.detail_status,
  source_url=excluded.source_url,
  audited_at=excluded.audited_at,
  notes=excluded.notes,
  updated_at=now();

grant select on public.curriculum_grade_terms to anon,authenticated;
