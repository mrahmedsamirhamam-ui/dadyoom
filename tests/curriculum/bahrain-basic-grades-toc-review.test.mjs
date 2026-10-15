import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
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
});
