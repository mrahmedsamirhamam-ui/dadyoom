import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const source = JSON.parse(readFileSync(new URL(
  "../../data/curriculum-completeness/bahrain-grade1-s2-original-learning-support-pending-toc-2026-2027.json",
  import.meta.url,
), "utf8"));

test("second semester has 21 uniquely mapped original supports without current-edition claims", () => {
  expect(source.countryCode).toBe("BH");
  expect(source.grade).toBe(1);
  expect(source.semester).toBe(2);
  expect(source.sourceAcademicYear).toBe("2025-2026");
  expect(source.status).toBe("SUPPORT_AUTHORING_ONLY_NOT_CURRENT_BOOK_VERIFIED");
  expect(source.rows).toHaveLength(21);
  expect(new Set(source.rows.map(row => row.id)).size).toBe(21);
  for (const unit of [1, 2, 3]) {
    expect(source.rows.filter(row => row.unit === unit)).toHaveLength(7);
  }
  for (const row of source.rows) {
    expect(row.content.length).toBeGreaterThanOrEqual(650);
    expect(row.content).toContain("مفتاح الإجابة");
    expect(row.content).toContain("مراجعة مصدر 2026–2027 معلّقة");
    expect(row.bookTextCopied).toBe(false);
    expect(row.editorialReview).toBe("required");
    expect(row.officialSourceStatus).toBe("PRIOR_YEAR_2025_2026_REQUIRES_2026_2027_TOC_CHECK");
  }
});

test("single and paired letter exercises match their teaching targets", () => {
  const singles = source.rows.filter(row => row.type === "letter");
  const pairs = source.rows.filter(row => row.type === "pair");
  expect(singles).toHaveLength(7);
  expect(pairs).toHaveLength(5);
  for (const row of singles) {
    const letter = row.content.match(/أنشطة أصلية داعمة لتمييز الحرف «([^»]+)»/u)?.[1];
    const choices = row.content.match(/أصنف «([^»]+)»/u)?.[1].split(" / ");
    expect(letter, row.liveLessonTitle).toBeTruthy();
    expect(choices, row.liveLessonTitle).toHaveLength(3);
    expect(choices.filter(word => word.includes(letter))).toHaveLength(2);
    expect(choices.filter(word => !word.includes(letter))).toHaveLength(1);
  }
  for (const row of pairs) {
    const match = row.content.match(/التمييز بين الحرفين «([^»]+)» و«([^»]+)»/u);
    expect(match, row.liveLessonTitle).not.toBeNull();
    expect(match[1]).not.toBe(match[2]);
  }
  for (const kind of ["review", "song", "story"]) {
    expect(source.rows.filter(row => row.type === kind)).toHaveLength(3);
  }
});
