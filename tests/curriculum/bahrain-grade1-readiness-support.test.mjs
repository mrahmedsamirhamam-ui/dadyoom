import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const blank = load("../../data/curriculum-completeness/bahrain-grade1-readiness-blank-worksheet-support-2026-2027.json");
const short = load("../../data/curriculum-completeness/bahrain-grade1-readiness-short-pages-original-support-2026-2027.json");

test("all previously blank grade-one readiness pages have unique original educational support", () => {
  expect(blank.countryCode).toBe("BH");
  expect(blank.academicYear).toBe("2026-2027");
  expect(blank.records).toHaveLength(26);
  expect(new Set(blank.records.map(row => row.id)).size).toBe(26);
  for (const row of blank.records) {
    expect(row.content.length).toBeGreaterThanOrEqual(650);
    expect(row.content).toContain("مفتاح الإجابة");
    expect(row.content).toContain("ولا تمثل نص الأسئلة");
    expect(row.bookTextCopied).toBe(false);
    expect(row.editorialReview).toBe("required");
    expect(Number(row.sourcePageStart)).toBeGreaterThan(0);
  }
});

test("all 59 previously short readiness pages receive nonduplicative original enhancements", () => {
  expect(short.countryCode).toBe("BH");
  expect(short.records).toHaveLength(59);
  expect(new Set(short.records.map(row => row.id)).size).toBe(59);
  expect(new Set(short.records.map(row => row.slug)).size).toBe(59);
  expect(new Set(short.records.map(row => row.id).concat(blank.records.map(row => row.id))).size).toBe(85);
  for (const row of short.records) {
    expect(row.contentToAppend.length).toBeGreaterThanOrEqual(700);
    expect(row.contentToAppend).toContain("مفتاح الإجابة");
    expect(row.contentToAppend).toContain("هذا نص تدريبي أصلي إضافي");
    expect(row.bookTextCopied).toBe(false);
    expect(row.editorialReview).toBe("required");
    expect(row.officialPageReproduction).toBe(false);
  }
  const expectedSlugs = Array.from({ length: 59 }, (_, index) =>
    `bh-2026-g1-t1-${String(index + 2).padStart(3, "0")}`
  );
  expect(short.records.map(row => row.slug)).toEqual(expectedSlugs);
});
