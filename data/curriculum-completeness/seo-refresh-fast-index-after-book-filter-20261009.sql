-- The fast SEO index is a MATERIALIZED VIEW (relkind=m), not a live VIEW.
-- Rebuild from the already corrected security-invoker source view so book-title
-- container cards are removed without editing lesson IDs, activities, or progress.
REFRESH MATERIALIZED VIEW public.seo_indexable_lessons_fast;

DO $dadyoom$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM public.seo_indexable_lessons_fast
 WHERE country_code='LY' AND title LIKE '%تغطية كتابية تكاملية%';
 IF n <> 0 THEN RAISE EXCEPTION 'SEO_FAST_BOOK_REFERENCE_LEAK_%',n; END IF;
END $dadyoom$;
