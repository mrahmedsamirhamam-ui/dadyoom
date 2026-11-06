-- This test runs in a disposable GitHub Actions Postgres service.
DO $$
BEGIN
 IF has_column_privilege('authenticated','public.profiles','role','UPDATE')
 THEN RAISE EXCEPTION 'authenticated role UPDATE still allowed'; END IF;
 IF has_column_privilege('authenticated','public.profiles','email','UPDATE')
 THEN RAISE EXCEPTION 'authenticated email UPDATE still allowed'; END IF;
 IF has_column_privilege('authenticated','public.profiles','id','UPDATE')
 THEN RAISE EXCEPTION 'authenticated id UPDATE still allowed'; END IF;
 IF has_column_privilege('authenticated','public.profiles','requested_role','UPDATE')
 THEN RAISE EXCEPTION 'authenticated requested_role UPDATE still allowed'; END IF;
 IF has_table_privilege('authenticated','public.profiles','INSERT')
 THEN RAISE EXCEPTION 'authenticated direct INSERT still allowed'; END IF;
 IF NOT has_column_privilege('authenticated','public.profiles','full_name','UPDATE')
 THEN RAISE EXCEPTION 'safe self-service name UPDATE blocked'; END IF;
END$$;
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES (
'11111111-1111-4111-8111-111111111111',
'fictional@example.test',
'{"role":"teacher","full_name":"Fictional teacher","country":"BH"}'::jsonb
);
DO $$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE id='11111111-1111-4111-8111-111111111111'
   AND role='student' AND requested_role='teacher'
 ) THEN RAISE EXCEPTION 'metadata teacher request incorrectly got privileges'; END IF;
END$$;

SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
UPDATE public.profiles SET full_name='Edited safely' WHERE id='11111111-1111-4111-8111-111111111111';
DO $$
BEGIN
 BEGIN
  UPDATE public.profiles SET role='teacher' WHERE id='11111111-1111-4111-8111-111111111111';
  RAISE EXCEPTION 'role UPDATE should have been blocked';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  INSERT INTO public.profiles(id,role,email) VALUES ('22222222-2222-4222-8222-222222222222','school','fake@example.test');
  RAISE EXCEPTION 'direct INSERT should have been blocked';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END$$;
RESET ROLE;
RESET request.jwt.claim.sub;
SET ROLE service_role;
UPDATE public.profiles SET role='teacher',requested_role=NULL WHERE id='11111111-1111-4111-8111-111111111111';
RESET ROLE;
DO $$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE id='11111111-1111-4111-8111-111111111111'
    AND role='teacher' AND requested_role IS NULL AND full_name='Edited safely'
 ) THEN RAISE EXCEPTION 'approved server role update or self-profile update failed'; END IF;
END$$;
