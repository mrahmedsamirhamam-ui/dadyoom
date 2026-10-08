import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

const evidence = JSON.parse(readFileSync(new URL(
  "../../data/curriculum-completeness/bahrain-grade4-s1-10-missing-official-listening-original-support-2026-2027.json",
  import.meta.url,
), "utf8"));

test("official Bahrain grade-four first-term listening schedule has ten distinct original support packs", () => {
  expect(evidence.countryCode).toBe("BH");
  expect(evidence.academicYear).toBe("2026-2027");
  expect(evidence.grade).toBe(4);
  expect(evidence.semester).toBe(1);
  expect(evidence.status).toBe("10_PLAN_LISTENING_ENTRIES_SUPPORTED_WITH_ORIGINAL_TEXT_TEXTBOOK_TOC_NOT_COMPLETE");
  expect(evidence.records).toHaveLength(10);
  expect(new Set(evidence.records.map(x => x.slug)).size).toBe(10);
  expect(new Set(evidence.records.map(x => x.week)).size).toBe(10);
  expect(evidence.records.map(x => x.week)).toEqual([1,2,3,4,5,6,7,9,11,13]);
});

test("all ten audio scripts are authored support, traceable to official plan pages, not copied textbook content", () => {
  for (const item of evidence.records) {
    expect(item.title).toMatch(/^الاستماع:/u);
    expect(item.content.length).toBeGreaterThanOrEqual(950);
    expect(item.content).toContain("مفتاح الإجابة");
    expect(item.content).toContain("نص استماع تعليمي أصلي لضاديوم");
    expect(item.bookTextCopied).toBe(false);
    expect(item.editorialReview).toBe("required");
    expect(item.sourceStatus).toContain("TEXTBOOK_TOC_PENDING");
    expect(item.planPage).toBeGreaterThanOrEqual(18);
    expect(item.planPage).toBeLessThanOrEqual(21);
    expect(item.bookTo).toBeGreaterThanOrEqual(item.bookFrom);
  }
});
