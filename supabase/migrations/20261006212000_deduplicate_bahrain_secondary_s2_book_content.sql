-- Remove redundant Bahrain S2 imports created during concurrent verified-book work.
-- Keep the broader official-book curricula that include the full verified set of
-- common/elective/vocational components. This does not remove any unique official
-- book content and does not change current-year publication status.

delete from public.units u
using public.grades g, public.curricula cur, public.countries c
where u.grade_id=g.id
  and g.curriculum_id=cur.id
  and cur.country_id=c.id
  and c.code='BH'
  and cur.name_ar='اللغة العربية'
  and cur.academic_year='2026-2027'
  and u.unit_number in (3102,3202,3302);

delete from public.curricula cur
using public.countries c
where cur.country_id=c.id
  and c.code='BH'
  and cur.name_ar='اللغة العربية — التعليم الفني والمهني — الجزء الثاني'
  and cur.academic_year='2026-2027';
