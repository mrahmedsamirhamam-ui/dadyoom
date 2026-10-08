import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const load = name => JSON.parse(readFileSync(new URL(
  "../../data/curriculum-completeness/" + name, import.meta.url
), "utf8"));
const grammarListening = load("bahrain-grade5-s2-14-grammar-listening-original-support-pending-toc-2026-2027.json");
const readingSpeaking = load("bahrain-grade5-s2-21-reading-speaking-assessment-original-support-pending-toc-2026-2027.json");
const writing = load("bahrain-grade5-s2-31-writing-calligraphy-spelling-original-support-pending-toc-2026-2027.json");

test("all 66 Grade-5 term-two lessons have independently authored support packs", () => {
  expect(grammarListening.records).toHaveLength(14);
  expect(readingSpeaking.records).toHaveLength(21);
  expect(writing.records).toHaveLength(31);
  const all = [grammarListening,readingSpeaking,writing].flatMap(file => file.records);
  expect(all).toHaveLength(66);
  expect(new Set(all.map(row => row.id)).size).toBe(66);
  expect(grammarListening.records.filter(r => r.lessonType === "grammar")).toHaveLength(11);
  expect(grammarListening.records.filter(r => r.lessonType === "listening")).toHaveLength(3);
  expect(readingSpeaking.records.filter(r => r.lessonType === "reading")).toHaveLength(10);
  expect(readingSpeaking.records.filter(r => r.lessonType === "speaking")).toHaveLength(8);
  expect(readingSpeaking.records.filter(r => r.lessonType === "assessment")).toHaveLength(3);
  expect(writing.records.filter(r => r.category === "spelling")).toHaveLength(7);
  expect(writing.records.filter(r => r.category === "handwriting")).toHaveLength(12);
  expect(writing.records.filter(r => r.category === "composition")).toHaveLength(12);
});

test("historical grade-five term-two sources are never labeled current-year textbook verified", () => {
  for (const source of [grammarListening,readingSpeaking,writing]) {
    expect(source.countryCode).toBe("BH");
    expect(source.grade).toBe(5);
    expect(source.semester).toBe(2);
    expect(source.sourceAcademicYear).toBe("2025-2026");
    expect(source.targetAcademicYear).toBe("2026-2027");
    for (const record of source.records) {
      expect(record.content.length).toBeGreaterThanOrEqual(1100);
      expect(record.content).toContain("مفتاح الإجابة");
      expect(record.bookTextCopied).toBe(false);
      expect(record.editorialReview).toBe("required");
      expect(record.sourceStatus).toMatch(/NOT_VERIFIED|PENDING/);
      expect(record.content).toContain("2026–2027");
      expect(record.content).toContain("2025–2026");
    }
  }
});
