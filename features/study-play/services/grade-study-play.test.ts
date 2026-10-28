import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { gradeStudyPlay, validateStudyPlaySubmission, type StudyPlayRow } from "./grade-study-play";
import { readCompleteGradingPages } from "@/lib/lesson-activities/read-complete-pages";

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

describe("study-play untrusted Server Action payload boundary", () => {
  it("accepts a complete bounded answer set", () => {
    expect(validateStudyPlaySubmission(ids.map((questionId) => ({
      questionId, optionId: "b",
    })))).toHaveLength(2);
  });

  it("rejects empty, oversized, malformed, duplicated and fake submissions", () => {
    const valid = { questionId: ids[0], optionId: "b" };
    for (const invalid of [
      null,
      {},
      "string",
      [],
      Array.from({ length: 101 }, () => valid),
      [{ questionId: ids[0], optionId: "a" }, valid],
      [{ questionId: "forged", optionId: "a" }],
      [{ questionId: ids[0], optionId: "" }],
      [{ questionId: ids[0], optionId: " ".repeat(30) }],
      [{ questionId: ids[0], optionId: "a".repeat(257) }],
      [{ questionId: ids[0], optionId: { nested: true } }],
      [{ questionId: ids[0], optionId: "a" }, { questionId: ids[0], optionId: "b" }],
    ]) {
      expect(() => validateStudyPlaySubmission(invalid)).toThrow(
        "بيانات إجابات غير صالحة أو مكررة.",
      );
    }
  });

  it("checks submitted data before creating a student or privileged DB client", () => {
    const code = readFileSync(
      resolve(process.cwd(), "features/study-play/actions/submitStudyPlay.ts"), "utf8",
    );
    const validationPosition = code.indexOf("validateStudyPlaySubmission(answers)");
    expect(validationPosition).toBeGreaterThan(0);
    expect(validationPosition).toBeLessThan(code.indexOf("await createClient()"));
    expect(validationPosition).toBeLessThan(code.indexOf("createAdminClient()"));
    expect(code).toContain("gradeStudyPlay(storedRows, validatedAnswers)");
  });
});

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

describe("complete study-play question banks under API row caps", () => {
  it("retrieves all 100 student-visible questions despite a 17-row PostgREST cap", async () => {
    const ids = Array.from({ length: 100 }, (_, index) => ({
      id: String(index + 1).padStart(8, "0"),
    }));
    const pages: number[] = [];
    const visible = await readCompleteGradingPages({
      maxRows: 100,
      pageSize: 75,
      readPage: async (offset, limit) => {
        pages.push(offset);
        return {
          data: ids.slice(offset, offset + Math.min(17, limit)),
          count: ids.length,
          error: null,
        };
      },
    });
    expect(visible).toEqual(ids);
    expect(pages).toEqual([0, 17, 34, 51, 68, 85]);
  });

  it("rejects 101 questions instead of displaying or grading a truncated quiz", async () => {
    const ids = Array.from({ length: 101 }, (_, index) => ({
      id: String(index + 1).padStart(8, "0"),
    }));
    await expect(readCompleteGradingPages({
      maxRows: 100,
      pageSize: 75,
      readPage: async (offset, limit) => ({
        data: ids.slice(offset, offset + limit),
        count: ids.length,
        error: null,
      }),
    })).rejects.toThrow("تجاوز عدد بيانات التقويم");
  });

  it("uses identical full-bank verification for the page and server action", () => {
    const page = readFileSync(
      resolve(process.cwd(), "app/lessons/[id]/play/page.tsx"), "utf8",
    );
    const action = readFileSync(
      resolve(process.cwd(), "features/study-play/actions/submitStudyPlay.ts"), "utf8",
    );
    expect(page).toContain("readCompleteGradingPages({");
    expect(page).toContain('count: "exact"');
    expect(page).toContain('maxRows: 100');
    expect(page).toContain('.order("id", { ascending: true })');
    expect(page).toContain(".range(offset, offset + limit - 1)");
    expect(page).toContain("normalizeQuestions(rows as RawQuestion[])");
    expect(action.match(/readCompleteGradingPages\(\{/g)?.length).toBe(2);
    expect(action).toContain('.from("dadyoom_student_questions")');
    expect(action).toContain('.from("questions")');
    expect(action).toContain('.eq("lesson_id", lessonId)');
    expect(action).toContain("storedRows.length !== visibleIds.length");
    expect(action).toContain("gradeStudyPlay(storedRows, validatedAnswers)");
    expect(action).not.toContain(".limit(101)");
  });
});

describe("trusted grading integration", () => {
  it("authenticates and checks published lesson before reading practice answer keys", () => {
    const code = readFileSync(resolve(process.cwd(), "features/practice/actions/submitPractice.ts"), "utf8");
    expect(code).toContain("supabase.auth.getUser()");
    expect(code).toContain('.eq("status", "published")');
    expect(code).toMatch(/await admin\s*\.from\("questions"\)/);
    expect(code).not.toMatch(/await supabase\s*\.from\("questions"\)/);
    expect(code).toContain('from("dadyoom_student_questions")');
    expect(code.indexOf("const admin = createAdminClient()")).toBeGreaterThan(code.indexOf('.eq("status", "published")'));
  });
  it("keeps answer keys off the study-play client and server action results", () => {
    const page = readFileSync(resolve(process.cwd(), "app/lessons/[id]/play/page.tsx"), "utf8");
    const action = readFileSync(resolve(process.cwd(), "features/study-play/actions/submitStudyPlay.ts"), "utf8");
    expect(page).toContain('.from("dadyoom_student_questions")');
    expect(page).not.toMatch(/\.select\([^)]*correct_answer/);
    expect(page).not.toContain('\.from("questions")');
    expect(action).toMatch(/await admin\s*\.from\("questions"\)/);
    expect(action).toContain("gradeStudyPlay(");
    expect(action).toContain('.from("dadyoom_student_questions")');
    expect(action).toContain("visibleIds");
    expect(action).toContain("storedRows.length !== visibleIds.length");
    expect(action).toContain("const earnedXp = 0;");
    expect(action).toContain('.gte("created_at", oneDayAgo)');
    expect(action).toContain("if ((recent ?? []).length >= 10)");
    expect(action).not.toMatch(/return\s*\{[^}]*correctAnswer:/);
  });
});
