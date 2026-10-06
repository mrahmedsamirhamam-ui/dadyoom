
update public.secondary_tracks
set grades=array[10,11,12]::integer[],
    lesson_coverage='partial-current-semester-grade-scoped',
    updated_at=now()
where country_code='BH'
  and academic_year='2026-2027'
  and is_active;
