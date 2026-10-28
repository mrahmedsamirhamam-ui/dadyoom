-- Applied on 2026-10-28 as Supabase migration 20261028144512
-- Project hvqsvtomhlxavmfqoxfz.
-- Hardening: TRUNCATE bypasses RLS; frontend roles must never have it.
-- Before: anon had TRUNCATE on 109 public tables; authenticated on 117.
-- After: zero for each, across 128 public tables.
-- Keeps service_role, RLS and normal read/write privileges unchanged.
DO $precheck$
DECLARE v_anon integer; v_authenticated integer;
BEGIN
 SELECT COUNT(*) INTO v_anon
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p')
   AND has_table_privilege('anon',c.oid,'TRUNCATE');
 SELECT COUNT(*) INTO v_authenticated
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p')
   AND has_table_privilege('authenticated',c.oid,'TRUNCATE');
 IF v_anon < 100 OR v_authenticated < 100 THEN
  RAISE EXCEPTION 'Unexpected TRUNCATE privilege baseline (% anon, % authenticated)',v_anon,v_authenticated;
 END IF;
END $precheck$;

REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;

DO $postcheck$
DECLARE v_remaining integer;
BEGIN
 SELECT COUNT(*) INTO v_remaining
 FROM pg_roles r CROSS JOIN pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE r.rolname IN ('anon','authenticated')
   AND n.nspname='public' AND c.relkind IN ('r','p')
   AND has_table_privilege(r.oid,c.oid,'TRUNCATE');
 IF v_remaining<>0 THEN
  RAISE EXCEPTION 'Still % web-role TRUNCATE privileges; abort and roll back',v_remaining;
 END IF;
END $postcheck$;
