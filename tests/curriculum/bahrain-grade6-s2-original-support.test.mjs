import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const load = file => JSON.parse(readFileSync(new URL(
  "../../data/curriculum-completeness/" + file, import.meta.url
), "utf8"));
const grammarAndListening = load("bahrain-grade6-s2-17-grammar-listening-original-support-pending-toc-2026-2027.json");
const readingAndAssess = load("bahrain-grade6-s2-12-reading-assessment-original-support-pending-toc-2026-2027.json");
const writing = load("bahrain-grade6-s2-18-writing-spelling-original-support-pending-toc-2026-2027.json");

test("all forty-seven grade-six second-term records have unique supplemental lesson content", () => {
  expect(grammarAndListening.records).toHaveLength(17);
  expect(readingAndAssess.records).toHaveLength(12);
  expect(writing.records).toHaveLength(18);
  const all = [grammarAndListening,readingAndAssess,writing].flatMap(x => x.records);
  expect(all).toHaveLength(47);
  expect(new Set(all.map(x => x.id)).size).toBe(47);
  expect(grammarAndListening.records.filter(x => x.lessonType === "grammar")).toHaveLength(12);
  expect(grammarAndListening.records.filter(x => x.lessonType === "listening")).toHaveLength(5);
  expect(readingAndAssess.records.filter(x => x.lessonType === "reading")).toHaveLength(10);
  expect(readingAndAssess.records.filter(x => x.lessonType === "assessment")).toHaveLength(2);
});

test("historical second-term source is not mislabeled as verified 2026–27 book content", () => {
  for (const data of [grammarAndListening,readingAndAssess,writing]) {
    expect(data.sourceAcademicYear).toBe("2025-2026");
    expect(data.targetAcademicYear).toBe("2026-2027");
    expect(data.countryCode).toBe("BH");
    expect(data.grade).toBe(6);
    expect(data.semester).toBe(2);
    for (const record of data.records) {
      expect(record.content.length).toBeGreaterThanOrEqual(1150);
      expect(record.content).toContain("مفتاح الإجابة");
      expect(record.bookTextCopied).toBe(false);
      expect(record.editorialReview).toBe("required");
      expect(record.sourceStatus).toMatch(/NOT_VERIFIED|PENDING/);
    }
  }
});

test("week-only labels are explicitly identified as nonverified individual official skills", () => {
  expect(writing.records.filter(x => x.specificOfficialSkillUnverified)).toHaveLength(9);
  for (const row of writing.records.filter(x => x.specificOfficialSkillUnverified)) {
    expect(row.content).toContain("اسم الأسبوع فقط");
  }
});
