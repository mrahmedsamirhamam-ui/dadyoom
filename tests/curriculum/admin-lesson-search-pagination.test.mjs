import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const p=readFileSync("app/admin/lessons/page.tsx","utf8");
describe("all curriculum lessons available to reviewers via bounded filters and paging",()=>{
 test("server pages through the entire database rather than showing only first 50",()=>{
   expect(p).toContain("const PAGE_SIZE = 30");
   expect(p).toContain(".range(from, from + PAGE_SIZE - 1)");
   expect(p).toContain('count: "exact"');
   expect(p).toContain("page < totalPages");
   expect(p).not.toMatch(/from\("lessons"\)[\\s\\S]{0,1600}\\.limit\\(50\\)/u);
 });
 test("filters by country grade status and literal title search before paging",()=>{
   expect(p).toContain('units!inner(title,grades!inner(');
   expect(p).toContain('query.eq("units.grades.curricula.countries.code", filters.country)');
   expect(p).toContain('query.eq("units.grades.grade_number", Number(filters.grade))');
   expect(p).toContain('query.eq("status", filters.status)');
   expect(p).toContain('query.ilike("title"');
 });
 test("links every matching lesson to source editor without declaring TOC certification",()=>{
   expect(p).toContain("فتح الدرس ←");
   expect(p).toContain("/admin/curriculum/coverage/toc-review");
   expect(p).toContain("لا يعني «مطابق لفهرس الكتاب الرسمي»");
 });
});
