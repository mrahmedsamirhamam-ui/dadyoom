import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const readData = file => JSON.parse(readFileSync(new URL(
  "../../data/curriculum-completeness/" + file, import.meta.url
), "utf8"));

const grammar = readData("bahrain-grade7-s1-20-official-grammar-original-support-2026-2027.json");
const literacy = readData("bahrain-grade7-s1-21-spelling-handwriting-original-support-2026-2027.json");
const reading = readData("bahrain-grade7-s1-15-reading-and-ocr-original-support-2026-2027.json");
const writing = readData("bahrain-grade7-s1-ten-writing-existing-and-missing-original-support-2026-2027.json");

test("grade-seven official first-term topics have 47 genuinely new grammar, spelling, handwriting and writing-support records", () => {
  expect(grammar.records).toHaveLength(20);
  expect(literacy.records).toHaveLength(21);
  expect(literacy.records.filter(r => r.lessonType === "spelling")).toHaveLength(11);
  expect(literacy.records.filter(r => r.lessonType === "writing")).toHaveLength(10);
  expect(writing.newRows).toHaveLength(6);
  const newRows = [...grammar.records,...literacy.records,...writing.newRows];
  expect(new Set(newRows.map(r => r.slug)).size).toBe(47);
});

test("15 original reading supplements and four legacy writing supplements maintain explicit OCR safeguards", () => {
  expect(reading.records).toHaveLength(15);
  expect(reading.records.filter(r => r.canonicalOfficialReading)).toHaveLength(11);
  expect(reading.records.filter(r => !r.canonicalOfficialReading)).toHaveLength(4);
  expect(writing.existingRows).toHaveLength(4);
  expect(writing.existingRows.filter(r => !r.canonicalOfficialSkill)).toHaveLength(1);
  for (const r of reading.records.filter(r => !r.canonicalOfficialReading)) {
    expect(r.sourceStatus).toContain("NOT_A_CANONICAL_READING");
  }
  expect(writing.existingRows.filter(r => !r.canonicalOfficialSkill)[0].sourceStatus).toContain("LIKELY_DUPLICATE");
});

test("authored grade-seven material is original, answer-guided and does not claim textbook page completion", () => {
  expect(grammar.academicYear).toBe("2026-2027");
  expect(literacy.academicYear).toBe("2026-2027");
  expect(reading.academicYear).toBe("2026-2027");
  expect(writing.academicYear).toBe("2026-2027");
  const all = [
    ...grammar.records,...literacy.records,...reading.records,
    ...writing.existingRows,...writing.newRows
  ];
  expect(all).toHaveLength(66);
  for (const r of all) {
    expect(r.content.length).toBeGreaterThanOrEqual(1150);
    expect(r.content).toContain("مفتاح الإجابة");
    expect(r.bookTextCopied).toBe(false);
    expect(r.editorialReview).toBe("required");
    expect(r.content).toContain("2026–2027");
  }
});
