import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClient, createAdminClient, completeAdaptiveStep, revalidatePath } =
  vi.hoisted(() => ({
    createClient: vi.fn(),
    createAdminClient: vi.fn(),
    completeAdaptiveStep: vi.fn(),
    revalidatePath: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("@/features/learning-plan/services/adaptive-path-lifecycle",
  () => ({ completeAdaptiveStep }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { submitPracticeAction } from "../../features/practice/actions/submitPractice";

const lessonId = "11111111-1111-4111-8111-111111111111";
const studentId = "22222222-2222-4222-8222-222222222222";
const q1 = "33333333-3333-4333-8333-333333333333";
const q2 = "44444444-4444-4444-8444-444444444444";

type TestOptions = {
  user?: { id: string } | null;
  lesson?: { id: string } | null;
  visible?: { id: string }[];
  privateQuestions?: { id: string; correct_answer: string }[];
};

function mockDatabase(options: TestOptions = {}) {
  const studentReads: string[] = [];
  const privateReads: string[] = [];
  const user = options.user === undefined ? { id: studentId } : options.user;
  const lesson = options.lesson === undefined ? { id: lessonId } : options.lesson;
  const visible = options.visible ?? [{ id: q1 }, { id: q2 }];
  const privateQuestions = options.privateQuestions ??
    [{ id: q1, correct_answer: "a" }, { id: q2, correct_answer: "b" }];

  const fromStudent = vi.fn((table: string) => {
    studentReads.push(table);
    if (table === "lessons") {
      const q = {
        select: vi.fn(() => q),
        eq: vi.fn(() => q),
        maybeSingle: vi.fn(async () => ({ data: lesson, error: null })),
      };
      return q;
    }
    if (table === "dadyoom_student_questions") {
      const q = {
        select: vi.fn(() => q),
        eq: vi.fn(() => q),
        then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
          Promise.resolve({ data: visible, error: null }).then(resolve, reject),
      };
      return q;
    }
    throw new Error("Student token unexpectedly read: " + table);
  });

  const fromAdmin = vi.fn((table: string) => {
    privateReads.push(table);
    if (table !== "questions") throw new Error("Wrong private table: " + table);
    const q = {
      select: vi.fn(() => q),
      eq: vi.fn(() => q),
      in: vi.fn(async (_key: string, ids: string[]) => {
        expect(ids).toEqual(visible.map(v => v.id));
        return { data: privateQuestions, error: null };
      }),
    };
    return q;
  });
  createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn(async () => ({ data: { user }, error: null })),
    },
    from: fromStudent,
  });
  createAdminClient.mockReturnValue({ from: fromAdmin });
  completeAdaptiveStep.mockResolvedValue({ updated: true, reason: "completed" });
  return { studentReads, privateReads, fromStudent, fromAdmin };
}

beforeEach(() => vi.clearAllMocks());

describe("stored-key lesson practice keeps the private grading boundary", () => {
  it("blocks anonymous practice before querying question keys", async () => {
    const db = mockDatabase({ user: null });
    await expect(submitPracticeAction(lessonId, [{ questionId: q1, optionId: "a" }]))
      .rejects.toThrow("تسجيل الدخول");
    expect(db.studentReads).toEqual([]);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects an unpublished lesson before any privileged lookup", async () => {
    const db = mockDatabase({ lesson: null });
    await expect(submitPracticeAction(lessonId, [{ questionId: q1, optionId: "a" }]))
      .rejects.toThrow("غير متاح");
    expect(db.studentReads).toEqual(["lessons"]);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("denies practice if the RLS-bound student view shows no questions", async () => {
    const db = mockDatabase({ visible: [] });
    await expect(submitPracticeAction(lessonId, []))
      .rejects.toThrow("لا توجد أسئلة");
    expect(db.studentReads).toEqual(["lessons", "dadyoom_student_questions"]);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects partial or mismatched private records without awarding a grade", async () => {
    const db = mockDatabase({
      privateQuestions: [{ id: q1, correct_answer: "a" }],
    });
    await expect(submitPracticeAction(lessonId, [
      { questionId: q1, optionId: "a" },
      { questionId: q2, optionId: "b" },
    ])).rejects.toThrow("التحقق");
    expect(db.studentReads).toEqual(["lessons", "dadyoom_student_questions"]);
    expect(db.privateReads).toEqual(["questions"]);
    expect(completeAdaptiveStep).not.toHaveBeenCalled();
  });

  it("grades only the verified published question set, not a forged extra answer", async () => {
    const db = mockDatabase();
    const result = await submitPracticeAction(lessonId, [
      { questionId: q1, optionId: "a" },
      { questionId: q2, optionId: "wrong" },
      { questionId: "fake", optionId: "a" },
    ]);
    expect(result).toMatchObject({
      success: true, totalQuestions: 2, correctAnswers: 1,
      score: 50, passed: false,
    });
    expect(db.studentReads).toEqual(["lessons", "dadyoom_student_questions"]);
    expect(db.privateReads).toEqual(["questions"]);
    expect(completeAdaptiveStep).not.toHaveBeenCalled();
  });

  it("advances only after trusted server-key scoring reaches the practice threshold", async () => {
    mockDatabase();
    const result = await submitPracticeAction(lessonId, [
      { questionId: q1, optionId: "a" },
      { questionId: q2, optionId: "b" },
    ]);
    expect(result).toMatchObject({ score: 100, passed: true, correctAnswers: 2 });
    expect(completeAdaptiveStep).toHaveBeenCalledExactlyOnceWith({
      supabase: createAdminClient.mock.results[0].value,
      studentId, lessonId, stepType: "practice",
    });
    expect(createAdminClient).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith("/student");
  });
});
