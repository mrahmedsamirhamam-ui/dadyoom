import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve(process.cwd(),
  "supabase/migrations/20261028134638_secure_lesson_teacher_notes_owner_only_read.sql"
), "utf8");
const execSql = sql.replace(/--[^\n]*/g, "");

describe("Teacher notes: no unprivileged reads or writes", () => {
  it("enables RLS and removes inherited public grants", () => {
    expect(execSql).toMatch(/ALTER TABLE public\.lesson_teacher_notes ENABLE ROW LEVEL SECURITY/i);
    expect(execSql).toContain("FROM PUBLIC, anon, authenticated");
    expect(execSql).toContain("GRANT SELECT ON TABLE public.lesson_teacher_notes TO authenticated");
    expect(execSql).not.toMatch(/GRANT\s+(?:INSERT|UPDATE|DELETE|ALL)\b/i);
  });

  it("restricts every authenticated note read to the admin or lesson creator", () => {
    expect(execSql).toContain('ALTER POLICY "Authenticated users read lesson teacher notes"');
    expect(execSql).toContain("TO authenticated");
    expect(execSql).toContain("(SELECT public.is_admin())");
    expect(execSql).toContain("l.id = lesson_teacher_notes.lesson_id");
    expect(execSql).toContain("l.created_by = (SELECT auth.uid())");
    expect(execSql).not.toMatch(/USING\s*\(\s*true\s*\)/i);
  });

  it("never deletes the table, any student attempt or progress record", () => {
    expect(execSql).not.toMatch(/\b(?:TRUNCATE|DROP TABLE|DELETE FROM)\b/i);
    expect(execSql).not.toMatch(/question_attempts|student_lesson_progress|lesson_activity_attempts/i);
  });
});
