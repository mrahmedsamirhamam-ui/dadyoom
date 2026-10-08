import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const load = file => JSON.parse(readFileSync(new URL(
  "../../data/curriculum-completeness/" + file, import.meta.url
), "utf8"));

const language = load("bahrain-grade7-s2-19-grammar-reading-assessment-original-support-pending-toc-2026-2027.json");
const writing = load("bahrain-grade7-s2-18-spelling-writing-calligraphy-original-support-pending-toc-2026-2027.json");

test("37 Grade-7 second-term existing records have distinct topic-aware supports", () => {
  expect(language.records).toHaveLength(19);
  expect(writing.records).toHaveLength(18);
  const all = [...language.records,...writing.records];
  expect(new Set(all.map(x => x.id)).size).toBe(37);
  expect(language.records.filter(x => x.lessonType === "grammar")).toHaveLength(10);
  expect(language.records.filter(x => x.lessonType === "reading")).toHaveLength(8);
  expect(language.records.filter(x => x.lessonType === "assessment")).toHaveLength(1);
  expect(writing.records.filter(x => x.category === "spelling")).toHaveLength(8);
  expect(writing.records.filter(x => x.category === "handwriting")).toHaveLength(4);
  expect(writing.records.filter(x => x.category === "composition")).toHaveLength(6);
});

test("historical source never masquerades as verified 2026–27 textbook contents", () => {
  for (const source of [language,writing]) {
    expect(source.countryCode).toBe("BH");
    expect(source.grade).toBe(7);
    expect(source.semester).toBe(2);
    expect(source.sourceAcademicYear).toBe("2025-2026");
    expect(source.targetAcademicYear).toBe("2026-2027");
    for (const x of source.records) {
      expect(x.content.length).toBeGreaterThanOrEqual(1150);
      expect(x.content).toContain("مفتاح الإجابة");
      expect(x.bookTextCopied).toBe(false);
      expect(x.editorialReview).toBe("required");
      expect(x.sourceStatus).toMatch(/NOT_VERIFIED/);
      expect(x.content).toContain("2025–2026");
      expect(x.content).toContain("2026–2027");
    }
  }
});

test("ambiguous grammatical label stays unverified until current-book reconciliation", () => {
  expect(writing.records.filter(x => x.officialTitleNeedsReconciliation)).toHaveLength(1);
  expect(writing.records.find(x => x.officialTitleNeedsReconciliation)?.title).toBe(
    "كتابة التاء في آخر جمع الاسم المنقوص"
  );
});
