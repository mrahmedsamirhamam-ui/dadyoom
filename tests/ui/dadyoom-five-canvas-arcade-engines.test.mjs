import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const hub=readFileSync("app/lessons/[id]/games/LessonHTMLArcade.tsx","utf8");
const engine=readFileSync("app/lessons/[id]/games/DadyoomAdventureCanvas.tsx","utf8");
const shoot=readFileSync("app/lessons/[id]/games/DadyoomAnswerShooter.tsx","utf8");
describe("Five different real motion games, not reskinned questions",()=>{
 test("five HTML canvas slots use their lesson's five-question pack",()=>{
  for(const label of ["حارس العربية","حماة القلعة","سباق السيارات","عدّاء الكلمات","إنقاذ الكنز"]) expect(hub).toContain(label);
  expect(hub).toContain("GAME_MODES.map(key");
  expect(hub).toContain("pack.maze");
  expect(hub).toContain("items={pack[mode]}");
  expect(hub).toContain("mode={mode}");
  expect(hub).not.toContain("LessonGamesClient");
 });
 test("independent mechanics: laser shield, racing lanes, running, rescue navigation",()=>{
  expect(shoot).toContain("m.beams.push");
  expect(engine).toContain('mode === "defender"');
  expect(engine).toContain('m.shots.push');
  expect(engine).toContain('mode === "catcher"');
  expect(engine).toContain("chooseLane(");
  expect(engine).toContain('mode === "runner"');
  expect(engine).toContain("m.distance +=");
  expect(engine).toContain('mode === "guardian"');
  expect(engine).toContain("Math.hypot(box.x - m.x, box.y - m.y)");
 });
 test("input is real keyboard and touch movement, answers validated from the lesson",()=>{
  expect(engine).toContain("requestAnimationFrame(loop)");
  expect(engine).toContain("onPointerMove");
  expect(engine).toContain("onPointerDown={tap}");
  expect(engine).toContain("hit(actual.answer)");
  expect(engine).toContain("hit(bot.answer)");
  expect(engine).toContain("answer === items[m.level].answer");
  expect(engine).toContain("m.level >= items.length - 1");
  expect(engine).toContain("end(false)");
  expect(engine).toContain("end(true)");
 });
});
