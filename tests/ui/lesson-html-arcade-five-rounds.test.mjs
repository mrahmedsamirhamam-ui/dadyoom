import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const hub=readFileSync("app/lessons/[id]/games/LessonHTMLArcade.tsx","utf8");
const adventure=readFileSync("app/lessons/[id]/games/DadyoomAdventureCanvas.tsx","utf8");
const shooter=readFileSync("app/lessons/[id]/games/DadyoomAnswerShooter.tsx","utf8");
const page=readFileSync("app/lessons/[id]/games/page.tsx","utf8");
describe("Five HTML5 action adventures rather than button quizzes",()=>{
 test("routes all five slots into distinct movement mechanics",()=>{
  expect(page).toContain("<LessonHTMLArcade");
  for(const slot of ["maze:","defender:","catcher:","runner:","guardian:"]) expect(hub).toContain(slot);
  expect(hub).toContain("<DadyoomAnswerShooter");
  expect(hub).toContain("<DadyoomAdventureCanvas");
  expect(hub).toContain("items={pack[mode]}");
  expect(hub).toContain("onFinish={finish}");
  expect(hub).not.toContain("LessonGamesClient");
  expect(hub).not.toContain("Plus");
 });
 test("each game advances its own physics stage 1 through 5",()=>{
  expect(shooter).toContain("m.wave++");
  expect(shooter).toContain("m.wave >= items.length - 1");
  expect(adventure).toContain("m.level++");
  expect(adventure).toContain("m.level >= items.length - 1");
  expect(adventure).toContain("requestAnimationFrame(loop)");
  expect(hub).toContain("إجابات صحيحة: {done.score} من 5");
 });
});
