import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const report=JSON.parse(readFileSync("data/curriculum-completeness/bahrain-book-completeness-2026-2027.json","utf8"));
describe("Grade 7 term-2 historical-plan enrichment is not missing official lessons",()=>{
 it("records 37 published enrichment lessons separately from zero current official-scope entries",()=>{
  const row=report.books.find(x=>x.program==="التعليم الأساسي"&&x.grade===7&&x.semesterOrBookPart===2);
  expect(row.liveSnapshotReconciliation.currentPublishedOfficialScopeLessons).toBe(0);
  expect(row.liveSnapshotReconciliation.publishedIndependentEnrichmentWithHistoricalPlan).toBe(37);
  expect(row.liveSnapshotReconciliation.historicalPlanUrl).toContain("plans2-2025-2026");
  expect(row.liveSnapshotReconciliation.tocValidated).toBe(false);
  expect(row.status).not.toBe("COMPLETE_BOOK");
 });
});
