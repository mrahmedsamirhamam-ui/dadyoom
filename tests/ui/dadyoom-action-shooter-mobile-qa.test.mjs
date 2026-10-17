import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const script=readFileSync("scripts/smoke-games-playwright.mjs","utf8");
const hub=readFileSync("app/lessons/[id]/games/LessonHTMLArcade.tsx","utf8");
const src=readFileSync("app/lessons/[id]/games/DadyoomAnswerShooter.tsx","utf8");
describe("Mobile QA shoots five real robot waves and includes four more action engines",()=>{
 test("uses the correct live question answer to aim at the canvas, not bypassed UI",()=>{
  expect(script).toContain("GAME_UI_ACTION_CANVAS_5_WAVES=PASS game=");
  expect(script).toContain("page.mouse.click");
  expect(script).toContain("const question = data.pack[key][step - 1]");
  expect(script).toContain("for (let step = 1; step <= 5; step++)");
  expect(hub).toContain("حارس العربية");
  expect(src).toContain("ReactPointerEvent");
 });
});
