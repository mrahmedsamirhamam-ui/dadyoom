-- Public-schema DEFAULT table privileges: read-only drift audit.
-- postgres-owned table defaults: expected zero TRUNCATE for both web roles.
-- supabase_admin defaults: known unresolved risk; the current connection cannot
-- ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin.
SELECT owner_role.rolname AS creator_role,grant_role.rolname AS web_role,
 COUNT(*) FILTER(WHERE a.privilege_type='TRUNCATE') AS future_truncate_grants,
 COUNT(*) FILTER(WHERE a.privilege_type='SELECT') AS future_select_grants
FROM pg_default_acl d
JOIN pg_namespace n ON n.oid=d.defaclnamespace
JOIN pg_roles owner_role ON owner_role.oid=d.defaclrole
CROSS JOIN LATERAL aclexplode(d.defaclacl) a
JOIN pg_roles grant_role ON grant_role.oid=a.grantee
WHERE n.nspname='public' AND d.defaclobjtype='r'
 AND owner_role.rolname IN ('postgres','supabase_admin')
 AND grant_role.rolname IN ('anon','authenticated')
GROUP BY owner_role.rolname,grant_role.rolname
ORDER BY creator_role,web_role;
