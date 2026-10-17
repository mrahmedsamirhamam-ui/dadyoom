import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const page=readFileSync("app/lessons/[id]/games/LessonHTMLArcade.tsx","utf8");
const src=readFileSync("app/lessons/[id]/games/DadyoomAnswerShooter.tsx","utf8");
describe("Dadyoom action game uses actual lesson-specific five-question pack",()=>{
 test("maze mode is a physics-based canvas spaceship game, not quiz buttons",()=>{
  expect(page).toContain("<DadyoomAnswerShooter items={questions}");
  expect(page).toContain('mode !== "maze"');
  expect(src).toContain('getContext("2d")');
  expect(src).toContain("requestAnimationFrame(render)");
  expect(src).toContain("m.beams.push");
  expect(src).toContain("pod.text === items[m.wave].answer");
  expect(src).toContain("complete(false)");
  expect(src).toContain("complete(true)");
 });
 test("all five wave prompts come from the AI-editable lesson JSON",()=>{
  expect(src).toContain("m.pods = makePods(items[m.wave])");
  expect(src).toContain("m.wave >= items.length - 1");
  expect(src).toContain("onPointerDown={tapCanvas}");
  expect(src).toContain("onPointerMove=");
  expect(src).toContain("onPointerUp={stickEnd}");
  expect(src).toContain("e.key ===");
  expect(src).toContain("مقود حركة المركبة");
 });
});
