-- Correct the word count in an original Saudi primary handwriting example:
-- «ذهبَ عليٌّ إلى البيت» has four written words, not three.
-- Strictly targets three existing lessons without touching learner records.
DO $dadyoom$
DECLARE bad_count integer; fixed_count integer;
BEGIN
 SELECT count(*) INTO bad_count
 FROM public.lessons l JOIN public.units u ON u.id=l.unit_id
 JOIN public.grades g ON g.id=u.grade_id JOIN public.curricula c ON c.id=g.curriculum_id
 JOIN public.countries co ON co.id=c.country_id
 WHERE co.code='SA' AND c.id='f42518c1-c7bd-45da-bb37-69cf9eca0a56'::uuid
   AND g.grade_number BETWEEN 1 AND 3 AND u.semester=1
   AND l.sort_order=7 AND l.title='الرسم الكتابي — الفصل الأول'
   AND l.content LIKE '%الكلمات ثلاث وحدات متباعدة%'
   AND l.content LIKE '%«ذهبَ عليٌّ إلى البيت»%';
 IF bad_count<>3 THEN RAISE EXCEPTION 'EXPECTED_THREE_MISTAKEN_HANDWRITING_EXAMPLES_GOT_%',bad_count; END IF;
 WITH fixed AS (
 UPDATE public.lessons l
 SET content=replace(l.content,'الكلمات ثلاث وحدات متباعدة','الكلمات أربع وحدات متباعدة'),updated_at=now()
 FROM public.units u JOIN public.grades g ON g.id=u.grade_id
 JOIN public.curricula c ON c.id=g.curriculum_id JOIN public.countries co ON co.id=c.country_id
 WHERE l.unit_id=u.id AND co.code='SA'
   AND c.id='f42518c1-c7bd-45da-bb37-69cf9eca0a56'::uuid
   AND g.grade_number BETWEEN 1 AND 3 AND u.semester=1
   AND l.sort_order=7 AND l.title='الرسم الكتابي — الفصل الأول'
   AND l.content LIKE '%الكلمات ثلاث وحدات متباعدة%'
 RETURNING l.id)
 SELECT count(*) INTO fixed_count FROM fixed;
 IF fixed_count<>3 THEN RAISE EXCEPTION 'HANDWRITING_FIX_COUNT_INCORRECT_%',fixed_count; END IF;
END $dadyoom$;