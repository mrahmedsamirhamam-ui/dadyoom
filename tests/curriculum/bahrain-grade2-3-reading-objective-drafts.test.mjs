import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const load = (name) => JSON.parse(
  readFileSync(
    new URL(`../../data/curriculum-completeness/${name}`, import.meta.url),
    "utf8",
  ),
);

const fileName = "bahrain-grade2-3-sem2-original-objective-drafts-20261010.json";

test("all 24 Bahrain grade 2/3 reading MCQ drafts match a documented lesson gap", () => {
  const drafts = load(fileName);
  const audit = load("bahrain-assessment-quality-audit-20261010.json");
  const missing = audit.missingObjectiveLessons
    .filter((item) => [2, 3].includes(item.grade_number) && item.term === 2);
  const byId = new Map(missing.map((item) => [item.id, item]));

  expect(drafts.items).toHaveLength(24);
  expect(missing).toHaveLength(24);
  expect(new Set(drafts.items.map((item) => item.lessonId)).size).toBe(24);
  for (const item of drafts.items) {
    const lesson = byId.get(item.lessonId);
    expect(lesson, item.lessonTitle).toBeDefined();
    expect(item.lessonTitle).toBe(lesson.title);
    expect(item.grade).toBe(lesson.grade_number);
    expect(item.semester).toBe(lesson.term);
    expect(item.options).toHaveLength(4);
    expect(new Set(item.options).size).toBe(4);
    expect(item.options.filter((option) => option === item.correct)).toHaveLength(1);
    expect(item.prompt.length).toBeGreaterThan(18);
    expect(item.explanation.length).toBeGreaterThan(20);
    expect(item.lessonSourceRefType).toBe("DADYOOM_ORIGINAL_SUPPORT_TEXT");
  }
  expect(drafts.items.filter((item) => item.grade === 2)).toHaveLength(12);
  expect(drafts.items.filter((item) => item.grade === 3)).toHaveLength(12);
});

test("unpublished support-text drafts never masquerade as 2026-27 textbook matches", () => {
  const drafts = load(fileName);
  expect(drafts.countryCode).toBe("BH");
  expect(drafts.semester).toBe(2);
  expect(drafts.sourceContext.current2026to2027Semester2OfficialBookTOCConfirmed).toBe(false);
  expect(drafts.sourceContext.officialBookTextCopied).toBe(false);
  expect(drafts.publicationPolicy).toMatch(/UNPUBLISHED_DRAFT_ONLY/);
  expect(drafts.publicationPolicy).toMatch(/TEACHER_REVIEW_REQUIRED/);
  expect(drafts.sourceContext.sourceEditionStatus).toBe("BHR_SEMESTER2_2026_2027_NOT_VERIFIED");
  expect(drafts.reviewChecklist.length).toBeGreaterThanOrEqual(4);
});
