import { readFileSync } from "node:fs";
import { test, expect } from "vitest";
const root = "../../data/curriculum-completeness/";
const load = name => JSON.parse(readFileSync(new URL(root + name, import.meta.url), "utf8"));
const sources = [["الأول محو الأمية",25,"bahrain-continuing-arabic-literacy1-drafts-2026-2027.json"],["الثاني محو الأمية",32,"bahrain-continuing-arabic-literacy2-drafts-2026-2027.json"],["الأول متابعة",12,"bahrain-continuing-followup1-original-drafts-part1-2026-2027.json"],["الأول متابعة",13,"bahrain-continuing-followup1-original-drafts-part2-2026-2027.json"],["الأول متابعة",18,"bahrain-continuing-followup1-original-drafts-part3-2026-2027.json"],["الثاني متابعة",10,"bahrain-continuing-followup2-original-drafts-part1-2026-2027.json"],["الثاني متابعة",17,"bahrain-continuing-followup2-original-drafts-part2-2026-2027.json"],["الأول تقوية",14,"bahrain-continuing-reinforcement1-original-drafts-part1-2026-2027.json"],["الأول تقوية",7,"bahrain-continuing-reinforcement1-original-drafts-part2a-2026-2027.json"],["الأول تقوية",7,"bahrain-continuing-reinforcement1-original-drafts-part2b-2026-2027.json"],["الثاني تقوية",11,"bahrain-continuing-reinforcement2-original-drafts-part1-2026-2027.json"],["الثاني تقوية",11,"bahrain-continuing-reinforcement2-original-drafts-part2-2026-2027.json"]];
const counts = Object.fromEntries([{"level":"الأول محو الأمية","titles":25},{"level":"الثاني محو الأمية","titles":32},{"level":"الأول متابعة","titles":43},{"level":"الثاني متابعة","titles":27},{"level":"الأول تقوية","titles":28},{"level":"الثاني تقوية","titles":22}].map(l=>[l.level,l.titles]));
test("all 177 Bahrain continuing titles have distinct, scoped and unreviewed original learning drafts",()=>{
 const byLevel = new Map();
 for(const [level, count, file] of sources) {
  const d = load(file);
  const rows = d.rows ?? d.lessons ?? [];
  expect(d.level).toBe(level);
  expect(rows).toHaveLength(count);
  for(const r of rows){
   expect(Number.isInteger(r.order)).toBe(true);
   expect(r.order).toBeGreaterThan(0);
   expect(typeof r.title).toBe("string");
   expect(r.title.length).toBeGreaterThan(4);
   expect(r.content.length).toBeGreaterThan(350);
   expect(r.learning_objectives.length).toBeGreaterThanOrEqual(3);
   expect(r.vocabulary.length).toBeGreaterThanOrEqual(2);
   expect(r.editorialReview).toBe("required");
   expect(r.bookTextCopied).toBe(false);
   if (r.quiz) {
    expect(r.quiz.options).toHaveLength(4);
    expect(r.quiz.options.filter(x=>x===r.quiz.correct)).toHaveLength(1);
   }
   const mapped=byLevel.get(level)??new Map();
   expect(mapped.has(r.order),level+" duplicate position "+r.order).toBe(false);
   mapped.set(r.order,r.title);
   byLevel.set(level,mapped);
  }
 }
 let grandTotal=0;
 for(const [level,total] of Object.entries(counts)){
  const actual=byLevel.get(level);
  expect(actual.size).toBe(total);
  expect([...actual.keys()].sort((a,b)=>a-b)).toEqual(Array.from({length:total},(_,i)=>i+1));
  grandTotal+=actual.size;
 }
 expect(grandTotal).toBe(177);
});
test("177 authored drafts do not falsely mark any official Bahrain book complete or pass editorial review",()=>{
 const d=load("bahrain-continuing-content-readiness-2026-2027.json");
 const official=load("bahrain-book-completeness-2026-2027.json");
 expect(d.authoredDrafts).toBe(177);
 expect(d.reviewState).toBe("PENDING_EDUCATIONAL_EDITORIAL_REVIEW");
 expect(d.textbookStatus).toBe("NOT_COMPLETE_BOOK");
 expect(d.officialBookTOCParityVerified).toBe(false);
 expect(d.currentSemester2Verified).toBe(false);
 expect(official.summary.completeBooks).toBe(0);
 expect(official.summary.auditRows).toBe(56);
});
