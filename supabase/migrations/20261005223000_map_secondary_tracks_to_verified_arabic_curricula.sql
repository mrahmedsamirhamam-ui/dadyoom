-- Map each registered secondary track to the verified national Arabic baseline
-- and to Dadyoom supporting content. Track-specific detailed corpora are only
-- linked where the existing repository evidence explicitly supports the match.
create table if not exists public.secondary_track_curricula (
  id uuid primary key default gen_random_uuid(),
  secondary_track_id uuid not null references public.secondary_tracks(id) on delete cascade,
  curriculum_id uuid not null references public.curricula(id) on delete cascade,
  relation_type text not null check (relation_type in ('official','supporting','track-specific')),
  is_default boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique(secondary_track_id,curriculum_id)
);

alter table public.secondary_track_curricula enable row level security;

drop policy if exists "secondary_track_curricula_public_read" on public.secondary_track_curricula;
create policy "secondary_track_curricula_public_read"
on public.secondary_track_curricula
for select
using (true);

create index if not exists secondary_track_curricula_track_idx
on public.secondary_track_curricula(secondary_track_id);

create index if not exists secondary_track_curricula_curriculum_idx
on public.secondary_track_curricula(curriculum_id);

insert into public.secondary_track_curricula (
  secondary_track_id, curriculum_id, relation_type, is_default, notes
)
select st.id, cur.id, 'official', true,
       'Verified national Arabic baseline shared by this track unless a more specific official mapping exists.'
from public.secondary_tracks st
join public.countries c on c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
where st.is_active
  and (
    cur.name_ar like '%المطابقة الرسمية%'
    or (st.country_code='BH' and cur.name_ar='اللغة العربية')
  )
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id, curriculum_id, relation_type, is_default, notes
)
select st.id, cur.id, 'supporting', false,
       'Dadyoom core skill lessons; supporting content, not a claim of official track specificity.'
from public.secondary_tracks st
join public.countries c on c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar='المسار العربي الأساسي لضاديوم'
where st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='supporting',is_default=false,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id, curriculum_id, relation_type, is_default, notes
)
select st.id, cur.id, 'track-specific', false,
       'Verified Algeria detailed secondary corpus matched by track name.'
from public.secondary_tracks st
join public.countries c on c.code='DZ' and c.code=st.country_code
join public.curricula cur on cur.country_id=c.id and cur.is_active=true and cur.academic_year=st.academic_year
where st.is_active and (
  (st.track_name_ar='جذع مشترك آداب' and cur.name_ar like '%جذع مشترك آداب%')
  or (st.track_name_ar in ('آداب وفلسفة','لغات أجنبية') and cur.name_ar like '%السنة الثانية ثانوي — آداب/فلسفة/لغات%')
  or (st.track_name_ar in ('علوم تجريبية','رياضيات','تقني رياضي','تسيير واقتصاد') and cur.name_ar like '%السنة الثانية ثانوي — الشعب العلمية المشتركة%')
  or (st.track_name_ar='لغات أجنبية' and cur.name_ar like '%السنة الثالثة ثانوي — شعبة اللغات الأجنبية%')
  or (st.track_name_ar in ('علوم تجريبية','رياضيات','تقني رياضي','تسيير واقتصاد') and cur.name_ar like '%السنة الثالثة ثانوي — الشعب العلمية المشتركة%')
)
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='track-specific',notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id, curriculum_id, relation_type, is_default, notes
)
select st.id, cur.id, 'track-specific', false,
       'Verified Mauritania detailed corpus matched to literary/scientific branch.'
from public.secondary_tracks st
join public.countries c on c.code='MR' and c.code=st.country_code
join public.curricula cur on cur.country_id=c.id and cur.is_active=true and cur.academic_year=st.academic_year
where st.is_active and (
  (st.track_name_ar='الشعبة الأدبية' and cur.name_ar like '%الشعبة الأدبية%')
  or (st.track_name_ar='الشعبة العلمية' and cur.name_ar like '%الشعبة العلمية%')
  or (st.track_name_ar='السنة الرابعة الثانوية — مشترك' and cur.name_ar like '%السنة الرابعة الإعدادية — المنهج الرسمي التفصيلي%')
)
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='track-specific',notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id, curriculum_id, relation_type, is_default, notes
)
select st.id, cur.id, 'track-specific', false,
       'Verified Grade 12 Arabic grammar book; shared across current secondary streams.'
from public.secondary_tracks st
join public.countries c on c.code='SD' and c.code=st.country_code
join public.curricula cur on cur.country_id=c.id and cur.is_active=true and cur.academic_year=st.academic_year
where st.is_active
  and cur.name_ar like '%الصف الثالث الثانوي — قواعد اللغة العربية%'
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='track-specific',notes=excluded.notes;
