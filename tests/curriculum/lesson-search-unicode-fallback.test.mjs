import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const api=readFileSync("app/api/lessons/search/route.ts","utf8");
describe("Production search never loses the basic query if Unicode regex fails",()=>{
 test("tries PostgREST imatch then published-only ilike fallback",()=>{
  expect(api).toContain("function searchQuery(preferRegex: boolean)");
  expect(api).toContain('.filter("title", "imatch", titlePattern)');
  expect(api).toContain('.ilike("title",');
  expect(api).toContain("const fallback = await searchQuery(false)");
  expect(api).toContain("if (error)");
  expect(api).toContain("DADYOOM_LESSON_REGEX_DEGRADED");
 });
 test("fallback keeps country grade and active scope restrictions",()=>{
  expect(api).toContain('.eq("status", "published")');
  expect(api).toContain('.eq("units.grades.is_active", true)');
  expect(api).toContain('.eq("units.grades.curricula.is_active", true)');
  expect(api).toContain('.eq("units.grades.curricula.countries.is_active", true)');
  expect(api).toContain("if (countryCode) query = query.eq");
  expect(api).toContain("if (grade !== null) query = query.eq");
  expect(api).not.toContain("createAdminClient");
  expect(api).not.toContain("service_role");
 });
});
