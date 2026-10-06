update public.secondary_tracks
set grades = case track_name_ar
  when 'الآداب' then array[11,12,13]::integer[]
  when 'الرياضيات' then array[12,13]::integer[]
  when 'العلوم التجريبية' then array[12,13]::integer[]
  when 'الاقتصاد والتصرف' then array[12,13]::integer[]
  when 'العلوم التقنية' then array[12,13]::integer[]
  when 'علوم الإعلامية' then array[12,13]::integer[]
  when 'الرياضة' then array[10,11,12,13]::integer[]
  else grades
end,
lesson_coverage='book-level-current-grade-scoped',
source_urls=(
  select jsonb_agg(distinct value)
  from jsonb_array_elements(
    coalesce(source_urls,'[]'::jsonb) ||
    '["https://education.gov.tn/?s=Secondaire"]'::jsonb
  )
),
updated_at=now()
where country_code='TN'
  and academic_year='2026-2027'
  and track_name_ar in (
    'الآداب','الرياضيات','العلوم التجريبية','الاقتصاد والتصرف',
    'العلوم التقنية','علوم الإعلامية','الرياضة'
  );

insert into public.secondary_tracks (
  country_code,country_name_ar,system_name_ar,track_name_ar,grades,status,
  arabic_policy,lesson_coverage,academic_year,source_urls,is_active
)
values
('TN','تونس','التعليم الثانوي','جذع مشترك',array[10]::integer[],'active','',
 'book-level-current-grade-scoped','2026-2027',
 '["https://cnp.com.tn/arabic/annee-actuelle/listeOfficielle.htm","https://education.gov.tn/?s=Secondaire"]'::jsonb,true),
('TN','تونس','التعليم الثانوي','العلوم',array[11]::integer[],'active','',
 'book-level-current-grade-scoped','2026-2027',
 '["https://cnp.com.tn/arabic/annee-actuelle/listeOfficielle.htm","https://education.gov.tn/?s=Secondaire"]'::jsonb,true),
('TN','تونس','التعليم الثانوي','الاقتصاد والخدمات',array[11]::integer[],'active','',
 'book-level-current-grade-scoped','2026-2027',
 '["https://cnp.com.tn/arabic/annee-actuelle/listeOfficielle.htm","https://education.gov.tn/?s=Secondaire"]'::jsonb,true),
('TN','تونس','التعليم الثانوي','تكنولوجيا الإعلامية',array[11]::integer[],'active','',
 'book-level-current-grade-scoped','2026-2027',
 '["https://cnp.com.tn/arabic/annee-actuelle/listeOfficielle.htm","https://education.gov.tn/?s=Secondaire"]'::jsonb,true)
on conflict (country_code,system_name_ar,track_name_ar,academic_year)
do update set
  grades=excluded.grades,status=excluded.status,
  lesson_coverage=excluded.lesson_coverage,source_urls=excluded.source_urls,
  is_active=true,updated_at=now();

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'official',true,
       'Tunisia current official Arabic book-level baseline for the grade-scoped secondary branch.'
from public.secondary_tracks st
join public.countries c on c.code='TN' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%المطابقة الرسمية التونسية%'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'supporting',false,
       'Dadyoom core skill lessons supporting the grade-scoped Tunisian branch.'
from public.secondary_tracks st
join public.countries c on c.code='TN' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar='المسار العربي الأساسي لضاديوم'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='supporting',is_default=false,notes=excluded.notes;
