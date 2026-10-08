import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const load = file => JSON.parse(readFileSync(
  new URL("../../data/curriculum-completeness/" + file, import.meta.url), "utf8"
));
const grammar = load("bahrain-grade6-s1-26-grammar-original-support-2026-2027.json");
const reading = load("bahrain-grade6-s1-20-reading-and-ocr-original-support-2026-2027.json");
const writing = load("bahrain-grade6-s1-eight-writing-original-support-2026-2027.json");
const listening = load("bahrain-grade6-s1-three-missing-official-listening-original-support-2026-2027.json");

test("57 published grade-six term-one records map to 3 new listening, 26 grammar, 20 reading, 8 writing", () => {
  expect(listening.records).toHaveLength(3);
  expect(grammar.records).toHaveLength(26);
  expect(reading.records).toHaveLength(20);
  expect(writing.records).toHaveLength(8);
  expect(reading.records.filter(x => x.planScheduledTopic)).toHaveLength(14);
  expect(reading.records.filter(x => !x.planScheduledTopic)).toHaveLength(6);
  const ids = [...grammar.records,...reading.records,...writing.records].map(x => x.id);
  expect(new Set(ids).size).toBe(54);
});

test("grade-six authoring maintains original-only, answer-key and unverified-book guards", () => {
  for (const source of [listening,grammar,reading,writing]) {
    expect(source.countryCode).toBe("BH");
    expect(source.grade).toBe(6);
    expect(source.semester).toBe(1);
    expect(source.academicYear).toBe("2026-2027");
    for (const row of source.records) {
      expect(row.content.length).toBeGreaterThanOrEqual(1100);
      expect(row.content).toContain("مفتاح الإجابة");
      expect(row.bookTextCopied).toBe(false);
      expect(row.editorialReview).toBe("required");
    }
  }
  for (const row of reading.records.filter(x => !x.planScheduledTopic)) {
    expect(row.sourceStatus).toBe("OCR_FRAGMENT_NOT_VERIFIED_AS_INDEPENDENT_BOOK_LESSON");
  }
});
