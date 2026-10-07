
-- Finalize Bahrain secondary Arabic coverage label after S2 current-book union audit.
-- S1 scheduling is current 2026-2027. S2 content is the current 2026-2027 book
-- union, verified with the latest BooksGuide and older official S2 lesson plans;
-- current 2026-2027 S2 scheduling itself is not claimed as published.

update public.secondary_tracks
set
  lesson_coverage='detailed-current-s1-plus-current-book-s2',
  last_audited_date=date '2026-10-07',
  updated_at=now()
where country_code='BH'
  and academic_year='2026-2027'
  and track_name_ar in (
    'توحيد المسارات',
    'المسار الإداري والتكنولوجي - الهندسي',
    'التعليم الفني والمهني',
    'التعليم الديني'
  );
