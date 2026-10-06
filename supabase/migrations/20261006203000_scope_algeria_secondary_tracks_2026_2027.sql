
update public.secondary_tracks
set grades=case
      when track_name_ar in ('جذع مشترك آداب','جذع مشترك علوم وتكنولوجيا')
        then array[10]::integer[]
      else array[11,12]::integer[]
    end,
    lesson_coverage='partial-detailed-grade-scoped',
    source_urls=(
      select jsonb_agg(distinct value)
      from jsonb_array_elements(
        coalesce(source_urls,'[]'::jsonb) ||
        '[
          "https://www.education.gov.dz/2026/07/30/%D9%88%D8%B2%D9%8A%D8%B1-%D8%A7%D9%84%D8%AA%D8%B1%D8%A8%D9%8A%D8%A9-%D8%A7%D9%84%D9%88%D8%B7%D9%86%D9%8A%D8%A9-%D9%8A%D9%86%D8%B4%D9%91%D8%B7-%D9%86%D8%AF%D9%88%D8%A9-%D8%B5%D8%AD%D9%81%D9%8A%D8%A9/",
          "https://www.education.gov.dz/2026/07/25/%D9%88%D8%B2%D9%8A%D8%B1-%D8%A7%D9%84%D8%AA%D8%B1%D8%A8%D9%8A%D8%A9-%D8%A7%D9%84%D9%88%D8%B7%D9%86%D9%8A%D8%A9-%D9%8A%D8%B4%D8%B1%D9%81-%D8%B9%D9%84%D9%89-%D8%A3%D8%B4%D8%BA%D8%A7%D9%84-%D8%A7%D9%84/"
        ]'::jsonb
      )
    ),
    updated_at=now()
where country_code='DZ'
  and academic_year='2026-2027'
  and is_active;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'official',true,
       'Algeria 2026-2027 keeps Grade 10 common trunks, while specialization branches apply to Grades 11-12; Arabic varies by branch depth without inventing unsupported lesson titles.'
from public.secondary_tracks st
join public.countries c on c.code='DZ' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%المطابقة الرسمية الجزائرية%'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'supporting',false,
       'Dadyoom core Arabic skills supporting the Algerian secondary branch.'
from public.secondary_tracks st
join public.countries c on c.code='DZ' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar='المسار العربي الأساسي لضاديوم'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='supporting',is_default=false,notes=excluded.notes;
