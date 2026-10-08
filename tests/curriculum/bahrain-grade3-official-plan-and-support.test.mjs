import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const read = filename => JSON.parse(readFileSync(
  new URL("../../data/curriculum-completeness/" + filename, import.meta.url),
  "utf8",
));
const plan = read("bahrain-grade3-s1-official-plan-verified-outline-2026-2027.json");
const listeningSpeaking = read("bahrain-grade3-s1-missing-listening-speaking-original-support-2026-2027.json");
const reading = read("bahrain-grade3-s1-reading-original-support-2026-2027.json");
const term2 = read("bahrain-grade3-s2-original-support-pending-toc-2026-2027.json");
const ocr = read("bahrain-grade3-s1-unresolved-ocr-original-support-2026-2027.json");

test("Bahrain third-grade official first-term schedule has 12 readings, three listenings and three speaking entries", () => {
  expect(plan.countryCode).toBe("BH");
  expect(plan.grade).toBe(3);
  expect(plan.semester).toBe(1);
  expect(plan.academicYear).toBe("2026-2027");
  expect(plan.status).toBe("18_SCHEDULED_CORE_ROWS_TRANSCRIBED_BOOK_TOC_PENDING");
  expect(plan.lessons).toHaveLength(18);
  for (const [kind, count] of [["reading",12],["listening",3],["speaking",3]]) {
    expect(plan.lessons.filter(x => x.kind === kind)).toHaveLength(count);
  }
  for (const lesson of plan.lessons) {
    expect(lesson.sourcePdfPage).toBeGreaterThanOrEqual(14);
    expect(lesson.sourcePdfPage).toBeLessThanOrEqual(16);
    expect(lesson.bookPageEnd).toBeGreaterThanOrEqual(lesson.bookPageStart);
    expect(lesson.identity).toBe("CURRENT_OFFICIAL_PLAN_VERIFIED_TOC_PENDING");
  }
});

test("six original first-term listening and speaking supplements match official plan rows individually", () => {
  expect(listeningSpeaking.records).toHaveLength(6);
  expect(new Set(listeningSpeaking.records.map(x => x.slug)).size).toBe(6);
  for (const record of listeningSpeaking.records) {
    const match = plan.lessons.filter(x => x.kind === record.kind && x.title === record.title);
    expect(match, record.slug).toHaveLength(1);
    expect(record.planPage).toBe(match[0].sourcePdfPage);
    expect(record.bookFrom).toBe(match[0].bookPageStart);
    expect(record.bookTo).toBe(match[0].bookPageEnd);
    expect(record.bookTextCopied).toBe(false);
    expect(record.editorialReview).toBe("required");
    expect(record.content).toContain("مفتاح الإجابة");
    expect(record.content.length).toBeGreaterThanOrEqual(1000);
  }
});

test("twelve original reading supports cover each scheduled first-term reading without duplicates", () => {
  expect(reading.rows).toHaveLength(12);
  expect(new Set(reading.rows.map(x => x.slug)).size).toBe(12);
  const scheduled = plan.lessons.filter(x => x.kind === "reading");
  expect(new Set(reading.rows.map(x => x.officialTitle)).size).toBe(12);
  for (const row of reading.rows) {
    const match = scheduled.filter(x => x.title === row.officialTitle);
    expect(match, row.slug).toHaveLength(1);
    expect(row.officialBookPageStart).toBe(match[0].bookPageStart);
    expect(row.officialBookPageEnd).toBe(match[0].bookPageEnd);
    expect(row.content.length).toBeGreaterThanOrEqual(950);
    expect(row.content).toContain("مفتاح الإجابة");
    expect(row.bookTextCopied).toBe(false);
    expect(row.editorialReview).toBe("required");
  }
});

test("all fifteen earlier-source term-two additions remain clearly unverified for 2026-27", () => {
  expect(term2.records).toHaveLength(15);
  expect(term2.sourceAcademicYear).toBe("2025-2026");
  expect(term2.status).toBe("PREVIOUS_YEAR_REFERENCES_ORIGINAL_SUPPORT_NOT_CURRENT_TOC_VERIFIED");
  expect(new Set(term2.records.map(x => x.id)).size).toBe(15);
  for (const row of term2.records) {
    expect(row.content).toContain("مفتاح الإجابة");
    expect(row.content.length).toBeGreaterThanOrEqual(850);
    expect(row.bookTextCopied).toBe(false);
    expect(row.editorialReview).toBe("required");
    expect(row.sourceStatus).toContain("CURRENT_2026_27_PENDING");
  }
});

test("twelve OCR fragments remain unverified rather than counted as new textbook chapters", () => {
  expect(ocr.rows).toHaveLength(12);
  expect(ocr.status).toBe("12_OCR_ENTRIES_INDEPENDENT_SUPPORT_NOT_TEXTBOOK_MATCHED");
  expect(new Set(ocr.rows.map(x => x.slug)).size).toBe(12);
  for (const row of ocr.rows) {
    expect(row.status).toBe("OCR_TITLE_NOT_YET_RECONCILED_WITH_BOOK_TOC");
    expect(row.content.length).toBeGreaterThanOrEqual(750);
    expect(row.content).toContain("مفتاح الإجابة");
    expect(row.bookTextCopied).toBe(false);
    expect(row.editorialReview).toBe("required");
  }
});
