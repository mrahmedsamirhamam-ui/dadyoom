-- Morocco secondary Arabic: attach the most specific currently verifiable
-- official TelmidTice source page to existing official bundle nodes.
-- No lesson title/count expansion is performed.

with targets(grade_number, lesson_number, source_url) as (
  values
    (10,1,'https://telmidtice.men.gov.ma/courses?category=67c59d79062e69f770de725a&level=3&subCategory=67c59d7a062e69f770de72b3'),
    (11,2,'https://telmidtice.men.gov.ma/course/اللغة-العربية---السنة-الأولى-باكالوريا---علوم-تجريبية---الثانوي-التأهيلي'),
    (12,1,'https://telmidtice.men.gov.ma/courses?category=67c6fa462852c37f346d37ae&level=3&subCategory=67dbf8692d3e5329c49de9a5')
)
update public.lessons l
set source_pdf_url=t.source_url,
    updated_at=now()
from public.units u
join public.grades g on g.id=u.grade_id
join public.curricula cu on cu.id=g.curriculum_id
join public.countries c on c.id=cu.country_id
join targets t on t.grade_number=g.grade_number
where l.unit_id=u.id
  and l.lesson_number=t.lesson_number
  and c.code='MA'
  and cu.name_ar <> 'المسار العربي الأساسي لضاديوم'
  and l.status='published';
