import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const load = name => JSON.parse(
  readFileSync(new URL("../../data/curriculum-completeness/" + name, import.meta.url), "utf8")
);
const plan = load("bahrain-grade2-s1-official-plan-verified-outline-2026-2027.json");
const readings = load("bahrain-grade2-s1-official-reading-original-support-2026-2027.json");
const listening = load("bahrain-grade2-s1-missing-listening-original-packs-2026-2027.json");
const reviews = load("bahrain-grade2-s1-official-review-original-support-2026-2027.json");
const sem2 = load("bahrain-grade2-sem2-original-lessons-pending-toc-2026-2027.json");

test("verified current-year grade-two plan has 10 review, 12 reading and 3 listening entries", () => {
  expect(plan.countryCode).toBe("BH");
  expect(plan.academicYear).toBe("2026-2027");
  expect(plan.grade).toBe(2);
  expect(plan.semester).toBe(1);
  expect(plan.status).toBe("CORE_PLAN_ROWS_VERIFIED_BOOK_TOC_PENDING");
  expect(plan.lessons).toHaveLength(25);
  expect(plan.lessons.filter(l => l.kind === "review")).toHaveLength(10);
  expect(plan.lessons.filter(l => l.kind === "reading")).toHaveLength(12);
  expect(plan.lessons.filter(l => l.kind === "listening")).toHaveLength(3);
  for (const lesson of plan.lessons) {
    expect(lesson.sourcePdfPage).toBeGreaterThanOrEqual(10);
    expect(lesson.sourcePdfPage).toBeLessThanOrEqual(13);
    expect(lesson.bookPageStart).toBeGreaterThan(0);
    expect(lesson.bookPageEnd).toBeGreaterThanOrEqual(lesson.bookPageStart);
    expect(lesson.identity).toBe("PLAN_CONFIRMED_TOC_NOT_VERIFIED");
  }
});

test("all 12 grade-two reading supports match one and only one official plan topic", () => {
  expect(readings.rows).toHaveLength(12);
  expect(new Set(readings.rows.map(x => x.slug)).size).toBe(12);
  for (const row of readings.rows) {
    const matching = plan.lessons.filter(p => p.kind === "reading" && p.title === row.officialTitle);
    expect(matching, row.slug).toHaveLength(1);
    expect(row.officialBookPageStart).toBe(matching[0].bookPageStart);
    expect(row.officialBookPageEnd).toBe(matching[0].bookPageEnd);
    expect(row.content).toContain("مفتاح الإجابة");
    expect(row.content.length).toBeGreaterThan(900);
    expect(row.bookTextCopied).toBe(false);
    expect(row.editorialReview).toBe("required");
  }
});

test("all three missing listening titles now have standalone original teacher scripts", () => {
  expect(listening.records).toHaveLength(3);
  expect(new Set(listening.records.map(x => x.slug)).size).toBe(3);
  for (const record of listening.records) {
    const planRow = plan.lessons.find(p => p.kind === "listening" && p.title === record.title);
    expect(planRow, record.slug).toBeTruthy();
    expect(record.content.length).toBeGreaterThan(1000);
    expect(record.content).toContain("مفتاح الإجابة");
    expect(record.bookTextCopied).toBe(false);
    expect(record.editorialReview).toBe("required");
    expect(record.planPage).toBe(planRow.sourcePdfPage);
  }
});

test("15 prior-year second-term materials remain original, free of false current-year claims", () => {
  expect(sem2.records).toHaveLength(15);
  expect(sem2.sourceAcademicYear).toBe("2025-2026");
  expect(sem2.status).toBe("ORIGINAL_SUPPORT_ONLY_OFFICIAL_2026_2027_TOC_NOT_VERIFIED");
  expect(new Set(sem2.records.map(x => x.id)).size).toBe(15);
  for (const record of sem2.records) {
    expect(record.bookTextCopied).toBe(false);
    expect(record.editorialReview).toBe("required");
    expect(record.content).toContain("مفتاح الإجابة");
    expect(record.content).toContain("فهرس 2026–2027 غير موثق");
  }
});


test("ten official scheduled grade-two review topics have exact supporting materials, including ninth", () => {
  expect(reviews.rows).toHaveLength(10);
  expect(new Set(reviews.rows.map(x => x.slug)).size).toBe(10);
  const expected = plan.lessons.filter(x => x.kind === "review");
  expect(expected).toHaveLength(10);
  expect(reviews.rows[8].slug).toBe("bh-2026-g2-s1-review09-letters4");
  expect(reviews.rows[8].needsNewLesson).toBe(true);
  for (const [index, row] of reviews.rows.entries()) {
    expect(row.officialTitle).toBe(expected[index].title);
    expect(row.bookPageStart).toBe(expected[index].bookPageStart);
    expect(row.bookPageEnd).toBe(expected[index].bookPageEnd);
    expect(row.content.length).toBeGreaterThanOrEqual(800);
    expect(row.content).toContain("مفتاح الإجابة");
    expect(row.bookTextCopied).toBe(false);
    expect(row.editorialReview).toBe("required");
  }
});
