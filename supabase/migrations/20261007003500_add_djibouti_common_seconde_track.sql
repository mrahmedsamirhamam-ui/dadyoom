-- Djibouti: Seconde / الصف الأول الثانوي is a common year before L/ES/S/SG.
-- The official CRIPEN programme provides detailed Arabic content but does not
-- provide a semester mapping, so all imported lessons remain semester NULL.

insert into public.secondary_tracks (
  country_code,
  country_name_ar,
  system_name_ar,
  track_name_ar,
  grades,
  status,
  arabic_policy,
  lesson_coverage,
  academic_year,
  source_urls,
  is_active,
  official_unit_scope,
  last_audited_date
)
values (
  'DJ',
  'جيبوتي',
  'الثانوي العام',
  'السنة الأولى ثانوي — مشترك',
  array[10]::integer[],
  'active',
  'Seconde is the common first secondary year before L/ES/S/SG; do not infer semester from the three programme periods.',
  'partial-detailed-grade-scoped',
  '2026-2027',
  '["https://cripen.dj/","https://cripen.dj/wp-content/uploads/2025/05/Programmes-compile-seconde.pdf"]'::jsonb,
  true,
  'all-mapped-curriculum',
  date '2026-10-06'
)
on conflict (country_code, system_name_ar, track_name_ar, academic_year)
do update set
  grades = excluded.grades,
  status = excluded.status,
  arabic_policy = excluded.arabic_policy,
  lesson_coverage = excluded.lesson_coverage,
  source_urls = excluded.source_urls,
  is_active = true,
  official_unit_scope = excluded.official_unit_scope,
  last_audited_date = excluded.last_audited_date,
  updated_at = now();

insert into public.secondary_track_curricula (
  secondary_track_id,
  curriculum_id,
  relation_type,
  is_default,
  notes
)
select
  st.id,
  cur.id,
  'official',
  true,
  'Official CRIPEN Seconde Arabic programme; common Grade 10 before L/ES/S/SG. Semester remains unclassified because the source uses programme periods, not verified school semesters.'
from public.secondary_tracks st
join public.countries c
  on c.code = 'DJ'
 and c.code = st.country_code
join public.curricula cur
  on cur.country_id = c.id
 and cur.is_active = true
 and cur.academic_year = st.academic_year
 and cur.name_ar = 'اللغة العربية — جيبوتي — Seconde — البرنامج الرسمي التفصيلي'
where st.country_code = 'DJ'
  and st.system_name_ar = 'الثانوي العام'
  and st.track_name_ar = 'السنة الأولى ثانوي — مشترك'
  and st.academic_year = '2026-2027'
on conflict (secondary_track_id, curriculum_id)
do update set
  relation_type = 'official',
  is_default = true,
  notes = excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id,
  curriculum_id,
  relation_type,
  is_default,
  notes
)
select
  st.id,
  cur.id,
  'supporting',
  false,
  'Dadyoom core Arabic skills; supporting content only, not part of the official Djibouti programme.'
from public.secondary_tracks st
join public.countries c
  on c.code = 'DJ'
 and c.code = st.country_code
join public.curricula cur
  on cur.country_id = c.id
 and cur.is_active = true
 and cur.academic_year = st.academic_year
 and cur.name_ar = 'المسار العربي الأساسي لضاديوم'
where st.country_code = 'DJ'
  and st.system_name_ar = 'الثانوي العام'
  and st.track_name_ar = 'السنة الأولى ثانوي — مشترك'
  and st.academic_year = '2026-2027'
on conflict (secondary_track_id, curriculum_id)
do update set
  relation_type = 'supporting',
  is_default = false,
  notes = excluded.notes;
