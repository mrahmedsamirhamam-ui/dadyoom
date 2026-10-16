import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const src=readFileSync("app/admin/lessons/page.tsx","utf8");
const report=readFileSync("app/admin/curriculum/coverage/countries/page.tsx","utf8");
describe("Curriculum evidence gaps are actionable with scoped server-side review filters",()=>{
 test("filters review flags in PostgREST BEFORE calculating page range",()=>{
   for (const value of ["missing-pages","missing-link","generic-intro","unresolved-ocr"])
     expect(src).toContain(value);
   const q=src.slice(src.indexOf("if (filters.review"),src.indexOf("const from ="));
   expect(q).toContain('query.or("source_page_start.is.null,source_page_end.is.null")');
   expect(q).toContain('query.is("source_pdf_url", null)');
   expect(q).toContain('query.like("content", "يتناول هذا الدرس موضوع «%")');
   expect(q).toContain('query.ilike("content", "%مدخل OCR غير محسوم%")');
   expect(src.indexOf('if (filters.review')).toBeLessThan(src.indexOf("const from ="));
 });
 test("pagination retains review selection rather than silently reverting",()=>{
   expect(src).toContain('"country", "grade", "review"');
   expect(src).toContain('name="review" defaultValue={filters.review}');
 });
 test("country summary links to review queues for that country",()=>{
   expect(report).toContain("&review=missing-pages");
   expect(report).toContain("&review=generic-intro");
   expect(report).toContain("&review=unresolved-ocr");
   expect(report).toContain("row.published_missing_pages > 0");
 });
});
