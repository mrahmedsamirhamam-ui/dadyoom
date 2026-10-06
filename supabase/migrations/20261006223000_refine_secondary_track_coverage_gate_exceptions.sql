update public.secondary_tracks
set lesson_coverage='detailed-current-semester-1',
    updated_at=now()
where country_code='BH'
  and academic_year='2026-2027'
  and track_name_ar='توحيد المسارات';

update public.secondary_tracks
set lesson_coverage='awaiting-current-official-detail',
    updated_at=now()
where country_code='LY'
  and academic_year='2026-2027'
  and track_name_ar='الثانوي الديني';
