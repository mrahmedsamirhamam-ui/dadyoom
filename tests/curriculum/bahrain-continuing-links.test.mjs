import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const country = readFileSync("app/curriculum/[country]/page.tsx", "utf8");
const coursesPage = readFileSync("app/courses/page.tsx", "utf8");
const catalog = readFileSync("app/courses/CurriculumCatalogClient.tsx", "utf8");

describe("Bahrain non-numeric adult grade deep links", () => {
  test("every named level in the country directory is a direct, encoded course link", () => {
    expect(country).toContain("continuingGradeNames.map((name)");
    expect(country).toContain("encodeURIComponent(name)");
    expect(country).toContain("/courses?country=${info.code}&level=");
  });

  test("courses page forwards bounded level query only for Bahrain", () => {
    expect(coursesPage).toContain("level?: string | string[]");
    expect(coursesPage).toContain("const rawLevel = Array.isArray(query.level)");
    expect(coursesPage).toContain('country?.code === "BH" ? rawLevel?.slice(0, 60) : undefined');
  });

  test("catalog accepts only known Bahrain level names, no fabricated numeric grades", () => {
    expect(catalog).toContain("const bahrainContinuingLevels = [");
    expect(catalog).toContain('(bahrainContinuingLevels as readonly string[]).includes(initialContinuingLevel)');
    expect(catalog).toContain('initialCountry?.code === "BH"');
    expect(catalog).toContain("useState(validInitialContinuingLevel)");
    expect(catalog).toContain('country === "BH" && continuingLevel');
  });
});
