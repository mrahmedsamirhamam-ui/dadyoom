import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const src=readFileSync("app/lessons/[id]/games/LessonHTMLArcade.tsx","utf8");
const page=readFileSync("app/lessons/[id]/games/page.tsx","utf8");
describe("Real HTML 5-game lesson arcade",()=>{
 test("five responsive interactive mechanics all visible without Plus",()=>{
  expect(page).toContain("<LessonHTMLArcade");
  expect(page).not.toContain("<LessonGamesClient");
  for(const keyword of ["maze:", "defender:", "catcher:", "runner:", "guardian:"]) expect(src).toContain(keyword);
  expect(src).toContain("sm:grid-cols-4");
  expect(src).toContain("aria-pressed={mode === key}");
  expect(src).not.toContain("Plus");
 });
 test("explicitly traverses all five questions and shows feedback",()=>{
  expect(src).toContain('type Stage = "playing" | "feedback" | "complete"');
  expect(src).toContain('if (index === questions.length - 1)');
  expect(src).toContain("setIndex(old => old + 1)");
  expect(src).toContain('setStage("feedback")');
  expect(src).toContain('setStage("playing")');
  expect(src).toContain("المهمة التالية");
  expect(src).toContain("أنهيت خمس مراحل");
 });
});
