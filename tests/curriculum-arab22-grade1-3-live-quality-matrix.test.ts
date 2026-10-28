import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const audit = JSON.parse(readFileSync(resolve(process.cwd(),
  "data/curriculum-audits/arab22-grades1-3-live-quality-matrix-2026-10-28.json"), "utf8"
)) as {
 summary: Record<string, number>;
 countryGradeRows: Array<Record<string, string | number>>;
 qualityCaveats: string[];
 sourceSql: string;
};
const sql = readFileSync(resolve(process.cwd(), audit.sourceSql), "utf8");
const executable = sql.replace(/--[^\n]*/g, "");

describe("Twenty-two country curriculum baseline: grades one to three", () => {
  it("covers 22 countries and exactly three grade cells per country", () => {
    const rows = audit.countryGradeRows;
    expect(rows).toHaveLength(66);
    const countryCodes = new Set(rows.map(x => String(x.country_code)));
    expect(countryCodes.size).toBe(22);
    for (const code of countryCodes) {
      expect(rows.filter(x => x.country_code === code)
        .map(x => Number(x.grade_number)).sort()).toEqual([1, 2, 3]);
    }
  });

  it("has additive counts, reports deficits, and never confuses questions with official alignment", () => {
    const rows = audit.countryGradeRows;
    for (const field of [
      "total_lessons", "published", "draft", "generic_scaffold_lessons",
      "lessons_with_generic_questions", "generic_question_rows",
      "published_marked_mvp_draft", "published_with_fewer_than_three_questions",
    ]) {
      expect(audit.summary[field]).toBe(rows.reduce((sum, r) => sum + Number(r[field]), 0));
    }
    expect(audit.summary.published).toBeLessThanOrEqual(audit.summary.total_lessons);
    expect(audit.summary.lessons_with_generic_questions).toBeGreaterThan(0);
    expect(audit.summary.published_marked_mvp_draft).toBeGreaterThan(0);
    expect(audit.qualityCaveats.some(x => x.includes("2026"))).toBe(true);
  });

  it("uses a read-only scan with no answer or student data", () => {
    expect(executable).toContain("FROM public.questions GROUP BY lesson_id");
    expect(executable).toContain("WHERE g.grade_number BETWEEN 1 AND 3");
    expect(executable).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)\b/i);
    expect(executable).not.toMatch(/correct_answer|question_attempts|student_lesson_progress|lesson_activity_attempts/i);
  });
});
