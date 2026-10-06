
update public.secondary_tracks
set grades=array[11,12]::integer[],
    lesson_coverage='verified-book-bundle-grade-scoped',
    source_urls=(
      select jsonb_agg(distinct value)
      from jsonb_array_elements(
        coalesce(source_urls,'[]'::jsonb) ||
        '[
          "https://nataeji.moe.gov.ye/",
          "https://e-learning-moe.edu.ye/lcms/ClassNine.php"
        ]'::jsonb
      )
    ),
    updated_at=now()
where country_code='YE'
  and academic_year='2026-2027'
  and track_name_ar in ('القسم العلمي','القسم الأدبي');

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'official',true,
       'Yemen Grade 10 is the common first secondary year; scientific/literary branching applies from Grade 11 through the final Grade 12 certificate. Arabic book offerings are shared unless an official branch-specific Arabic source is published.'
from public.secondary_tracks st
join public.countries c on c.code='YE' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%المطابقة الرسمية اليمنية%'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'supporting',false,
       'Dadyoom core Arabic skills supporting the Yemeni scientific/literary branch.'
from public.secondary_tracks st
join public.countries c on c.code='YE' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar='المسار العربي الأساسي لضاديوم'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='supporting',is_default=false,notes=excluded.notes;
