import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const data=JSON.parse(readFileSync("data/curriculum-completeness/bahrain-book-completeness-2026-2027.json","utf8"));
describe("Bahrain live inventory for all 56 book/track/term scopes",()=>{
 it("covers 18 basic, 2 MYP, 24 secondary and 12 continuing with no false book completion",()=>{
  const counts={};
  for(const row of data.books)counts[row.program]=(counts[row.program]??0)+1;
  expect(counts["التعليم الأساسي"]).toBe(18);
  expect(counts["برنامج السنوات المتوسطة MYP"]).toBe(2);
  expect(counts["الثانوي العام/النوعي"]).toBe(24);
  expect(counts["التعليم المستمر"]).toBe(12);
  expect(data.summary.liveScopeReconciled).toBe(56);
  expect(data.summary.completeBooks).toBe(0);
  expect(data.summary.bahrainComplete).toBe(false);
  expect(data.books.every(row=>row.liveSnapshotReconciliation &&
    row.liveSnapshotReconciliation.tocValidated === false &&
    row.liveSnapshotReconciliation.sourceEditionValidated === false &&
    row.status !== "COMPLETE_BOOK")).toBe(true);
 });
 it("counts scheduled and unscheduled official lessons without enrichment",()=>{
  for(const row of data.books){
   const s=row.liveSnapshotReconciliation;
   expect(s.currentPublishedOfficialScopeLessons).toBe(s.planScheduledLessons+s.bookUnscheduledLessons);
   expect(s.currentPublishedOfficialScopeLessons).toBeGreaterThanOrEqual(0);
   if(row.currentPlanPublished===false){
    expect(row.scheduledItems).toBe(0);
   }
  }
 });
});
