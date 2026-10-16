import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const read = path => readFileSync(path, "utf8");
const api = read("app/api/lessons/search/route.ts");
const search = read("components/search/LessonSearchClient.tsx");
const page = read("app/search/page.tsx");
const catalog = read("app/courses/CurriculumCatalogClient.tsx");
const nav = read("components/navigation/CompactNavigation.tsx");
const index = read("app/curriculum/page.tsx");
const country = read("app/curriculum/[country]/page.tsx");
const grade = read("app/curriculum/[country]/[grade]/page.tsx");
const lesson = read("app/lessons/[id]/page.tsx");

describe("Lesson search queries real published content", () => {
  test("does not rely on SEO-only lessons or drafts, and validates country and grade", () => {
    expect(api).toContain('.from("lessons")');
    expect(api).toContain('.eq("status", "published")');
    expect(api).not.toContain('.from("seo_indexable_lessons_fast")');
    expect(api).toContain("ARAB_COUNTRY_CODES");
    expect(api).toContain("maxGradeForCountry(countryCode)");
    expect(api).toContain('units.grades.curricula.countries.code');
    expect(api).toContain('units.grades.grade_number');
    expect(api).toContain("country.code !== countryCode");
    expect(api).toContain("schoolGrade.grade_number !== grade");
    expect(api).toContain("rows.slice(0, pageSize)");
    expect(api).toContain("hasMore: rows.length > pageSize");
  });

  test("search page sends filters and renders the true lesson link plus context", () => {
    expect(page).toContain("searchParams: Promise<Params>");
    expect(page).toContain("<LessonSearchClient");
    expect(search).toContain('role="search"');
    expect(search).toContain('action="/search"');
    expect(search).toContain('name="q"');
    expect(search).toContain('name="country"');
    expect(search).toContain('name="grade"');
    expect(search).toContain("lesson.href");
    expect(search).toContain("lesson.country");
    expect(search).toContain("lesson.unit");
    expect(search).toContain("lesson.curriculum");
    expect(search).toContain("lesson.semester === 1");
    expect(search).toContain("lesson.semester === 2");
    expect(search).toContain("lesson.semester === 3");
    expect(api).toContain("semester: item.semester ?? unit.semester ?? null");
    expect(search).toContain("hasMore");
    expect(search).toContain("loadMore");
  });

  test("magnifier available in global menu and at country, grade, lesson directories", () => {
    expect(nav).toContain('href="/search"');
    expect(nav).toContain('aria-label={language === "en" ? "Search Arabic lessons" : "ابحث عن درس"}');
    expect(index).toContain('href="/search"');
    expect(country).toContain('/search?country=');
    expect(grade).toContain('/search?country=');
    expect(lesson).toContain('ابحث عن درس آخر');
  });

  test("scoped filter uses only the already-selected grade/term/unit", () => {
    expect(catalog).toContain("normalizeLessonSearch");
    expect(catalog).toContain("setLessonSearch(event.target.value)");
    expect(catalog).toContain('aria-label="البحث داخل دروس الصف"');
    expect(catalog).toContain('const visibleUnits = searchedTitle');
    expect(catalog).toContain('item.lessons.filter((lesson)');
    expect(catalog).toContain("countCatalogItems(visibleUnits)");
    expect(catalog).toContain("visibleUnits.map((item)");
    expect(catalog).toContain("لا توجد دروس تطابق كلمات البحث");
  });
});
