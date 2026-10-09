import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
const read = (path) => readFileSync(new URL("../../" + path, import.meta.url), "utf8");

test("legacy book quiz pages redirect to reference pages before reading questions", () => {
  const code = read("app/quiz/[id]/page.tsx");
  expect(code).toContain("isKnownBookReferenceId(lessonId)");
  expect(code.indexOf("isKnownBookReferenceId(lessonId)")).toBeLessThan(code.indexOf('.from("questions")'));
  expect(code).toContain("redirect(`/curriculum/books/${lessonId}`)");
});
test("server practice action rejects legacy textbook quizzes before grading", () => {
  const code = read("features/practice/actions/submitPractice.ts");
  expect(code).toContain("isKnownBookReferenceId(normalizedLessonId)");
  expect(code.indexOf("isKnownBookReferenceId(normalizedLessonId)")).toBeLessThan(code.indexOf('.from("questions")'));
});
test("all canonical and compatibility completion paths reject book reference XP", () => {
  const core = read("features/student-progress/services/complete-lesson-core.ts");
  const legacy = read("app/api/lessons/complete/route.ts");
  expect(core).toContain("isKnownBookReferenceId(progress.lesson_id)");
  expect(core.indexOf("isKnownBookReferenceId(progress.lesson_id)")).toBeLessThan(core.indexOf("const beforeSnapshot"));
  expect(legacy).toContain("isKnownBookReferenceId(lessonId)");
  expect(legacy).toContain("status: 409");
});
