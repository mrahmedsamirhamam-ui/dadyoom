import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const hub=readFileSync("app/lessons/[id]/games/LessonHTMLArcade.tsx","utf8");
const src=readFileSync("app/lessons/[id]/games/DadyoomAnswerShooter.tsx","utf8");
describe("Dadyoom shooter uses a true physics engine, not question buttons",()=>{
 test("ship projectile must collide with the correct robot and preserve five waves",()=>{
  expect(hub).toContain("<DadyoomAnswerShooter");
  expect(hub).toContain("items={pack.maze}");
  expect(src).toContain('getContext("2d")');
  expect(src).toContain("requestAnimationFrame(render)");
  expect(src).toContain("m.beams.push");
  expect(src).toContain("pod.text === items[m.wave].answer");
  expect(src).toContain("complete(false)");
  expect(src).toContain("complete(true)");
  expect(src).toContain("m.wave >= items.length - 1");
 });
 test("uses mobile joystick, actual touch firing and keyboard",()=>{
  expect(src).toContain("m.pods = makePods(items[m.wave])");
  expect(src).toContain("onPointerDown={tapCanvas}");
  expect(src).toContain("onPointerMove=");
  expect(src).toContain("onPointerUp={stickEnd}");
  expect(src).toContain("مقود حركة المركبة");
 });
});
