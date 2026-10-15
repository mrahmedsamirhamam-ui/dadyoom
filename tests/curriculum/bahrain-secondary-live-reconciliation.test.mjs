import { readFileSync } from "node:fs";
import { describe,expect,test } from "vitest";
const r=JSON.parse(readFileSync("data/curriculum-completeness/bahrain-book-completeness-2026-2027.json","utf8"));
describe("Bahrain secondary live source scope reconciliation",()=>{
 test("includes all 24 secondary term-track-grade scopes without book-completion claims",()=>{
 const rows=r.books.filter(x=>x.program==="الثانوي العام/النوعي");
 expect(rows).toHaveLength(24);
 expect(r.summary.secondaryLiveReconciledScopes).toBe(24);
 for(const row of rows){
   const s=row.liveSnapshotReconciliation;
   expect(s).toBeDefined();
   expect(s.verifiedAt).toBe("2026-10-15");
   expect(s.sourceScope).toContain("secondary-grade-track-semester");
   expect(s.currentPublishedOfficialScopeLessons).toBeGreaterThanOrEqual(0);
   expect(s.planScheduledLessons+s.bookUnscheduledLessons).toBe(s.currentPublishedOfficialScopeLessons);
   expect(s.tocValidated).toBe(false);
   expect(s.sourceEditionValidated).toBe(false);
   expect(row.status).not.toBe("COMPLETE_BOOK");
 }
 expect(r.summary.completeBooks).toBe(0);
 expect(r.summary.bahrainComplete).toBe(false);
 });
});
