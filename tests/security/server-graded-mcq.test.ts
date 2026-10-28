import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { feedbackForStudent, gradeStoredMcq } from "../../features/questions/services/grade-stored-mcq";

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

  it("never reveals the correct key or explanation for an incorrect response", () => {
    const grade = gradeStoredMcq(question, "a");
    expect(grade.valid).toBe(true);
    if (!grade.valid) throw new Error("Expected valid grading result");

    expect(feedbackForStudent(grade, "الجواب الصحيح هو ب")).toEqual({
      isCorrect: false,
      correctAnswer: null,
      explanation: null,
    });
  });

  it("returns a helpful explanation once the answer is correct", () => {
    const grade = gradeStoredMcq(question, "b");
    expect(grade.valid).toBe(true);
    if (!grade.valid) throw new Error("Expected valid grading result");

    expect(feedbackForStudent(grade, "الجواب الصحيح هو ب")).toEqual({
      isCorrect: true,
      correctAnswer: "b",
      explanation: "الجواب الصحيح هو ب",
    });
  });

  it("route uses sanitized feedback rather than sending a raw answer key", () => {
    const route = readFileSync(
      resolve(process.cwd(), "app/api/questions/answer/route.ts"),
      "utf8"
    );
    expect(route).toContain("feedbackForStudent(");
    expect(route).not.toMatch(/correctAnswer:\s*grade\.correctAnswer/);
    expect(route).not.toMatch(/explanation:\s*question\.explanation/);
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

  it("reads public question listings from the published student-safe view", () => {
    const reader = readFileSync(
      resolve(process.cwd(), "features/questions/queries/getLessonQuestions.ts"),
      "utf8"
    );
    expect(reader).toContain('.from("dadyoom_student_questions")');
    expect(reader).toContain('.select("id,lesson_id,question_order,question,question_type,options,points")');
    expect(reader).not.toContain('.from("questions")');
    expect(reader).not.toContain('.select("*")');
    expect(reader).not.toContain("correct_answer");
    expect(reader).not.toContain("explanation");
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
