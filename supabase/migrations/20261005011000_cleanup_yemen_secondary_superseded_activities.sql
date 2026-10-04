-- Remove superseded generic Yemen book-node activities after the official book nodes were refined.
delete from public.lesson_activities a
using public.lessons l,
      public.units u,
      public.grades g,
      public.curricula cu,
      public.countries c
where a.lesson_id=l.id
  and l.unit_id=u.id
  and u.grade_id=g.id
  and g.curriculum_id=cu.id
  and cu.country_id=c.id
  and c.code='YE'
  and cu.name_ar='اللغة العربية — المطابقة الرسمية اليمنية'
  and g.grade_number in (10,11)
  and a.content->>'origin'='DADYOOM_YE_SECONDARY_OFFICIAL_BOOK_NODE';
