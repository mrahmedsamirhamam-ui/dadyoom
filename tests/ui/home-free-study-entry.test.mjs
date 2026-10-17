import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const home=readFileSync("app/page.tsx","utf8");
const study=readFileSync("app/study/page.tsx","utf8");
describe("Search-arriving learner sees a real free study start",()=>{
 test("homepage has study above login-only workflows and in menu",()=>{
  expect(home).toContain('href: "/study", label: "ذاكر العربية الآن"');
  expect(home).toContain('href="/study"');
  expect(home).toContain("ذاكر العربية الآن — دون تسجيل");
  expect(home).toContain("استكشف مناهج الدول");
  expect(home).toContain("ابدأ رحلتك");
 });
 test("the link opens country and grade selection without membership",()=>{
  expect(study).toContain("اختر صفك لبدء المذاكرة");
  expect(study).toContain("ليست نسخًا من الكتب الوزارية");
 });
});
