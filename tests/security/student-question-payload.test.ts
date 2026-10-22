import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { publicLessonQuestions } from "../../features/questions/services/public-lesson-questions";

const raw = {
  id: "q1",
  lesson_id: "l1",
  question_order: 1,
  question: "ما الجواب؟",
  question_type: "multiple_choice",
  options: [
    { id: "a", text: "نعم", is_correct: true, hidden_solution: "نعم" },
    { id: "b", text: "لا", is_correct: false },
  ],
  points: 2,
  correct_answer: "a",
  explanation: "سبب الإجابة الصحيحة",
  teacher_notes: "لا يراه الطالب",
  future_secret_field: "always remove by allowlist",
};

describe("public student lesson question payload", () => {
  it("retains only the explicitly allowed display fields", () => {
    expect(publicLessonQuestions([raw])).toEqual([{
      id: "q1",
      lesson_id: "l1",
      question_order: 1,
      question: "ما الجواب؟",
      question_type: "multiple_choice",
      options: [{ id: "a", text: "نعم" }, { id: "b", text: "لا" }],
      points: 2,
    }]);
  });

  it("does not serialize answer keys, solutions or unknown future fields", () => {
    const serialized = JSON.stringify(publicLessonQuestions([raw]));
    expect(serialized).not.toContain("correct_answer");
    expect(serialized).not.toContain("explanation");
    expect(serialized).not.toContain("teacher_notes");
    expect(serialized).not.toContain("future_secret_field");
    expect(serialized).not.toContain("is_correct");
    expect(serialized).not.toContain("hidden_solution");
    expect(serialized).not.toContain("سبب الإجابة الصحيحة");
  });

  it("fails closed for non-arrays and malformed rows", () => {
    expect(publicLessonQuestions(null)).toEqual([]);
    expect(publicLessonQuestions({ questions: [raw] })).toEqual([]);
    expect(publicLessonQuestions([null, { id: "a" }, raw])).toHaveLength(1);
  });

  it("sanitize is applied on published RPC and private draft preview branches", () => {
    const code = readFileSync(
      resolve(process.cwd(), "features/lessons/queries/getLessonPageBundle.ts"),
      "utf8"
    );
    expect(code).toContain("const safeQuestions = publicLessonQuestions(bundle.questions)");
    expect(code).toMatch(/questions:\s*safeQuestions/g);
    expect(code).toContain("publicLessonQuestions(questions)");
    expect(code).not.toMatch(/correct_answer:\s*string/);
  });

  it("weak review no longer queries or renders correct_answer or explanation", () => {
    const query = readFileSync(
      resolve(process.cwd(), "features/adaptive-learning/queries/getWeakQuestions.ts"),
      "utf8"
    );
    const review = readFileSync(
      resolve(process.cwd(), "features/adaptive-learning/components/WeakQuestionsReview.tsx"),
      "utf8"
    );
    expect(query).not.toContain("correct_answer");
    expect(query).not.toContain("explanation");
    expect(review).not.toContain("question.explanation");
  });
});
