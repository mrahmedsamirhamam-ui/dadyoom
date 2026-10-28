import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(),
  "supabase/migrations/20261028135915_reject_labelled_answer_keys_in_published_lessons.sql"
), "utf8");
const audit = readFileSync(resolve(process.cwd(),
  "scripts/curriculum-private-answer-visibility-readonly.sql"
), "utf8");
const executableAudit = audit.replace(/--[^\n]*/g, "");

describe("Student-visible lessons exclude private assessment review keys", () => {
  it("enforces and validates the publication CHECK constraint", () => {
    expect(migration).toContain("lessons_published_content_no_labelled_answer_keys");
    expect(migration).toContain("status IS DISTINCT FROM 'published'");
    expect(migration).toContain("ALTER TABLE public.lessons VALIDATE CONSTRAINT");
    for (const heading of [
      "مفتاح الإجابة:",
      "مفتاح المراجعة الذاتية:",
      "مفتاح المراجعة ومؤشرات الاستجابة الصحيحة:",
      "مفتاح المراجعة:",
      "الإجابة النموذجية:",
    ]) {
      expect(migration).toContain(heading);
    }
    expect(migration).not.toMatch(/DROP TABLE|TRUNCATE TABLE|DELETE FROM/i);
  });

  it("audits private-note counts without fetching answers or modifying data", () => {
    expect(executableAudit).toContain("FROM public.lesson_teacher_notes");
    expect(executableAudit).toContain("published_explicit_answer_key_violations");
    expect(executableAudit).toContain("nontrivial_note_read_policies");
    expect(executableAudit).toContain("valid_publication_constraints");
    expect(executableAudit).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|CREATE|MERGE|CALL|DO)\b/i);
    expect(executableAudit).not.toMatch(/correct_answer|question_attempts|student_id|user_id|n\.content|t\.content/i);
  });
});
