import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const smoke=readFileSync("scripts/smoke-games-5x5.mjs","utf8");
describe("Arcade bank runs beyond Bahrain's cached question-backed lessons",()=>{
 test("production probes a bankless lesson and grade 13 in another country",()=>{
  expect(smoke).toContain("BH_CONTENT_ONLY");
  expect(smoke).toContain("MR_GRADE13");
  expect(smoke).toContain("GAME_5X5_COUNTRY_AND_FALLBACK=PASS");
  expect(smoke).toContain("new Set(prompts).size !== 25");
  expect(smoke).toContain("!item.options.includes(item.answer)");
 });
});
