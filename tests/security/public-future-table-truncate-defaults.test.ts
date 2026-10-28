import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(),
 "supabase/migrations/20261028145744_deny_postgres_default_public_table_truncate_web_roles.sql"
), "utf8");
const audit = readFileSync(resolve(process.cwd(),
 "scripts/security-public-future-table-defaults-readonly.sql"
), "utf8");
const sql = migration.replace(/--[^\n]*/g, "");
const auditSql = audit.replace(/--[^\n]*/g, "");

describe("Future public table default privileges", () => {
  it("prevents the postgres creator from granting TRUNCATE to web roles", () => {
    expect(sql).toMatch(
      /ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public\s+REVOKE TRUNCATE ON TABLES FROM anon, authenticated;/i,
    );
    expect(sql).toContain("owner_role.rolname='postgres'");
    expect(sql).toContain("a.privilege_type='TRUNCATE'");
    expect(sql).not.toMatch(/ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin/i);
    expect(sql).not.toMatch(/\bDROP TABLE\b|\bTRUNCATE TABLE\b|\bDELETE FROM\b/i);
  });

  it("tracks the unresolved supabase_admin defaults without writing data", () => {
    expect(auditSql).toContain("'postgres','supabase_admin'");
    expect(auditSql).toContain("'anon','authenticated'");
    expect(auditSql).toContain("future_truncate_grants");
    expect(auditSql).toContain("pg_default_acl");
    expect(auditSql).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|GRANT|REVOKE)\b/i);
  });
});
