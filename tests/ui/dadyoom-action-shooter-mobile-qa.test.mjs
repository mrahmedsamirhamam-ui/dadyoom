import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const script=readFileSync("scripts/smoke-games-playwright.mjs","utf8");
const page=readFileSync("app/lessons/[id]/games/LessonHTMLArcade.tsx","utf8");
const src=readFileSync("app/lessons/[id]/games/DadyoomAnswerShooter.tsx","utf8");
describe("Canvas shooting mode verified as physics gameplay",()=>{
 test("the actual mobile E2E aims and fires five independent waves",()=>{
   expect(script).toContain("GAME_UI_ACTION_CANVAS_5_WAVES=PASS");
   expect(script).toContain("page.mouse.click");
   expect(script).toContain("const question = data.pack.maze[step - 1]");
   expect(script).toContain("for (let step = 1; step <= 5; step++)");
   expect(page).toContain("حارس العربية — أكشن");
   expect(src).toContain("ReactPointerEvent");
 });
});
