import { readFileSync } from "node:fs";
import { test, expect } from "vitest";

test("country directory only fetches lesson fields used in SSR HTML", () => {
  const source = readFileSync("app/curriculum/[country]/page.tsx", "utf8");
  const expected = "id,title,lesson_number,sort_order,unit_title,unit_number,unit_sort_order,grade_name,grade_number";
  expect(source).toContain(expected);
  expect(source).toContain('.eq("country_code", info.code)');
  expect(source).toContain('href={');
  expect(source).toContain('lessons/');
  const selected = source.match(/\.from\("seo_indexable_lessons_fast"\)\s*\.select\(\s*"([^"]+)"/u)?.[1];
  expect(selected).toBe(expected);
  for (const unused of ["summary", "slug", "lesson_semester", "unit_semester", "country_code", "country_name"]) {
    expect(selected?.split(",")).not.toContain(unused);
  }
});
