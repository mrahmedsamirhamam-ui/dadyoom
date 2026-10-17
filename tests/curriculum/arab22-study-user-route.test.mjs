import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const read = path => readFileSync(path, "utf8");
const page = read("app/study/[country]/[grade]/page.tsx");
describe("22-country original Arabic study route", () => {
  test("only reads published Dadyoom-authored lessons in matching active country/grade", () => {
    expect(page).toContain("ARAB_COUNTRY_CODES");
    expect(page).toContain("maxGradeForCountry(country)");
    expect(page).toContain('.eq("status", "published")');
    expect(page).toContain('.like("content", "حزمة ضاديوم الموضوعية المتخصصة%")');
    expect(page).toContain('country.code === place.country');
    expect(page).toContain("robots: { index: false, follow: true }");
  });
  test("offers working examples, exercises, answer keys and real lesson links", () => {
    for (const key of ["أتعلم من مثال محلول:", "أطبق بنفسي:", "مفتاح المراجعة الذاتية:", "<details", "أظهر الإجابة بعد المحاولة", '"/lessons/" + skill.id']) expect(page).toContain(key);
  });
  test("can be opened from all 22 countries and the main course browser", () => {
    expect(read("app/curriculum/page.tsx")).toContain('"/study/" + country.code.toLowerCase() + "/1"');
    expect(read("app/curriculum/[country]/page.tsx")).toContain('"/study/" + info.code.toLowerCase() + "/1"');
    expect(read("app/courses/page.tsx")).toContain('"/study/" + (country?.code ?? "BH").toLowerCase() + "/" + grade');
  });
});
