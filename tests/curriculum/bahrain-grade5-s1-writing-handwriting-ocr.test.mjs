import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const load = file => JSON.parse(readFileSync(
  new URL("../../data/curriculum-completeness/" + file, import.meta.url), "utf8"
));
const calligraphy = load("bahrain-grade5-s1-twelve-official-calligraphy-original-support-2026-2027.json");
const writing = load("bahrain-grade5-s1-26-writing-expression-original-support-2026-2027.json");
const ocr = load("bahrain-grade5-s1-four-ocr-ambiguous-reading-original-support-2026-2027.json");

test("twelve missing grade-five handwriting topics match the official weekly schedule", () => {
  expect(calligraphy.grade).toBe(5);
  expect(calligraphy.semester).toBe(1);
  expect(calligraphy.academicYear).toBe("2026-2027");
  expect(calligraphy.records).toHaveLength(12);
  expect(calligraphy.records.map(r => r.week)).toEqual([2,3,4,5,6,7,8,9,10,11,12,13]);
  expect(new Set(calligraphy.records.map(r => r.slug)).size).toBe(12);
  for (const row of calligraphy.records) {
    expect(row.pages[1]).toBeGreaterThanOrEqual(row.pages[0]);
    expect(row.content.length).toBeGreaterThanOrEqual(1200);
    expect(row.content).toContain("مفتاح الإجابة");
    expect(row.bookTextCopied).toBe(false);
    expect(row.editorialReview).toBe("required");
    expect(row.sourceStatus).toContain("ORIGINAL_HANDWRITING_SUPPORT");
  }
});

test("twenty-six existing writing exercises have original differentiated materials", () => {
  expect(writing.records).toHaveLength(26);
  expect(new Set(writing.records.map(r => r.id)).size).toBe(26);
  expect(new Set(writing.records.map(r => r.slug)).size).toBe(26);
  for (const row of writing.records) {
    expect(row.slug).toMatch(/^bh-2026-g5-t1-\d+$/);
    expect(row.content.length).toBeGreaterThanOrEqual(1200);
    expect(row.content).toContain("مفتاح الإجابة");
    expect(row.bookTextCopied).toBe(false);
    expect(row.editorialReview).toBe("required");
    expect(row.sourceStatus).toContain("PENDING");
  }
});

test("four dubious OCR lines must never be counted as verified individual textbook readings", () => {
  expect(ocr.records).toHaveLength(4);
  expect(new Set(ocr.records.map(r => r.slug)).size).toBe(4);
  expect(ocr.status).toContain("PENDING_CANONICAL_RECONCILIATION");
  for (const row of ocr.records) {
    expect(row.canonicalLessonStatus).toBe("OCR_NOT_VERIFIED_AS_INDEPENDENT_OFFICIAL_LESSON");
    expect(row.bookTextCopied).toBe(false);
    expect(row.editorialReview).toBe("required");
    expect(row.content).toContain("مفتاح الإجابة");
    expect(row.content.length).toBeGreaterThanOrEqual(1100);
  }
});
