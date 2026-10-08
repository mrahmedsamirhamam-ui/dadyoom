import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const load = filename => JSON.parse(readFileSync(
  new URL("../../data/curriculum-completeness/" + filename, import.meta.url), "utf8"
));
const audio = load("bahrain-grade5-s1-three-official-listening-original-support-2026-2027.json");
const grammar = load("bahrain-grade5-s1-27-grammar-spelling-original-support-2026-2027.json");
const reading = load("bahrain-grade5-s1-13-core-reading-original-support-2026-2027.json");

test("all three current schedule Grade-5 listening topics have uniquely titled supporting activities", () => {
  expect(audio.countryCode).toBe("BH");
  expect(audio.grade).toBe(5);
  expect(audio.academicYear).toBe("2026-2027");
  expect(audio.records).toHaveLength(3);
  expect(audio.records.map(x => x.week)).toEqual([2, 6, 11]);
  expect(new Set(audio.records.map(x => x.slug)).size).toBe(3);
  for (const item of audio.records) {
    expect(item.planpage).toBeGreaterThanOrEqual(22);
    expect(item.planpage).toBeLessThanOrEqual(24);
    expect(item.content.length).toBeGreaterThanOrEqual(1200);
    expect(item.content).toContain("مفتاح الإجابة");
    expect(item.bookTextCopied).toBe(false);
    expect(item.editorialReview).toBe("required");
    expect(item.sourceStatus).toContain("NOT_OFFICIAL_BOOK");
  }
});

test("eighteen grammar and nine spelling grade-five lessons contain separate answer-guided support", () => {
  expect(grammar.records).toHaveLength(27);
  expect(grammar.records.filter(x => x.lessonType === "grammar")).toHaveLength(18);
  expect(grammar.records.filter(x => x.lessonType === "spelling")).toHaveLength(9);
  expect(new Set(grammar.records.map(x => x.slug)).size).toBe(27);
  for (const item of grammar.records) {
    expect(item.content.length).toBeGreaterThanOrEqual(1100);
    expect(item.content).toContain("مفتاح الإجابة");
    expect(item.bookTextCopied).toBe(false);
    expect(item.editorialReview).toBe("required");
    expect(item.sourceStatus).toContain("NOT_VERIFIED");
  }
});

test("thirteen book-plan reading topics have clear provenance and original comprehension texts", () => {
  expect(reading.records).toHaveLength(13);
  expect(new Set(reading.records.map(x => x.officialPlanTitle)).size).toBe(13);
  expect(new Set(reading.records.map(x => x.slug)).size).toBe(13);
  for (const item of reading.records) {
    expect(item.bookPageFrom).toBeGreaterThan(0);
    expect(item.bookPageTo).toBeGreaterThanOrEqual(item.bookPageFrom);
    expect(item.content.length).toBeGreaterThanOrEqual(1100);
    expect(item.content).toContain("مفتاح الإجابة");
    expect(item.bookTextCopied).toBe(false);
    expect(item.editorialReview).toBe("required");
    expect(item.sourceStatus).toContain("NOT_VERIFIED");
  }
});
