import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(),
  "supabase/migrations/20261028144512_deny_public_schema_truncate_to_web_roles.sql"
), "utf8");
const audit = readFileSync(resolve(process.cwd(),
  "scripts/security-public-schema-web-role-privileges-readonly.sql"
), "utf8");
const executable = migration.replace(/--[^\n]*/g, "");
const auditSql = audit.replace(/--[^\n]*/g, "");

describe("Public schema TRUNCATE privilege boundary", () => {
  it("revokes all table TRUNCATE rights from web-facing roles", () => {
    expect(executable).toMatch(
      /REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;/i,
    );
    expect(executable).toContain("has_table_privilege('anon',c.oid,'TRUNCATE')");
    expect(executable).toContain("has_table_privilege('authenticated',c.oid,'TRUNCATE')");
    expect(executable).toContain("RAISE EXCEPTION 'Still % web-role TRUNCATE privileges;");
    expect(executable).not.toMatch(/REVOKE[^;]+FROM service_role/i);
    expect(executable).not.toMatch(/\bTRUNCATE\s+TABLE\b|\bDELETE FROM\b|\bDROP TABLE\b/i);
  });

  it("keeps the follow-up checker read-only and free of student data", () => {
    expect(auditSql).toContain("has_table_privilege(roles.oid,public_tables.oid,'TRUNCATE')");
    expect(auditSql).toContain("WHERE rolname IN ('anon','authenticated','service_role')");
    expect(auditSql).toContain("FROM roles CROSS JOIN public_tables");
    expect(auditSql).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|TRUNCATE ON|ALTER|DROP|GRANT|REVOKE)\b/i);
    expect(auditSql).not.toMatch(/student_id|question_attempts|correct_answer|lesson_activities\.answer/i);
  });
});
