import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { gradeStudyPlay, type StudyPlayRow } from "./grade-study-play";

const ids = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
];
const questions: StudyPlayRow[] = ids.map((id) => ({
  id,
  question_type: "multiple_choice",
  options: [
    { id: "a", text: "الاختيار الأول" },
    { id: "b", text: "الاختيار الثاني" },
  ],
  correct_answer: "b",
}));

describe("gradeStudyPlay", () => {
  it("grades only server-stored keys and computes percentage", () => {
    const graded = gradeStudyPlay(questions, [
      { questionId: ids[0], optionId: "b" },
      { questionId: ids[1], optionId: "a" },
    ]);
    expect(graded.score).toBe(50);
    expect(graded.correctAnswers).toBe(1);
    expect(graded.passed).toBe(false);
  });
  it("accepts a complete correct submission", () => {
    expect(gradeStudyPlay(questions, ids.map((questionId) => ({
      questionId, optionId: "b",
    })))).toMatchObject({ score: 100, passed: true, totalQuestions: 2 });
  });
  it("rejects omissions, forged ids and duplicate answers", () => {
    expect(() => gradeStudyPlay(questions, [{ questionId: ids[0], optionId: "b" }])).toThrow();
    expect(() => gradeStudyPlay(questions, [
      { questionId: ids[0], optionId: "b" },
      { questionId: "33333333-3333-4333-8333-333333333333", optionId: "b" },
    ])).toThrow();
    expect(() => gradeStudyPlay(questions, [
      { questionId: ids[0], optionId: "b" },
      { questionId: ids[0], optionId: "b" },
    ])).toThrow();
  });
  it("rejects non-existent answer option and compromised question bank", () => {
    expect(() => gradeStudyPlay(questions, [
      { questionId: ids[0], optionId: "b" },
      { questionId: ids[1], optionId: "not-in-question" },
    ])).toThrow();
    expect(() => gradeStudyPlay([{ ...questions[0], correct_answer: "not-in-question" }], [
      { questionId: ids[0], optionId: "b" },
    ])).toThrow();
  });
  it("rejects empty or out-of-range question bank", () => {
    expect(() => gradeStudyPlay([], [])).toThrow();
    expect(() => gradeStudyPlay(
      Array.from({ length: 101 }, () => questions[0]),
      Array.from({ length: 101 }, () => ({ questionId: ids[0], optionId: "b" })),
    )).toThrow();
  });
});

describe("trusted grading integration", () => {
  it("authenticates and checks published lesson before reading practice answer keys", () => {
    const code = readFileSync(resolve(process.cwd(), "features/practice/actions/submitPractice.ts"), "utf8");
    expect(code).toContain("supabase.auth.getUser()");
    expect(code).toContain('.eq("status", "published")');
    expect(code).toMatch(/await admin\s*\.from\("questions"\)/);
    expect(code).not.toMatch(/await supabase\s*\.from\("questions"\)/);
    expect(code).toContain("gradeStudyPlay(");
    expect(code.indexOf("const admin = createAdminClient()")).toBeGreaterThan(code.indexOf('.eq("status", "published")'));
  });
  it("keeps answer keys off the study-play client and server action results", () => {
    const page = readFileSync(resolve(process.cwd(), "app/lessons/[id]/play/page.tsx"), "utf8");
    const action = readFileSync(resolve(process.cwd(), "features/study-play/actions/submitStudyPlay.ts"), "utf8");
    expect(page).toContain('.from("dadyoom_student_questions")');
    expect(page).not.toContain("correct_answer");
    expect(action).toMatch(/await admin\s*\.from\("questions"\)/);
    expect(action).toContain("gradeStudyPlay(");
    expect(action).not.toMatch(/return\s*\{[^}]*correctAnswer:/s);
  });
});
