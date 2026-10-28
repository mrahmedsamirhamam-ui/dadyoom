-- Applied to Dadyoom Supabase production as migration 20261028145744.
-- Project: hvqsvtomhlxavmfqoxfz, 2026-10-28.
-- Future public tables created by postgres will not grant TRUNCATE to
-- anon/authenticated. Current public table grants were already revoked.
-- Separate unresolved limitation: supabase_admin-owned default table grants
-- still include TRUNCATE for both web roles. Connected postgres has no membership
-- in supabase_admin; modify those defaults only via the authorized role.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
 REVOKE TRUNCATE ON TABLES FROM anon, authenticated;

DO $assert$
DECLARE v_count integer;
BEGIN
 SELECT count(*) INTO v_count FROM pg_default_acl d
 JOIN pg_namespace n ON n.oid=d.defaclnamespace
 JOIN pg_roles owner_role ON owner_role.oid=d.defaclrole
 CROSS JOIN LATERAL aclexplode(d.defaclacl) a
 JOIN pg_roles grant_role ON grant_role.oid=a.grantee
 WHERE n.nspname='public' AND d.defaclobjtype='r'
 AND owner_role.rolname='postgres'
 AND grant_role.rolname IN ('anon','authenticated')
 AND a.privilege_type='TRUNCATE';
 IF v_count<>0 THEN RAISE EXCEPTION 'postgres future table defaults remain unsafe: %',v_count; END IF;
END $assert$;
