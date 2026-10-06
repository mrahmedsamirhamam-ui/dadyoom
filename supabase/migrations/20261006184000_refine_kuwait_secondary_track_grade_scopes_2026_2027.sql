update public.secondary_tracks
set grades=array[11,12]::integer[],
    lesson_coverage='generic-book-bundle-current-grade-scoped',
    updated_at=now()
where country_code='KW'
  and academic_year='2026-2027'
  and system_name_ar='النظام الثانوي القائم'
  and track_name_ar in ('القسم العلمي','القسم الأدبي');

insert into public.secondary_tracks (
  country_code,country_name_ar,system_name_ar,track_name_ar,grades,status,
  arabic_policy,lesson_coverage,academic_year,source_urls,is_active
)
select
  'KW','الكويت','النظام الثانوي القائم','الصف العاشر — النظام القائم',
  array[10]::integer[],'active','',
  'generic-book-bundle-current-grade-scoped','2026-2027',
  '["https://www.moe.edu.kw/News/GetNewsDetail?NewsId=1321","https://elibrary.moe.edu.kw/StudentsLibrary"]'::jsonb,true
where not exists (
  select 1 from public.secondary_tracks
  where country_code='KW'
    and system_name_ar='النظام الثانوي القائم'
    and track_name_ar='الصف العاشر — النظام القائم'
    and academic_year='2026-2027'
);

update public.secondary_tracks
set grades=case
      when track_name_ar='مرحلة التأسيس والاستكشاف — الصف العاشر'
        then array[10]::integer[]
      else array[11,12]::integer[]
    end,
    lesson_coverage='generic-book-bundle-current-grade-scoped',
    updated_at=now()
where country_code='KW'
  and academic_year='2026-2027'
  and system_name_ar like 'نظام مسارات%'
  and (
    track_name_ar='مرحلة التأسيس والاستكشاف — الصف العاشر'
    or status='future-after-foundation'
  );

update public.secondary_tracks
set source_urls=(
  select jsonb_agg(distinct value)
  from jsonb_array_elements(
    coalesce(source_urls,'[]'::jsonb) ||
    '["https://www.moe.edu.kw/News/GetNewsDetail?NewsId=1321"]'::jsonb
  )
)
where country_code='KW' and academic_year='2026-2027';

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'official',true,
       'Kuwait current Arabic national course-semester bundle for the grade-scoped secondary track.'
from public.secondary_tracks st
join public.countries c on c.code='KW' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar like '%المطابقة الرسمية الكويتية%'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='official',is_default=true,notes=excluded.notes;

insert into public.secondary_track_curricula (
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select st.id,cur.id,'supporting',false,
       'Dadyoom core skill lessons supporting the grade-scoped Kuwaiti track.'
from public.secondary_tracks st
join public.countries c on c.code='KW' and c.code=st.country_code
join public.curricula cur
  on cur.country_id=c.id and cur.is_active=true
 and cur.academic_year=st.academic_year
 and cur.name_ar='المسار العربي الأساسي لضاديوم'
where st.academic_year='2026-2027' and st.is_active
on conflict (secondary_track_id,curriculum_id)
do update set relation_type='supporting',is_default=false,notes=excluded.notes;
