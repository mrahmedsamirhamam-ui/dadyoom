import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const proof=JSON.parse(readFileSync("data/curriculum-completeness/bahrain-grade1-title-reconciliation-2026-2027.json","utf8"));
const outline=JSON.parse(readFileSync("data/bahrain-arabic/grade-01-sem1-curriculum.json","utf8"));
const canonical=JSON.parse(readFileSync("data/curriculum-completeness/bahrain-book-completeness-2026-2027.json","utf8"));
describe("Bahrain Grade 1 source-backed name candidates",()=>{
 it("checks distinct 18 recorded names without alleging book completion",()=>{
  const titles=outline.units.flatMap(u=>u.lessons.map(l=>l.title));
  expect(proof.entries).toHaveLength(18);
  expect(new Set(proof.entries.map(x=>x.lessonId)).size).toBe(18);
  expect(proof.entries.map(x=>x.title)).toEqual(titles);
  expect(proof.entries.every(x=>x.titleCandidate && x.bookLinkRecorded)).toBe(true);
  expect(proof.bookUrl).toBe(outline.book.source_url);
  expect(proof.status).toBe("PRELIMINARY_TITLE_CANDIDATES_ONLY");
  expect(proof.independentFullTocValidated).toBe(false);
  expect(proof.contentMatchedPageByPage).toBe(false);
  expect(proof.bookComplete).toBe(false);
 });
 it("does not convert a title match into a COMPLETE_BOOK flag",()=>{
  expect(canonical.summary.completeBooks).toBe(0);
  expect(canonical.summary.bahrainComplete).toBe(false);
 });
});
