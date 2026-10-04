-- Tunisia secondary Arabic: attach every official book node to the exact CNP grade list.
-- No lesson titles or book content are changed.

with targets(grade_number, source_url) as (
  values
    (10, 'https://cnp.com.tn/arabic/annee-actuelle/listeOff/1SE.htm'),
    (11, 'https://cnp.com.tn/arabic/annee-actuelle/listeOff/2SE.htm'),
    (12, 'https://cnp.com.tn/arabic/annee-actuelle/listeOff/3SE.htm'),
    (13, 'https://cnp.com.tn/arabic/annee-actuelle/listeOff/4SE.htm')
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
  and c.code='TN'
  and cu.name_ar='اللغة العربية — المطابقة الرسمية التونسية'
  and l.status='published';
