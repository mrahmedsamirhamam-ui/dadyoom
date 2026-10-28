import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(process.cwd(), "scripts/curriculum-bahrain-grade1-3-title-reconciliation-readonly.sql"),
  "utf8",
);
const executable = sql.replace(/--[^\n]*/g, "");

describe("Bahrain Grade 1-3 source-title reconciliation", () => {
  it("matches the 42 previously reviewed Grade 1-3 term-one headings", () => {
    expect((executable.match(/\(\d+,'BH',1,1,/g) ?? []).length).toBe(18);
    expect((executable.match(/\(\d+,'BH',2,1,/g) ?? []).length).toBe(12);
    expect((executable.match(/\(\d+,'BH',3,1,/g) ?? []).length).toBe(12);
    expect(sql).toContain("data/bahrain-arabic/grade-01-sem1-curriculum.json");
    expect(sql).toContain("data/curriculum-sources/bahrain-2026-s1-ministry-plan-index.json");
  });

  it("preserves numeral suffixes for (1)/(2) and strips OCR artifacts only", () => {
    expect(executable).toContain("replace(e.source_title,'ـ','')");
    expect(executable).toContain("replace(l.title,'ـ','')");
    expect(executable).toContain("'أإآ','ااا'");
    expect(executable).toContain("'[^ء-ي0-9٠-٩]'");
    expect(executable).toContain("x.normalized_title LIKE '%' || e.normalized_title || '%'");
    expect(executable).toContain("x.unit_title=e.source_unit");
  });

  it("does not modify the database, read student progress, or expose answer keys", () => {
    expect(executable).toContain("WITH expected(");
    expect(executable).toContain("SELECT e.seq,e.grade_number");
    expect(executable).not.toMatch(
      /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|CREATE|MERGE|CALL|DO)\b/i,
    );
    expect(executable).not.toMatch(
      /question_attempts|student_lesson_progress|lesson_activity_attempts|correct_answer|lesson_activities\.answer/i,
    );
    expect(executable).toContain("THEN 'REVIEW_SOURCE_TITLE_NOT_FOUND'");
    expect(executable).toContain("THEN 'REVIEW_MULTIPLE_OCR_CANDIDATES'");
  });
});
