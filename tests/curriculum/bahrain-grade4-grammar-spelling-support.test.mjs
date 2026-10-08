import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const evidence = JSON.parse(readFileSync(new URL(
  "../../data/curriculum-completeness/bahrain-grade4-s1-29-grammar-spelling-original-support-2026-2027.json",
  import.meta.url,
), "utf8"));

test("grade-four first-term grammar and spelling lessons each have original support", () => {
  expect(evidence.grade).toBe(4);
  expect(evidence.countryCode).toBe("BH");
  expect(evidence.academicYear).toBe("2026-2027");
  expect(evidence.semester).toBe(1);
  expect(evidence.records).toHaveLength(29);
  expect(evidence.records.filter(r => r.lessonType === "grammar")).toHaveLength(20);
  expect(evidence.records.filter(r => r.lessonType === "spelling")).toHaveLength(9);
  expect(new Set(evidence.records.map(r => r.id)).size).toBe(29);
  expect(new Set(evidence.records.map(r => r.slug)).size).toBe(29);
});

test("grade-four supports have answer keys, differentiation and no false book completeness", () => {
  expect(evidence.status).toContain("REQUIRE_BOOK_TOC_EDITORIAL_REVIEW");
  for (const record of evidence.records) {
    expect(record.content.length).toBeGreaterThanOrEqual(1000);
    expect(record.content).toContain("مفتاح الإجابة");
    expect(record.content).toContain("التمرين المتمايز");
    expect(record.content).toContain("حالة الاعتماد");
    expect(record.editorialReview).toBe("required");
    expect(record.bookTextCopied).toBe(false);
    expect(record.officialTopicStatus).toContain("NOT_BOOK_TOC_VERIFIED");
  }
});
