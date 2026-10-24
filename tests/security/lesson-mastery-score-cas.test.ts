import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: { id: "student-1" } as { id: string } | null,
  progress: {
    id: "progress-1", student_id: "student-1", lesson_id: "lesson-1",
  },
  lesson: { id: "lesson-1" } as null | { id: string },
  winner: null as null | Record<string, unknown>,
  updated: null as null | Record<string, unknown>,
  updates: vi.fn(),
  writer: vi.fn(),
  bound: vi.fn(),
  read: vi.fn(),
  updateError: null as null | { message: string },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
    from(table: string) {
      state.read(table);
      let selectedOwner: string | null = null;
      const query = {
        select: () => query,
        eq: (column: string, value: string) => {
          if (column === "student_id") selectedOwner = value;
          return query;
        },
        maybeSingle: async () => {
          if (table === "lessons") return { data: state.lesson, error: null };
          if (table === "student_lesson_progress") {
            state.read("progress-read");
            const count = state.read.mock.calls.filter(
              (call: unknown[]) => call[0] === "progress-read",
            ).length;
            return {
              data: selectedOwner !== state.progress.student_id
                ? null
                : count === 1 ? state.progress : state.winner,
              error: null,
            };
          }
          throw new Error("Unexpected table: " + table);
        },
      };
      return query;
    },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    state.writer();
    return {
      from(table: string) {
        if (table !== "student_lesson_progress") throw new Error("unexpected admin");
        const query = {
          update: (v: unknown) => {
            state.updates(v);
            return query;
          },
          eq: () => query,
          lte: (column: string, max: number) => {
            state.bound(column, max);
            return query;
          },
          select: () => query,
          maybeSingle: async () => ({ data: state.updated, error: state.updateError }),
        };
        return query;
      },
    };
  },
}));

import { updateLessonProgress } from "@/features/student-progress/repositories/progress.repository";

const values = (best: number, score = best) => ({
  status: "mastered",
  progress_percent: 100,
  last_score: score,
  best_score: best,
  xp: best >= 95 ? 30 : 20,
  completed_at: "2026-10-24T10:00:00Z",
  updated_at: "2026-10-24T10:00:00Z",
});

beforeEach(() => {
  vi.clearAllMocks();
  state.user = { id: "student-1" };
  state.lesson = { id: "lesson-1" };
  state.winner = null;
  state.updated = { id: "progress-1", ...values(95) };
  state.updateError = null;
});

describe("atomic best-score preserving mastery completion", () => {
  it("applies an owned, trusted completion only while DB best_score <= candidate", async () => {
    const result = await updateLessonProgress("progress-1", values(95));
    expect(result.data).toMatchObject({ best_score: 95, xp: 30 });
    expect(state.bound).toHaveBeenCalledWith("best_score", 95);
    expect(state.updates).toHaveBeenCalledWith(values(95));
  });

  it("losing concurrent request returns winning 100%/XP record untouched", async () => {
    state.updated = null; // DB conditional update matched zero after score 100 won
    state.winner = {
      ...state.progress,
      status: "mastered", best_score: 100, last_score: 100, xp: 30,
    };
    const result = await updateLessonProgress("progress-1", values(90));
    expect(result.data).toMatchObject({ best_score: 100, last_score: 100, xp: 30 });
    expect(state.bound).toHaveBeenCalledWith("best_score", 90);
    expect(state.updates).toHaveBeenCalledTimes(1);
  });

  it.each([
    { change: { xp: 90000 }, why: "forged XP" },
    { change: { status: "completed" }, why: "ungraded completion state" },
    { change: { best_score: 101 }, why: "impossible maximum" },
    { change: { last_score: 45 }, why: "unassessed completion" },
    { change: { progress_percent: 12 }, why: "partial completion" },
    { change: { student_id: "foreign" }, why: "changed owner" },
    { change: { completed_at: "garbage" }, why: "non-date timestamp" },
  ])("rejects $why without privileged write", async ({ change }) => {
    await expect(updateLessonProgress("progress-1", {
      ...values(95), ...change,
    })).rejects.toThrow();
    expect(state.writer).not.toHaveBeenCalled();
  });

  it("fails if concurrent winner is not visible to the owner", async () => {
    state.updated = null;
    await expect(updateLessonProgress("progress-1", values(90)))
      .rejects.toThrow("تعذر التحقق من درجة الإتقان");
  });

  it("rejects another user's progress ID before privileged write", async () => {
    state.user = { id: "foreign-user" };
    await expect(updateLessonProgress("progress-1", values(95)))
      .rejects.toThrow();
    expect(state.writer).not.toHaveBeenCalled();
  });
});
