import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const load = name => JSON.parse(readFileSync(new URL(
  "../../data/curriculum-completeness/" + name, import.meta.url,
), "utf8"));
const written = load("bahrain-grade4-s1-28-writing-original-support-2026-2027.json");
const flagged = load("bahrain-grade4-s1-4-unresolved-ocr-reading-support-2026-2027.json");

test("28 writing and speaking training supplements have complete original content", () => {
  expect(written.countryCode).toBe("BH");
  expect(written.grade).toBe(4);
  expect(written.semester).toBe(1);
  expect(written.records).toHaveLength(28);
  expect(new Set(written.records.map(x => x.id)).size).toBe(28);
  for (const row of written.records) {
    expect(row.content.length).toBeGreaterThanOrEqual(1100);
    expect(row.content).toContain("مفتاح الإجابة");
    expect(row.content).toContain("أنشطة متمايزة");
    expect(row.bookTextCopied).toBe(false);
    expect(row.editorialReview).toBe("required");
    expect(row.sourceStatus).toContain("NOT_INDEPENDENT_TEXTBOOK_TOC_VERIFIED");
  }
});

test("four OCR fragment records are explicitly not counted as verified textbook lessons", () => {
  expect(flagged.records).toHaveLength(4);
  expect(new Set(flagged.records.map(x => x.slug)).size).toBe(4);
  expect(flagged.status).toContain("NOT_SCHEDULED_LESSONS_VERIFIED");
  for (const row of flagged.records) {
    expect(row.sourceStatus).toContain("NOT_A_VERIFIED_INDEPENDENT_OFFICIAL_TEXTBOOK_LESSON");
    expect(row.bookTextCopied).toBe(false);
    expect(row.editorialReview).toBe("required");
    expect(row.content).toContain("مفتاح الإجابة");
    expect(row.content.length).toBeGreaterThan(950);
  }
});
