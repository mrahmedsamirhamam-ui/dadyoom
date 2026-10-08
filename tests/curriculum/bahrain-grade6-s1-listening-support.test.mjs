import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const source = JSON.parse(readFileSync(new URL(
  "../../data/curriculum-completeness/bahrain-grade6-s1-three-missing-official-listening-original-support-2026-2027.json",
  import.meta.url
), "utf8"));

test("Grade-6 current official first-term plan has the three missing listening skills captured", () => {
  expect(source.countryCode).toBe("BH");
  expect(source.grade).toBe(6);
  expect(source.semester).toBe(1);
  expect(source.academicYear).toBe("2026-2027");
  expect(source.records).toHaveLength(3);
  expect(source.records.map(r => r.week)).toEqual([4,10,13]);
  expect(source.records.map(r => r.guidePage)).toEqual([127,129,130]);
  expect(new Set(source.records.map(r => r.slug)).size).toBe(3);
  for (const record of source.records) {
    expect(record.sourceStatus).toContain("ORIGINAL_NOT_OFFICIAL_TEXT");
    expect(record.bookTextCopied).toBe(false);
    expect(record.editorialReview).toBe("required");
    expect(record.content.length).toBeGreaterThanOrEqual(1200);
    expect(record.content).toContain("مفتاح الإجابة");
  }
});
