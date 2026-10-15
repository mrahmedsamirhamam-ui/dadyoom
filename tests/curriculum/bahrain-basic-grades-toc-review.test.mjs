import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { inspectTocMatches, normalizeTocTitle } from "../../lib/curriculum/toc-title-matching";
const main = readFileSync("app/admin/curriculum/coverage/toc-review/basic/[grade]/page.tsx","utf8");
const index = readFileSync("app/admin/curriculum/coverage/toc-review/page.tsx","utf8");
const bridge = readFileSync("app/admin/curriculum/coverage/toc-review/grade-2/page.tsx","utf8");
const audit = JSON.parse(readFileSync("data/curriculum-completeness/bahrain-book-completeness-2026-2027.json","utf8"));

describe("Bahrain all basic-grade textbook title comparison", () => {
 test("supports all 9 basic grades and both audited book parts",()=>{
   expect(main).toContain("grade < 1 || grade > 9");
   expect(main).toContain('row.program === "التعليم الأساسي"');
   expect(main).toContain("book.semesterOrBookPart");
   expect(audit.books.filter(x=>x.program==="التعليم الأساسي")).toHaveLength(18);
   expect(index).toContain('/toc-review/basic/');
 });
 test("keeps MYP, secondary pathways and Dadyoom enrichment out of basic matching",()=>{
   expect(main).toContain('row.name_ar === "اللغة العربية"');
   expect(main).toContain('inspectTocMatches(saved.toc_outline, candidates, book.semesterOrBookPart)');
   expect(main).toContain('مرشح عنوان فقط — لا اعتماد تلقائي');
   expect(main).not.toContain('.from("lessons").update(');
 });
 test("retains the grade-2 legacy review route",()=>{
   expect(bridge).toContain('redirect("/admin/curriculum/coverage/toc-review/basic/2")');
 });
 test("removes vocalization without conflating hamza or punctuation in official headings",()=>{
   expect(normalizeTocTitle("قَرَأَتْ أُمّي")).toBe("قرأت أمي");
   expect(normalizeTocTitle("رسالة أمي")).not.toBe(normalizeTocTitle("رسالة امي"));
   expect(normalizeTocTitle("نشاط (1)")).not.toBe(normalizeTocTitle("نشاط 1"));
   expect(normalizeTocTitle("  أُمِّي  ")).toBe("أمي");
 });
 test("never offers an unverified hamza or punctuation near-match as a unique candidate",()=>{
   const lessons = [
     {id:"one",title:"رسالة أمي",semester:1,official_content_scope:"plan-scheduled"},
     {id:"two",title:"نشاط (1)",semester:1,official_content_scope:"official-book-unscheduled"},
     {id:"other-term",title:"عنوان الفصل الثاني",semester:2,official_content_scope:"plan-scheduled"},
     {id:"enrichment",title:"ضاديوم",semester:1,official_content_scope:"enrichment"},
   ];
   const results = inspectTocMatches("رسالة امي\nنشاط 1\nعنوان الفصل الثاني\nضاديوم\nرِسالة أمي",lessons,1);
   expect(results.map(x=>x.status)).toEqual([
     "missing", "missing", "missing", "missing", "candidate_only",
   ]);
   expect(results[4].lessonId).toBe("one");
 });
 test("flags duplicate outline headings instead of matching either entry",()=>{
   const lessons=[{id:"original",title:"أمي",semester:1,official_content_scope:"plan-scheduled"}];
   expect(inspectTocMatches("أمي\nأُمّي",lessons,1).map(x=>x.status))
     .toEqual(["ambiguous","ambiguous"]);
 });
});
