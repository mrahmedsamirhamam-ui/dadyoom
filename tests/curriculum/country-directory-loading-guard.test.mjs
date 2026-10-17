import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const page = readFileSync("app/curriculum/[country]/page.tsx", "utf8");

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

  test("retains all Arab countries and a clearly bounded regeneration period", () => {
    expect(page).toContain("export const revalidate = 10800;");
    expect(page).toContain("ARAB_COUNTRY_CODES.map");
    expect(page).toContain("export const dynamicParams = false;");
  });
});
