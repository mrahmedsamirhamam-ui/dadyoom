import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createClient, createAdminClient, syncLessonMasteryAction, revalidatePath,
} = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  syncLessonMasteryAction: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("@/features/lesson-mastery/actions/syncLessonMastery", () => ({
  syncLessonMasteryAction,
}));
vi.mock("next/cache", () => ({ revalidatePath }));

import { resetWeakQuestion } from "../../features/adaptive-learning/actions/resetWeakQuestion";

function query(data: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => ({ data, error })),
  };
  return chain;
}

function setup({
  signedIn = true,
  visibleLesson = true,
  visibleQuestion = true,
  attemptCorrect = false,
  hasAttempt = true,
  deleteResult = true,
}: {
  signedIn?: boolean;
  visibleLesson?: boolean;
  visibleQuestion?: boolean;
  attemptCorrect?: boolean;
  hasAttempt?: boolean;
  deleteResult?: boolean;
} = {}) {
  const lessons = query(visibleLesson ? { id: "lesson-1" } : null);
  const questions = query(visibleQuestion ? { id: "question-1" } : null);
  const attempts = query(hasAttempt ? { id: "attempt-1", is_correct: attemptCorrect } : null);
  const deleted = query(deleteResult ? { id: "attempt-1" } : null);

  const from = vi.fn((table: string) => {
    if (table === "lessons") return lessons;
    if (table === "dadyoom_student_questions") return questions;
    if (table === "question_attempts") return attempts;
    throw new Error("Unexpected user table: " + table);
  });
  const adminFrom = vi.fn((table: string) => {
    if (table === "question_attempts") return deleted;
    throw new Error("Unexpected admin table: " + table);
  });
  createClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: signedIn ? { id: "student-1" } : null },
        error: null,
      }),
    },
    from,
  });
  createAdminClient.mockReturnValue({ from: adminFrom });
  return { lessons, questions, attempts, deleted, from, adminFrom };
}

beforeEach(() => {
  vi.clearAllMocks();
  syncLessonMasteryAction.mockResolvedValue({});
});

describe("student weak-question retries require real published ownership", () => {
  it("refuses unsigned requests before any database or privileged read", async () => {
    const ctx = setup({ signedIn: false });
    await expect(resetWeakQuestion("lesson-1", "question-1"))
      .rejects.toThrow("يجب تسجيل الدخول");
    expect(ctx.from).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects a draft or invisible lesson before opening question attempts", async () => {
    const ctx = setup({ visibleLesson: false });
    await expect(resetWeakQuestion("lesson-1", "question-1"))
      .rejects.toThrow("الدرس غير متاح");
    expect(ctx.from).toHaveBeenCalledTimes(1);
    expect(ctx.lessons.eq).toHaveBeenCalledWith("status", "published");
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects a question from a different lesson even if the user has an attempt", async () => {
    const ctx = setup({ visibleQuestion: false });
    await expect(resetWeakQuestion("lesson-1", "question-1"))
      .rejects.toThrow("لا يتبع هذا الدرس");
    expect(ctx.questions.eq).toHaveBeenCalledWith("lesson_id", "lesson-1");
    expect(ctx.questions.eq).toHaveBeenCalledWith("id", "question-1");
    expect(ctx.attempts.select).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("refuses to delete correct or missing attempts", async () => {
    for (const opts of [{ attemptCorrect: true }, { hasAttempt: false }]) {
      vi.clearAllMocks();
      const ctx = setup(opts);
      await expect(resetWeakQuestion("lesson-1", "question-1"))
        .rejects.toThrow("لا توجد محاولة خاطئة");
      expect(ctx.attempts.eq).toHaveBeenCalledWith("user_id", "student-1");
      expect(ctx.attempts.eq).toHaveBeenCalledWith("question_id", "question-1");
      expect(createAdminClient).not.toHaveBeenCalled();
    }
  });

  it("deletes only the student's wrong attempt after both published RLS checks", async () => {
    const ctx = setup();
    await resetWeakQuestion("lesson-1", "question-1");
    expect(ctx.deleted.delete).toHaveBeenCalledOnce();
    expect(ctx.deleted.eq).toHaveBeenCalledWith("id", "attempt-1");
    expect(ctx.deleted.eq).toHaveBeenCalledWith("user_id", "student-1");
    expect(ctx.deleted.eq).toHaveBeenCalledWith("question_id", "question-1");
    expect(ctx.deleted.eq).toHaveBeenCalledWith("is_correct", false);
    expect(ctx.deleted.select).toHaveBeenCalledWith("id");
    expect(syncLessonMasteryAction).toHaveBeenCalledWith("lesson-1");
    expect(revalidatePath).toHaveBeenCalledWith("/lessons/lesson-1");
    expect(ctx.adminFrom).toHaveBeenCalledWith("question_attempts");
  });

  it("does not erase a concurrently corrected attempt or recompute mastery", async () => {
    const ctx = setup({ deleteResult: false });
    await expect(resetWeakQuestion("lesson-1", "question-1"))
      .rejects.toThrow("تغيرت حالة السؤال");
    expect(ctx.deleted.eq).toHaveBeenCalledWith("is_correct", false);
    expect(syncLessonMasteryAction).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
