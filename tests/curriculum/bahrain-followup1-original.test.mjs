import { readFileSync } from "node:fs";
import { test, expect } from "vitest";
const data = JSON.parse(readFileSync(new URL("../../data/curriculum-completeness/bahrain-continuing-followup1-original-drafts-part1-2026-2027.json", import.meta.url), "utf8"));
test("12 independently authored first-followup lessons have answer keys and provenance", () => {
 expect(data.countryCode).toBe("BH");
 expect(data.academicYear).toBe("2026-2027");
 expect(data.level).toBe("الأول متابعة");
 expect(data.rows).toHaveLength(12);
 expect(new Set(data.rows.map(x=>x.title)).size).toBe(12);
 for(const row of data.rows) {
  expect(row.content.length).toBeGreaterThan(620);
  expect(row.content).toContain("مفتاح الإجابة");
  expect(row.content).toContain("SOURCE=DADYOOM_BH_FOLLOWUP1_DRAFT_V1");
  expect(row.learning_objectives).toHaveLength(3);
  expect(row.vocabulary.length).toBeGreaterThanOrEqual(2);
  expect(row.quiz.options).toHaveLength(4);
  expect(row.quiz.options.filter(x=>x===row.quiz.correct)).toHaveLength(1);
  expect(row.editorialReview).toBe("required");
  expect(row.bookTextCopied).toBe(false);
 }
});
