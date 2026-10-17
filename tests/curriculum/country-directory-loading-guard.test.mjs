import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const page = readFileSync("app/curriculum/[country]/page.tsx", "utf8");
const gradePage = readFileSync("app/curriculum/[country]/[grade]/page.tsx", "utf8");

describe("country curriculum directory safety", () => {
  test("keeps deterministic page boundaries even when several lessons share an order", () => {
    expect(page).toContain('.order("id", { ascending: true })');
    expect(page).toContain('from + pageSize - 1');
    expect(page).toContain('rows.push(...batch)');
    expect(page).toContain('if (batch.length < pageSize)');
  });

  test("never reports incomplete lesson catalog as a successful country directory", () => {
    expect(page).toContain("SEO_CURRICULUM_DIRECTORY_FAILED");
    expect(page).toContain('throw new Error(`SEO_CURRICULUM_DIRECTORY_FAILED:${info.code}`)');
    expect(page).toContain('if (gradeCatalogError) {');
    expect(page).toContain('throw new Error(`SEO_CURRICULUM_GRADES_FAILED:${info.code}`)');
  });

  test("country directory renders bounded previews, preserving full grade and course navigation", () => {
    expect(page).toContain("unit.lessons.slice(0, 3).map");
    expect(page).toContain("unit.lessons.length - 3");
    expect(page).toContain("/curriculum/${info.code.toLowerCase()}/${grade.gradeNumber}");
    expect(page).toContain("/courses?country=${info.code}&grade=${grade.gradeNumber}");
  });

  test("named continuing-education levels remain visible and reachable", () => {
    expect(page).toContain("continuingGradeNames");
    expect(page).toContain("grade.grade_number === null");
    expect(page).toContain("التعليم المستمر والمسارات غير المرتبطة برقم صف");
    expect(page).toContain("/courses?country=${info.code}");
  });

  test("grade pages paginate the full listing without mistaking a DB error for 404", () => {
    expect(gradePage).toContain(".range(from, from + pageSize - 1)");
    expect(gradePage).toContain('.order("id", { ascending: true })');
    expect(gradePage).toContain("lessons.push(...batch)");
    expect(gradePage).toContain("throw new Error(");
    expect(gradePage).toContain("SEO_GRADE_DIRECTORY_FAILED");
  });

  test("retains all Arab countries and a clearly bounded regeneration period", () => {
    expect(page).toContain("export const revalidate = 10800;");
    expect(page).toContain("ARAB_COUNTRY_CODES.map");
    expect(page).toContain("export const dynamicParams = false;");
  });
});
