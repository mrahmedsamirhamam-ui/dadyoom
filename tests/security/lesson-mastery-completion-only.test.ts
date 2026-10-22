import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getCorrectAnswerSpec } from "../../lib/lesson-activities/grading";

describe("mastery evidence must be graded, not just completed", () => {
  it("completion-only activity does not contain a gradable answer", () => {
    expect(getCorrectAnswerSpec({})).toBeNull();
    expect(getCorrectAnswerSpec({ instructions: "Read the story" })).toBeNull();
  });

  it("activity with stored answer key remains gradable", () => {
    expect(getCorrectAnswerSpec({ correct: "a" })).toEqual({
      mode: "unordered",
      values: ["a"],
    });
    expect(getCorrectAnswerSpec({ correct_values: ["a", "b"] })).toEqual({
      mode: "unordered",
      values: ["a", "b"],
    });
  });

  it("mastery sync uses question fallback when all activities are completion-only", () => {
    const code = readFileSync(
      resolve(process.cwd(), "features/lesson-mastery/actions/syncLessonMastery.ts"),
      "utf8"
    );
    expect(code).toContain("if (gradableActivities.length > 0)");
    expect(code).toContain("gradableActivities.map(");
    expect(code).toContain('.from("dadyoom_student_questions")');
    expect(code).toContain('.from("question_attempts")');
    expect(code).not.toContain("requiredCompletionActivities");
    expect(code).not.toContain("latestByActivity.has(");
    expect(code).not.toContain("requiredCompletionActivities.length");
    expect(code).toMatch(/let masteryScore = 0/);
  });

  it("canonical completion still guards graded evidence and mandatory participation", () => {
    const code = readFileSync(
      resolve(process.cwd(), "features/student-progress/actions/completeLesson.ts"),
      "utf8"
    );
    expect(code).toContain("requireAssessedItems(questionIds.length)");
    expect(code).toContain("requirePositiveAssessmentPoints(totalPossible)");
    expect(code).toContain("requiredCompletionActivities.length");
    expect(code).toContain("REQUIRED_MASTERY_SCORE = 90");
  });
});
