
update public.secondary_tracks
set grades=array[10,11,12]::integer[],
    lesson_coverage='generic-grade-scoped-current-and-legacy-status-aware',
    source_urls=(
      select jsonb_agg(distinct value)
      from jsonb_array_elements(
        coalesce(source_urls,'[]'::jsonb) ||
        '[
          "https://www.moe.gov.ae/Ar/ImportantLinks/Documents/Parents%20Guide%20to%20Educational%20Pathways.pdf",
          "https://www.moe.gov.ae/Ar/MediaCenter/News/Pages/MoE-announces-updated-educational-streams-for-Cycle-3-students-starting-from-Academic-Year-2025%E2%80%932026.aspx"
        ]'::jsonb
      )
    ),
    updated_at=now()
where country_code='AE'
  and academic_year='2026-2027'
  and is_active;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'official',true,
       case
         when st.track_name_ar='مسار النخبة'
           then 'Recorded for completeness as a legacy route; the ministry guide states no new intake after 2025-2026.'
         when st.track_name_ar='المسار المهني (التخصصي)'
           then 'Recorded as a transitional/restructured route; current ministry guidance says the applied stream is being restructured.'
         else 'Current UAE Cycle-3 route covering Grades 10-12; Arabic follows the verified national secondary structure.'
       end
from public.secondary_tracks st
join public.countries c on c.code='AE' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%المطابقة الرسمية الإماراتية%'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'supporting',false,
       'Dadyoom core Arabic skills supporting the UAE Cycle-3 route.'
from public.secondary_tracks st
join public.countries c on c.code='AE' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id
 and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar='المسار العربي الأساسي لضاديوم'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='supporting',is_default=false,notes=excluded.notes;
