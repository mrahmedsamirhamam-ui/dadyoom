import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const page=readFileSync("app/study/page.tsx","utf8");
const country=readFileSync("app/study/[country]/[grade]/page.tsx","utf8");
const index=readFileSync("app/curriculum/page.tsx","utf8");
describe("Twenty-two country usable student entry points",()=>{
 test("real 22-country route links all grades with grade-specific limits",()=>{
  expect(page).toContain("getArabicCountryOptions().filter");
  expect(page).toContain("ARAB_COUNTRY_CODES");
  expect(page).toContain("maxGradeForCountry(country.code)");
  expect(page).toContain('href={"/study/" + country.code.toLowerCase() + "/" + grade}');
  expect(page).toContain("مهارة متاحة للتدريب");
  expect(page).toContain("ليست نسخًا من الكتب الوزارية");
 });
 test("study shows actual question and answer, never presents it as book verified",()=>{
  expect(country).toContain('.eq("status", "published")');
  expect(country).toContain("مفتاح المراجعة الذاتية:");
  expect(country).toContain("<details");
  expect(country).toContain("غير منقولة عن الكتاب الوزاري");
  expect(index).toContain('href="/study"');
 });
});
