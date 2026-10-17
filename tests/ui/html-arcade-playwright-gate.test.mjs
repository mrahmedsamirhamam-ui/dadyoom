import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const script=readFileSync("scripts/smoke-games-playwright.mjs","utf8");
const workflow=readFileSync(".github/workflows/production-role-qa.yml","utf8");
describe("Real mobile browser plays five complete HTML5 action games",()=>{
 test("aims, races, runs, navigates and verifies every wave",()=>{
  expect(script).toContain("viewport: { width: 390, height: 844 }");
  expect(script).toContain("for (let m = 0; m < games.length; m++)");
  expect(script).toContain("for (let step = 1; step <= 5; step++)");
  expect(script).toContain("GAME_UI_MOBILE_25_ROUNDS=PASS");
  expect(script).toContain('key === "catcher"');
  expect(script).toContain('key === "runner"');
  expect(script).toContain('key === "guardian"');
  expect(script).toContain('key === "defender"');
  expect(script).toContain("page.mouse.click");
  expect(workflow).toContain("run: node scripts/smoke-games-playwright.mjs");
 });
});
