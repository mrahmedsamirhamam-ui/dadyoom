alter table public.secondary_tracks
  add column if not exists official_unit_scope text not null default 'all-mapped-curriculum'
  check (official_unit_scope in ('all-mapped-curriculum','mapped-only'));

update public.secondary_tracks
set grades=array[11,12]::integer[], updated_at=now()
where country_code='SA'
  and track_name_ar in ('المسار العام','مسار علوم الحاسب والهندسة','مسار الصحة والحياة','مسار إدارة الأعمال','المسار الشرعي');

insert into public.secondary_tracks
(country_code,country_name_ar,system_name_ar,track_name_ar,grades,status,arabic_policy,lesson_coverage,academic_year,source_urls,is_active)
select 'SA','السعودية','نظام المسارات','السنة الأولى المشتركة',array[10]::integer[],'active','الكفايات اللغوية 1 — مشترك','generic-or-track-extra-partial','2026-2027',
       '["https://www.moe.gov.sa/ar/education/generaleducation/StudyPlans/Pages/Study-plans.aspx"]'::jsonb,true
where not exists (
  select 1 from public.secondary_tracks
  where country_code='SA' and system_name_ar='نظام المسارات'
    and track_name_ar='السنة الأولى المشتركة' and academic_year='2026-2027'
);

update public.secondary_tracks
set grades=case when track_name_ar='شرعي' then array[12]::integer[] else array[11,12]::integer[] end,
    updated_at=now()
where country_code='PS'
  and track_name_ar in ('علمي','علوم إنسانية','ريادة وأعمال','صناعي','شرعي');

insert into public.secondary_tracks
(country_code,country_name_ar,system_name_ar,track_name_ar,grades,status,arabic_policy,lesson_coverage,academic_year,source_urls,is_active)
select 'PS','فلسطين','الثانوي','المسار العام',array[10]::integer[],'active','', 'generic-or-partial','2026-2027',
       '["https://moe.edu.ps/pal-books","https://moe.edu.ps/class12/books"]'::jsonb,true
where not exists (
  select 1 from public.secondary_tracks
  where country_code='PS' and system_name_ar='الثانوي'
    and track_name_ar='المسار العام' and academic_year='2026-2027'
);

insert into public.secondary_tracks
(country_code,country_name_ar,system_name_ar,track_name_ar,grades,status,arabic_policy,lesson_coverage,academic_year,source_urls,is_active)
select 'PS','فلسطين','الثانوي','المسار المهني',array[10]::integer[],'active','', 'generic-or-partial','2026-2027',
       '["https://moe.edu.ps/pal-books","https://moe.edu.ps/class12/books"]'::jsonb,true
where not exists (
  select 1 from public.secondary_tracks
  where country_code='PS' and system_name_ar='الثانوي'
    and track_name_ar='المسار المهني' and academic_year='2026-2027'
);

update public.secondary_tracks
set grades=array[11,12]::integer[], updated_at=now()
where country_code='LY'
  and system_name_ar='التعليم الثانوي العام'
  and track_name_ar in ('القسم العلمي','القسم الأدبي');

update public.secondary_tracks
set grades=array[10,11,12]::integer[], updated_at=now()
where country_code='LY'
  and track_name_ar='الثانوي الديني';

insert into public.secondary_tracks
(country_code,country_name_ar,system_name_ar,track_name_ar,grades,status,arabic_policy,lesson_coverage,academic_year,source_urls,is_active)
select 'LY','ليبيا','التعليم الثانوي العام','السنة الأولى ثانوي — مشترك',array[10]::integer[],'active','', 'partial','2026-2027',
       '["https://cerc.moe.gov.ly/educational-curricul/"]'::jsonb,true
where not exists (
  select 1 from public.secondary_tracks
  where country_code='LY' and system_name_ar='التعليم الثانوي العام'
    and track_name_ar='السنة الأولى ثانوي — مشترك' and academic_year='2026-2027'
);

update public.secondary_tracks
set official_unit_scope='mapped-only', updated_at=now()
where country_code in ('BH','SA','PS','LY');

create table if not exists public.secondary_track_units (
  id uuid primary key default gen_random_uuid(),
  secondary_track_id uuid not null references public.secondary_tracks(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  relation_type text not null default 'official' check (relation_type in ('official','track-specific')),
  notes text,
  created_at timestamptz not null default now(),
  unique(secondary_track_id,unit_id)
);

alter table public.secondary_track_units enable row level security;

drop policy if exists "secondary_track_units_public_read" on public.secondary_track_units;
create policy "secondary_track_units_public_read"
on public.secondary_track_units
for select
using (true);

create index if not exists secondary_track_units_track_idx
on public.secondary_track_units(secondary_track_id);

create index if not exists secondary_track_units_unit_idx
on public.secondary_track_units(unit_id);

insert into public.secondary_track_units(secondary_track_id,unit_id,relation_type,notes)
select st.id,u.id,'official','Bahrain 2026-2027 current verified unified-track Arabic content.'
from public.secondary_tracks st
join public.countries c on c.code='BH'
join public.curricula cur on cur.country_id=c.id and cur.name_ar='اللغة العربية' and cur.is_active
join public.grades g on g.curriculum_id=cur.id and g.grade_number>=10
join public.units u on u.grade_id=g.id
where st.country_code='BH' and st.track_name_ar='توحيد المسارات'
on conflict (secondary_track_id,unit_id) do nothing;

insert into public.secondary_track_units(secondary_track_id,unit_id,relation_type,notes)
select st.id,u.id,'official','Bahrain source explicitly marks Arab 101 and Arab 301 as unified/religious.'
from public.secondary_tracks st
join public.countries c on c.code='BH'
join public.curricula cur on cur.country_id=c.id and cur.name_ar='اللغة العربية' and cur.is_active
join public.grades g on g.curriculum_id=cur.id and g.grade_number>=10
join public.units u on u.grade_id=g.id
where st.country_code='BH' and st.track_name_ar='التعليم الديني'
  and (u.title like 'عرب 101%' or u.title like 'عرب 301%')
on conflict (secondary_track_id,unit_id) do nothing;

insert into public.secondary_track_units(secondary_track_id,unit_id,relation_type,notes)
select st.id,u.id,'official','Saudi common first-year Arabic.'
from public.secondary_tracks st
join public.countries c on c.code='SA'
join public.curricula cur on cur.country_id=c.id and cur.name_ar like '%المطابقة الرسمية السعودية%' and cur.is_active
join public.grades g on g.curriculum_id=cur.id and g.grade_number=10
join public.units u on u.grade_id=g.id
where st.country_code='SA' and st.track_name_ar='السنة الأولى المشتركة'
on conflict (secondary_track_id,unit_id) do nothing;

insert into public.secondary_track_units(secondary_track_id,unit_id,relation_type,notes)
select st.id,u.id,'track-specific','Saudi pathway unit matched by official unit title.'
from public.secondary_tracks st
join public.countries c on c.code='SA'
join public.curricula cur on cur.country_id=c.id and cur.name_ar like '%المطابقة الرسمية السعودية%' and cur.is_active
join public.grades g on g.curriculum_id=cur.id and g.grade_number in (11,12)
join public.units u on u.grade_id=g.id
where st.country_code='SA'
  and (
    (st.track_name_ar='المسار العام' and u.title like '%مسار العام%')
    or (st.track_name_ar='مسار علوم الحاسب والهندسة' and u.title like '%علوم الحاسب والهندسة%')
    or (st.track_name_ar='مسار الصحة والحياة' and u.title like '%الصحة والحياة%')
    or (st.track_name_ar='مسار إدارة الأعمال' and u.title like '%إدارة الأعمال%')
    or (st.track_name_ar='المسار الشرعي' and u.title like '%الشرعي%')
  )
on conflict (secondary_track_id,unit_id) do nothing;

insert into public.secondary_track_units(secondary_track_id,unit_id,relation_type,notes)
select st.id,u.id,'track-specific','Palestine Grade 10 track matched by official unit title.'
from public.secondary_tracks st
join public.countries c on c.code='PS'
join public.curricula cur on cur.country_id=c.id and cur.name_ar like '%المطابقة الرسمية الفلسطينية%' and cur.is_active
join public.grades g on g.curriculum_id=cur.id and g.grade_number=10
join public.units u on u.grade_id=g.id
where st.country_code='PS'
  and (
    (st.track_name_ar='المسار العام' and u.title like 'المسار العام%')
    or (st.track_name_ar='المسار المهني' and u.title like 'المسار المهني%')
  )
on conflict (secondary_track_id,unit_id) do nothing;

insert into public.secondary_track_units(secondary_track_id,unit_id,relation_type,notes)
select st.id,u.id,'track-specific','Palestine secondary track matched by official unit title.'
from public.secondary_tracks st
join public.countries c on c.code='PS'
join public.curricula cur on cur.country_id=c.id and cur.name_ar like '%المطابقة الرسمية الفلسطينية%' and cur.is_active
join public.grades g on g.curriculum_id=cur.id and g.grade_number in (11,12)
join public.units u on u.grade_id=g.id
where st.country_code='PS'
  and (
    (st.track_name_ar='علمي' and u.title like 'مسار العلمي%')
    or (st.track_name_ar='علوم إنسانية' and u.title like 'مسار العلوم الإنسانية%')
    or (st.track_name_ar='ريادة وأعمال' and u.title like 'مسار الريادة والأعمال%')
    or (st.track_name_ar='صناعي' and u.title like 'مسار الصناعي%')
    or (st.track_name_ar='شرعي' and u.title like 'مسار الشرعي%')
    or (
      g.grade_number=12
      and u.title not like 'مسار %'
      and st.track_name_ar in ('علمي','علوم إنسانية','ريادة وأعمال','صناعي','شرعي')
    )
  )
on conflict (secondary_track_id,unit_id) do nothing;

insert into public.secondary_track_units(secondary_track_id,unit_id,relation_type,notes)
select st.id,u.id,'official','Libya common Grade 10 Arabic.'
from public.secondary_tracks st
join public.countries c on c.code='LY'
join public.curricula cur on cur.country_id=c.id and cur.name_ar like '%المطابقة الرسمية الليبية%' and cur.is_active
join public.grades g on g.curriculum_id=cur.id and g.grade_number=10
join public.units u on u.grade_id=g.id
where st.country_code='LY' and st.track_name_ar='السنة الأولى ثانوي — مشترك'
on conflict (secondary_track_id,unit_id) do nothing;

insert into public.secondary_track_units(secondary_track_id,unit_id,relation_type,notes)
select st.id,u.id,'track-specific','Libya scientific/literary unit matched by verified title.'
from public.secondary_tracks st
join public.countries c on c.code='LY'
join public.curricula cur on cur.country_id=c.id and cur.name_ar like '%المطابقة الرسمية الليبية%' and cur.is_active
join public.grades g on g.curriculum_id=cur.id and g.grade_number in (11,12)
join public.units u on u.grade_id=g.id
where st.country_code='LY'
  and (
    (st.track_name_ar='القسم العلمي' and u.title like '%العلمي%')
    or (st.track_name_ar='القسم الأدبي' and (u.title like '%الأدبي%' or (g.grade_number=12 and u.title like 'كتاب %')))
  )
on conflict (secondary_track_id,unit_id) do nothing;
