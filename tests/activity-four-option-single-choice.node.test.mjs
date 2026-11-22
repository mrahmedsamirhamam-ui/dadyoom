import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("../features/lessons/components/InteractiveLessonActivities.tsx", import.meta.url),
  "utf8"
);

test("ordinary four-option and five-option single-answer MCQs do NOT become multiple-select solely from distractor count", () => {
  assert.doesNotMatch(source, /const multi\s*=\s*options\.length\s*>\s*3/);
  assert.match(source, /const multi\s*=\s*activity\.activity_type === "multi_select"/);
  for (const condition of [
    "content.allowMultiple === true",
    "content.allow_multiple === true",
    "content.multi_select === true",
    'content.selectionMode === "multiple"',
    'content.selection_mode === "multiple"',
  ]) assert.ok(source.includes(condition), "explicit public multi-selection flag must be supported: " + condition);
});

test("student can replace the previous choice in a single-choice question instead of appending it", () => {
  assert.match(source, /if\s*\(\s*!multi\s*\)\s*\{\s*return\s*\{\s*\.\.\.current,\s*\[activity\.id\]:\s*\[option\]/);
  assert.match(source, /old\.includes\(\s*option\s*\)[\s\S]*?old\.filter/);
  assert.ok(source.includes('"/api/lesson-activities/check"'), "student selection must be graded server-side");
  assert.ok(!source.includes("activity.answer"), "the student page must never inspect a private grading answer");
});
