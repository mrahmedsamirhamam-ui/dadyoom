import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const page = readFileSync("app/admin/curriculum/coverage/countries/page.tsx", "utf8");
describe("Bahrain real educational content remediation progress", () => {
  test("renders a real baseline and current live RPC count, not a manually increased completion claim", () => {
    expect(page).toContain("BH_GENERAL_INTRO_BASELINE = 265");
    expect(page).toContain("rows.find(row => row.country_code === \"BH\")");
    expect(page).toContain("bahrain?.published_generic_intro");
    expect(page).toContain("BH_GENERAL_INTRO_BASELINE - bhRemaining");
    expect(page).toContain("bhRemediated / BH_GENERAL_INTRO_BASELINE");
    expect(page).toContain("<progress");
    expect(page).toContain("ليس نسبة اكتمال كتب الوزارة");
    expect(page).toContain("review=generic-intro");
  });
});
