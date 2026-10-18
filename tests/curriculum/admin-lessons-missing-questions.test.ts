import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";

const admin = readFileSync("app/admin/lessons/page.tsx", "utf8");
const assessment = readFileSync("app/admin/curriculum/coverage/assessments/page.tsx", "utf8");

describe("live missing-questions teacher triage for Bahrain", () => {
  test("applies the no-questions anti-join before bounded pagination", () => {
    expect(admin).toContain('filters.review === "no-questions"');
    expect(admin).toContain('missing_questions:questions!left()');
    expect(admin).toContain('query.is("missing_questions", null)');
    const filter = admin.indexOf('query.is("missing_questions", null)');
    const page = admin.indexOf("const from = (page - 1) * PAGE_SIZE");
    expect(filter).toBeGreaterThan(0);
    expect(filter).toBeLessThan(page);
    expect(admin).toContain(".range(from, from + PAGE_SIZE - 1)");
    expect(admin).toContain('{ count: "exact" }');
  });
  test("retains country/grade/status filters and teacher review links", () => {
    expect(admin).toContain('query.eq("status", filters.status)');
    expect(admin).toContain('query.eq("units.grades.curricula.countries.code", filters.country)');
    expect(admin).toContain('query.eq("units.grades.grade_number", Number(filters.grade))');
    expect(admin).toContain('href={`/admin/lessons/${lesson.id}`}');
  });
  test("distinguishes absent traditional questions from existing published activities", () => {
    expect(admin).toContain("لا يعني عدم وجود أنشطة منشورة بجدول آخر");
    expect(admin).toContain('<option value="no-questions">');
    expect(assessment).toContain("/admin/lessons?country=BH&status=published&review=no-questions");
  });
});
