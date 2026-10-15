import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const audit=JSON.parse(readFileSync("data/curriculum-completeness/bahrain-book-completeness-2026-2027.json","utf8"));
describe("Bahrain G2 historical source evidence is retained",()=>{
 it("preserves 7 October and 10 October audit, and the four added titles",()=>{
  const r=audit.books.find(x=>x.program==="التعليم الأساسي"&&x.grade===2&&x.semesterOrBookPart===1);
  expect(r.liveSnapshotReconciliation.verifiedAt).toBe("2026-10-15");
  const historical=r.liveSnapshotReconciliation.priorRecordedEvidence;
  expect(historical.verifiedAt).toBe("2026-10-10");
  expect(historical.previousSnapshotAt).toBe("2026-10-07");
  expect(historical.previousPublishedLessonCount).toBe(40);
  expect(historical.currentPublishedLessonCount).toBe(44);
  expect(historical.addedLessonTitles).toHaveLength(4);
  expect(historical.tocValidated).toBe(false);
 });
});
