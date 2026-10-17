import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const script=readFileSync("scripts/smoke-games-playwright.mjs","utf8");
const workflow=readFileSync(".github/workflows/production-role-qa.yml","utf8");
describe("Actual public mobile game click-through regression",()=>{
 test("Playwright must tap all five rounds in all five games",()=>{
  expect(script).toContain("viewport: { width: 390, height: 844 }");
  expect(script).toContain("for (let m = 0; m < modes.length; m++)");
  expect(script).toContain("for (let step = 1; step <= 5; step++)");
  expect(script).toContain("GAME_UI_MOBILE_25_ROUNDS=PASS");
  expect(script).toContain("اكشف بطاقة");
  expect(script).toContain("انطلق في المسار المختار");
  expect(workflow).toContain("run: node scripts/smoke-games-playwright.mjs");
 });
});
