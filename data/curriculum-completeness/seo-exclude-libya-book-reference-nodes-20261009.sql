-- Exclude Libya grade-12 book-title containers from SEO. They are NOT
-- lessons even though their short prefatory content is >200 chars.
-- Preserve view column ordering and SECURITY INVOKER; keep real book units
-- indexable once actual verified lessons are inserted under different titles.
CREATE OR REPLACE VIEW public.seo_indexable_lessons
  WITH (security_invoker = true)
AS
 WITH candidates AS (
         SELECT l.id,
            l.slug,
            l.title,
            l.summary,
            l.updated_at,
            l.lesson_number,
            l.sort_order,
            l.semester AS lesson_semester,
            u.id AS unit_id,
            u.title AS unit_title,
            u.unit_number,
            u.sort_order AS unit_sort_order,
            u.semester AS unit_semester,
            g.id AS grade_id,
            g.name_ar AS grade_name,
            g.grade_number,
            cur.id AS curriculum_id,
            cur.name_ar AS curriculum_name,
            cur.academic_year,
            c.id AS country_id,
            c.code AS country_code,
            c.name_ar AS country_name,
            count(*) OVER (PARTITION BY (md5(regexp_replace(regexp_replace(lower(btrim(l.content)), '[0-9٠-٩]+'::text, '#'::text, 'g'::text), '\s+'::text, ' '::text, 'g'::text)))) AS duplicate_content_count
           FROM lessons l
             JOIN units u ON u.id = l.unit_id
             JOIN grades g ON g.id = u.grade_id
             JOIN curricula cur ON cur.id = g.curriculum_id
             JOIN countries c ON c.id = cur.country_id
          WHERE l.status = 'published'::text AND COALESCE(l.slug, ''::text) !~~ '%-dadyoom-core-%'::text AND length(btrim(COALESCE(l.content, ''::text))) >= 200 AND COALESCE(l.title, ''::text) !~~* '%حزمة%'::text AND COALESCE(l.title, ''::text) !~~* 'محور %'::text AND COALESCE(g.is_active, true) AND COALESCE(cur.is_active, true) AND COALESCE(c.is_active, true)
            AND NOT (
              c.code = 'LY'
              AND l.title LIKE '%تغطية كتابية تكاملية%'
            )
        )
 SELECT id,
    slug,
    title,
    summary,
    updated_at,
    lesson_number,
    sort_order,
    lesson_semester,
    unit_id,
    unit_title,
    unit_number,
    unit_sort_order,
    unit_semester,
    grade_id,
    grade_name,
    grade_number,
    curriculum_id,
    curriculum_name,
    academic_year,
    country_id,
    country_code,
    country_name
   FROM candidates
  WHERE duplicate_content_count = 1;

DO $dadyoom$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.seo_indexable_lessons
 WHERE country_code='LY' AND title LIKE '%تغطية كتابية تكاملية%';
 IF n<>0 THEN
  RAISE EXCEPTION 'SEO_BOOK_REFERENCE_LEAK_%',n;
 END IF;
END $dadyoom$;
