-- Read-only verifier for web-role grants in every current public relation.
-- Expected TRUNCATE for anon=0 and authenticated=0; service_role unchanged.
-- Do not expose student records or secret grading values.
WITH public_tables AS (
 SELECT c.oid,c.relname
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p')
),
roles AS (SELECT oid,rolname FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role'))
SELECT roles.rolname,COUNT(*) public_tables,
 COUNT(*) FILTER(WHERE has_table_privilege(roles.oid,public_tables.oid,'TRUNCATE')) truncateable_tables,
 COUNT(*) FILTER(WHERE has_table_privilege(roles.oid,public_tables.oid,'SELECT')) table_selects
FROM roles CROSS JOIN public_tables GROUP BY roles.rolname ORDER BY roles.rolname;
