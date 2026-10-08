import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const file = JSON.parse(readFileSync(new URL(
  "../../data/curriculum-completeness/bahrain-grade4-s1-14-reading-original-support-2026-2027.json",
  import.meta.url,
), "utf8"));

test("all fourteen official-plan grade-four core reading topics have distinct original support", () => {
  expect(file.countryCode).toBe("BH");
  expect(file.grade).toBe(4);
  expect(file.semester).toBe(1);
  expect(file.academicYear).toBe("2026-2027");
  expect(file.records).toHaveLength(14);
  expect(new Set(file.records.map(x => x.id)).size).toBe(14);
  expect(new Set(file.records.map(x => x.slug)).size).toBe(14);
});
test("original reading supplements respect textbook provenance and include assessments", () => {
  for (const row of file.records) {
    expect(row.content.length).toBeGreaterThanOrEqual(1000);
    expect(row.content).toContain("مفتاح الإجابة");
    expect(row.bookTextCopied).toBe(false);
    expect(row.editorialReview).toBe("required");
    expect(row.sourceStatus).toContain("BOOK_TOC_PENDING");
    expect(row.bookPageTo).toBeGreaterThanOrEqual(row.bookPageFrom);
  }
});
