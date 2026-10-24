import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  id: "11111111-1111-4111-8111-111111111111",
  lessonId: "22222222-2222-4222-8222-222222222222",
  user: null as null | { id: string },
  lesson: null as null | { id: string },
  inserted: null as null | Record<string, unknown>,
  saved: null as null | Record<string, unknown>,
  insertError: null as null | { message: string },
  readError: null as null | { message: string },
  upsert: vi.fn(),
  adminCall: vi.fn(),
  progressReads: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
    from: (table: string) => {
      if (table === "lessons") {
        const query = {
          select: () => query,
          eq: () => query,
          maybeSingle: async () => ({ data: state.lesson, error: null }),
        };
        return query;
      }
      if (table === "student_lesson_progress") {
        const query = {
          select: () => query,
          eq: (column: string, value: unknown) => {
            state.progressReads(column, value);
            return query;
          },
          maybeSingle: async () => ({ data: state.saved, error: state.readError }),
        };
        return query;
      }
      throw new Error("unexpected read table: " + table);
    },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    state.adminCall();
    return {
      from: (table: string) => {
        if (table !== "student_lesson_progress") {
          throw new Error("untrusted admin table: " + table);
        }
        const query = {
          upsert: (record: unknown, options: unknown) => {
            state.upsert(record, options);
            return query;
          },
          select: () => query,
          maybeSingle: async () => ({
            data: state.inserted, error: state.insertError,
          }),
        };
        return query;
      },
    };
  },
}));

import { createLessonProgress } from "@/features/student-progress/repositories/progress.repository";

beforeEach(() => {
  vi.clearAllMocks();
  state.user = { id: state.id };
  state.lesson = { id: state.lessonId };
  state.inserted = {
    id: "33333333-3333-4333-8333-333333333333",
    student_id: state.id, lesson_id: state.lessonId,
    status: "in_progress", best_score: 0, xp: 0,
  };
  state.saved = null;
  state.insertError = null;
  state.readError = null;
});

describe("server-authorized idempotent lesson starts", () => {
  const payload = () => ({ student_id: state.id, lesson_id: state.lessonId });

  it("creates an owned, published lesson only once with ON CONFLICT DO NOTHING", async () => {
    const result = await createLessonProgress(payload());
    expect(result.data).toEqual(state.inserted);
    expect(state.upsert).toHaveBeenCalledOnce();
    const [record, options] = state.upsert.mock.calls[0];
    expect(record).toMatchObject({
      student_id: state.id, lesson_id: state.lessonId,
      status: "in_progress", xp: 0, best_score: 0,
    });
    expect(options).toEqual({
      onConflict: "student_id,lesson_id", ignoreDuplicates: true,
    });
    expect(state.progressReads).not.toHaveBeenCalled();
  });

  it("never resets XP or score after the simultaneous losing insert", async () => {
    const completed = {
      id: "33333333-3333-4333-8333-333333333333",
      student_id: state.id, lesson_id: state.lessonId,
      status: "mastered", best_score: 95, progress_percent: 100, xp: 30,
    };
    state.inserted = null; // PostgreSQL ignored duplicate insert.
    state.saved = completed;
    const result = await createLessonProgress(payload());
    expect(result.data).toEqual(completed);
    expect(state.upsert).toHaveBeenCalledOnce();
    expect(state.progressReads).toHaveBeenCalledWith("student_id", state.id);
    expect(state.progressReads).toHaveBeenCalledWith("lesson_id", state.lessonId);
  });

  it("rejects spoofed student ID before creating privileged client", async () => {
    await expect(createLessonProgress({
      student_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      lesson_id: state.lessonId,
    })).rejects.toThrow("غير مسموح");
    expect(state.adminCall).not.toHaveBeenCalled();
  });

  it("rejects unpublished lessons before opening a privileged writer", async () => {
    state.lesson = null;
    await expect(createLessonProgress(payload())).rejects.toThrow("غير منشور");
    expect(state.adminCall).not.toHaveBeenCalled();
  });

  it("fails closed when a conflicting persisted row is not RLS visible", async () => {
    state.inserted = null;
    state.saved = null;
    await expect(createLessonProgress(payload())).rejects.toThrow("تعذر التحقق");
    expect(state.progressReads).toHaveBeenCalledWith("student_id", state.id);
  });

  it("propagates storage errors instead of pretending progress was created", async () => {
    state.inserted = null;
    state.insertError = { message: "integrity failure" };
    await expect(createLessonProgress(payload())).rejects.toEqual(state.insertError);
    expect(state.progressReads).not.toHaveBeenCalled();
  });
});
