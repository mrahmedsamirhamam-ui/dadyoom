import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const load = filename => JSON.parse(readFileSync(new URL(
  "../../data/curriculum-completeness/" + filename,
  import.meta.url
), "utf8"));
const reading = load("bahrain-grade4-s2-24-reading-speaking-assessment-original-support-pending-toc-2026-2027.json");
const writing = load("bahrain-grade4-s2-31-spelling-calligraphy-writing-original-support-pending-toc-2026-2027.json");

test("24 grade-four term-two reading, speaking and assessment records have distinct original supplements", () => {
  expect(reading.records).toHaveLength(24);
  expect(new Set(reading.records.map(x => x.id)).size).toBe(24);
  expect(reading.records.filter(x => x.lessonType === "reading")).toHaveLength(11);
  expect(reading.records.filter(x => x.lessonType === "speaking")).toHaveLength(10);
  expect(reading.records.filter(x => x.lessonType === "assessment")).toHaveLength(3);
});

test("31 grade-four term-two writing records cover spelling, handwriting and composition", () => {
  expect(writing.records).toHaveLength(31);
  expect(new Set(writing.records.map(x => x.id)).size).toBe(31);
  expect(writing.records.filter(x => x.kind === "spelling")).toHaveLength(9);
  expect(writing.records.filter(x => x.kind === "calligraphy")).toHaveLength(12);
  expect(writing.records.filter(x => x.kind === "composition")).toHaveLength(10);
});

test("current-edition verification remains explicitly pending on all 55 term-two supports", () => {
  for (const source of [reading, writing]) {
    expect(source.sourceAcademicYear).toBe("2025-2026");
    expect(source.targetAcademicYear).toBe("2026-2027");
    for (const row of source.records) {
      expect(row.sourceStatus).toContain("TOC");
      expect(row.sourceStatus).toMatch(/(?:UNVERIFIED|NOT_VERIFIED)/);
      expect(row.bookTextCopied).toBe(false);
      expect(row.editorialReview).toBe("required");
      expect(row.content.length).toBeGreaterThanOrEqual(1100);
      expect(row.content).toContain("مفتاح الإجابة");
    }
  }
});
