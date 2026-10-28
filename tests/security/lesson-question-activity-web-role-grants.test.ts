import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve(process.cwd(),
  "supabase/migrations/20261028144115_restrict_web_role_question_activity_privileges.sql"),
  "utf8");
const executable = sql.replace(/--[^\n]*/g, "");

describe("Public question and activity grants", () => {
  it("revokes all anonymous mutations, TRUNCATE and schema privileges", () => {
    expect(executable).toMatch(
      /REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER\s+ON TABLE public\.questions, public\.lesson_activities\s+FROM anon;/i,
    );
    expect(executable).toMatch(
      /REVOKE TRUNCATE, REFERENCES, TRIGGER\s+ON TABLE public\.questions, public\.lesson_activities\s+FROM authenticated;/i,
    );
  });

  it("preserves the authenticated normal RLS write pathway and safe column reads", () => {
    expect(executable).not.toMatch(/REVOKE[^;]+\bSELECT\b/i);
    expect(executable).not.toMatch(/REVOKE[^;]+\bINSERT\b[^;]+FROM authenticated/i);
    expect(executable).not.toMatch(/REVOKE[^;]+\bUPDATE\b[^;]+FROM authenticated/i);
    expect(executable).not.toMatch(/REVOKE[^;]+\bDELETE\b[^;]+FROM authenticated/i);
    expect(executable).not.toMatch(/\bTRUNCATE\s+TABLE\b|\bDELETE\s+FROM\b|\bDROP\s+TABLE\b/i);
    expect(executable).not.toMatch(/REVOKE[^;]+FROM service_role/i);
  });
});
