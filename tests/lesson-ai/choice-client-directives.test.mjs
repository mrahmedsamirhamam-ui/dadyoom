import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
const files = [
  "components/lesson/MultipleChoiceQuestion.tsx",
  "features/practice/components/LessonPractice.tsx",
];
it.each(files)("retains a first-statement use client directive in %s", (path) => {
  const content = readFileSync(new URL("../../" + path, import.meta.url), "utf8");
  expect(content.startsWith('"use client";')).toBe(true);
});
