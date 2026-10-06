
update public.secondary_tracks
set grades=array[11,12]::integer[],
    lesson_coverage='partial-detailed-grade-scoped',
    source_urls=(
      select jsonb_agg(distinct value)
      from jsonb_array_elements(
        coalesce(source_urls,'[]'::jsonb) ||
        '["https://cripen.dj/wp-content/uploads/2025/05/Programmes-compile-seconde.pdf"]'::jsonb
      )
    ),
    updated_at=now()
where country_code='DJ'
  and academic_year='2026-2027'
  and track_name_ar in ('L','ES','S','SG');

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'official',true,
       'Djibouti Grade 10 (Seconde) is common; L, ES, S and SG appear in Première and Terminale, corresponding to Grades 11-12.'
from public.secondary_tracks st
join public.countries c on c.code='DJ' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%المطابقة الرسمية الجيبوتية%'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'supporting',false,
       'Dadyoom core Arabic skills supporting the Djiboutian secondary series.'
from public.secondary_tracks st
join public.countries c on c.code='DJ' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar='المسار العربي الأساسي لضاديوم'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='supporting',is_default=false,notes=excluded.notes;
