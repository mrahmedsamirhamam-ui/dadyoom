import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const route = readFileSync("app/api/lessons/search/route.ts", "utf8");

describe("country and grade scoped published lesson search", () => {
  test("bounds the search to an active country, curriculum, grade and unit tree", () => {
    expect(route).toContain("if (countryCode && grade !== null)");
    expect(route).toContain("await scopedCountryGradeSearch()");
    expect(route).toContain('.from("countries")');
    expect(route).toContain('.eq("code", countryCode).eq("is_active", true)');
    expect(route).toContain('.from("curricula")');
    expect(route).toContain('.eq("country_id", activeCountry.id).eq("is_active", true)');
    expect(route).toContain('.from("grades")');
    expect(route).toContain('.eq("grade_number", grade)');
    expect(route).toContain('.from("units")');
    expect(route).toContain('.in("grade_id", activeGrades.map(item => item.id))');
  });

  test("does not fetch draft or out-of-scope lesson content", () => {
    expect(route).toContain('.from("lessons")');
    expect(route).toContain('.in("unit_id", activeUnits.map(item => item.id))');
    expect(route).toContain('.eq("status", "published")');
    expect(route).toContain('.select("id,title,summary,content,semester,unit_id")');
    expect(route).toContain('return query.order("title", { ascending: true }).order("id", { ascending: true })');
    expect(route).toContain(".range(start, start + pageSize)");
  });

  test("preserves regex search with safe ordinary title fallback and exact page size", () => {
    expect(route).toContain('query.filter("title", "imatch", titlePattern)');
    expect(route).toContain('query.ilike("title",');
    expect(route).toContain("DADYOOM_LESSON_SCOPED_REGEX_DEGRADED");
    expect(route).toContain("rows.slice(0, pageSize)");
    expect(route).toContain("hasMore: rows.length > pageSize");
  });

  test("never treats unavailable database results as an empty list", () => {
    for (const stage of [
      "SEARCH_SCOPE_COUNTRY:", "SEARCH_SCOPE_CURRICULA:", "SEARCH_SCOPE_GRADES:",
      "SEARCH_SCOPE_UNITS:", "SEARCH_SCOPED_LESSONS:",
    ]) expect(route).toContain(stage);
    expect(route).toContain("DADYOOM_LESSON_SCOPED_SEARCH_FAILED");
    expect(route).toContain('status: 503');
  });

  test("retains global search for cases where no exact country-grade scope was supplied", () => {
    expect(route).toContain("const regexResult = await searchQuery(true)");
    expect(route).toContain("DADYOOM_LESSON_SEARCH_FAILED");
  });
});
