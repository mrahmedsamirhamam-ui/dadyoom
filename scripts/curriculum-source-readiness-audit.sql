-- Read-only source trust audit. Safe to run against production.
-- A published row is not proof of ministerial-syllabus correspondence.
-- 2026-11-05: 356 published rows explicitly declared source_publication_ready=false.
-- We corrected 60 misleading "official" summaries with a precise conditional update.
-- The flag remains false until human editorial approval.
SELECT count(*) AS published_but_source_not_ready
FROM public.lessons
WHERE status='published'
  AND instructions @? '$[*] ? (@.kind == "dadyoom_source" && @.source_publication_ready == false)';

SELECT c.code AS country, g.grade_number, count(*) AS needs_review
FROM public.lessons l
JOIN public.units u ON u.id=l.unit_id
JOIN public.grades g ON g.id=u.grade_id
JOIN public.curricula cr ON cr.id=g.curriculum_id
JOIN public.countries c ON c.id=cr.country_id
WHERE l.status='published'
  AND l.instructions @? '$[*] ? (@.kind == "dadyoom_source" && @.source_publication_ready == false)'
GROUP BY c.code,g.grade_number
ORDER BY needs_review DESC;

SELECT count(*) AS misleading_official_label
FROM public.lessons
WHERE status='published' AND summary ILIKE 'محتوى رسمي%'
  AND instructions @? '$[*] ? (@.kind == "dadyoom_source" && @.source_publication_ready == false)';
