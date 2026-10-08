import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const rows = JSON.parse(readFileSync(new URL(
  "../../data/curriculum-completeness/bahrain-grade4-s2-20-original-listening-grammar-support-pending-toc-2026-2027.json",
  import.meta.url,
), "utf8"));

test("20 grade-four term-two grammar and listening enhancements are distinct", () => {
  expect(rows.grade).toBe(4);
  expect(rows.semester).toBe(2);
  expect(rows.sourceAcademicYear).toBe("2025-2026");
  expect(rows.targetAcademicYear).toBe("2026-2027");
  expect(rows.records).toHaveLength(20);
  expect(new Set(rows.records.map(x => x.id)).size).toBe(20);
  expect(rows.records.filter(x => x.lessonType === "grammar")).toHaveLength(10);
  expect(rows.records.filter(x => x.lessonType === "listening")).toHaveLength(10);
});

test("current edition remains clearly pending throughout historical supplements", () => {
  for (const row of rows.records) {
    expect(row.sourceStatus).toContain("NOT_VERIFIED");
    expect(row.content.length).toBeGreaterThanOrEqual(1100);
    expect(row.content).toContain("مفتاح الإجابة");
    expect(row.content).toContain("2025–2026");
    expect(row.content).toContain("2026–2027");
    expect(row.editorialReview).toBe("required");
    expect(row.bookTextCopied).toBe(false);
  }
});
