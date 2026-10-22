import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { gradeStoredMcq } from "../../features/questions/services/grade-stored-mcq";

const options = [
  { id: "a", text: "اختيار أ" },
  { id: "b", text: "اختيار ب" },
  { id: "c", text: "اختيار ج" },
];

const question = {
  question_type: "multiple_choice",
  options,
  correct_answer: "b",
};

describe("authoritative stored question grading", () => {
  it("scores a correct selected option", () => {
    expect(gradeStoredMcq(question, "b")).toEqual({
      valid: true,
      isCorrect: true,
      correctAnswer: "b",
    });
  });

  it("scores a wrong selected option without trusting browser correctness", () => {
    expect(gradeStoredMcq(question, "a")).toEqual({
      valid: true,
      isCorrect: false,
      correctAnswer: "b",
    });
  });

  it.each(["x", "", null, undefined, 1, {}, ["b"]])(
    "rejects a selected option outside the stored list",
    (selected) => {
      expect(gradeStoredMcq(question, selected)).toEqual({
        valid: false,
        reason: "invalid-selection",
      });
    }
  );

  it("rejects unsupported question types", () => {
    expect(gradeStoredMcq({ ...question, question_type: "essay" }, "b")).toEqual({
      valid: false,
      reason: "unsupported",
    });
  });

  it("rejects a stored correct key not in options", () => {
    expect(gradeStoredMcq({ ...question, correct_answer: "z" }, "b")).toEqual({
      valid: false,
      reason: "invalid-options",
    });
  });

  it("rejects duplicate or malformed option identifiers", () => {
    expect(gradeStoredMcq({ ...question, options: [options[0], options[0]] }, "a"))
      .toEqual({ valid: false, reason: "invalid-options" });
    expect(gradeStoredMcq({ ...question, options: [{ text: "missing id" }, options[0]] }, "a"))
      .toEqual({ valid: false, reason: "invalid-options" });
  });

  it("keeps auth, score, ownership and saving on the server", () => {
    const code = readFileSync(
      resolve(process.cwd(), "app/api/questions/answer/route.ts"),
      "utf8"
    );
    expect(code).toContain("supabase.auth.getUser()");
    expect(code).toContain('from("questions")');
    expect(code).toContain('from("lessons")');
    expect(code).toContain('lesson.status !== "published"');
    expect(code).toContain("gradeStoredMcq(");
    expect(code).toContain("createAdminClient()");
    expect(code).toContain("user_id: user.id");
    expect(code).toContain("is_correct: grade.isCorrect");
    expect(code).not.toContain("raw?.isCorrect");
    expect(code).not.toContain("raw?.userId");
  });

  it("client no longer sets is_correct or receives the answer key as a prop", () => {
    const component = readFileSync(
      resolve(process.cwd(), "components/lesson/MultipleChoiceQuestion.tsx"),
      "utf8"
    );
    const page = readFileSync(
      resolve(process.cwd(), "app/lessons/[id]/page.tsx"),
      "utf8"
    );
    expect(component).toContain('fetch("/api/questions/answer"');
    expect(component).toContain("selectedAnswer: selected");
    expect(component).not.toContain('.from("question_attempts")');
    expect(component).not.toContain("selected === correctAnswer");
    expect(page).not.toContain("correctAnswer={");
    expect(page).not.toContain("explanation={");
  });
});
