import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { increaseSkill } from "../../services/progress/skills.service";

type Options = {
  score?: number | null;
  readError?: Error;
  writeError?: Error;
};

function fakeDatabase(options: Options = {}) {
  const writes: Array<{
    row: { student_email: string; skill: string; score: number };
    options: { onConflict: string };
  }> = [];
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({
      data: options.score == null ? null : { score: options.score },
      error: options.readError ?? null,
    })),
    upsert: vi.fn(async (
      row: { student_email: string; skill: string; score: number },
      onConflict: { onConflict: string },
    ) => {
      writes.push({ row, options: onConflict });
      return { error: options.writeError ?? null };
    }),
  };
  const from = vi.fn((table: string) => {
    expect(table).toBe("student_skills");
    return query;
  });
  return {
    supabase: { from } as unknown as SupabaseClient,
    writes, from, query,
  };
}

describe("trusted learner skill score writes", () => {
  it("inserts missing skill rows through the known unique conflict key", async () => {
    const db = fakeDatabase();
    await increaseSkill(db.supabase, " learner@example.invalid ", " القراءة ", 10);
    expect(db.writes).toEqual([{
      row: { student_email: "learner@example.invalid", skill: "القراءة", score: 10 },
      options: { onConflict: "student_email,skill" },
    }]);
    expect(db.query.eq).toHaveBeenCalledWith("student_email", "learner@example.invalid");
    expect(db.query.eq).toHaveBeenCalledWith("skill", "القراءة");
  });

  it("adjusts existing skills without erasing attempts and clamps the maximum", async () => {
    const db = fakeDatabase({ score: 95 });
    await increaseSkill(db.supabase, "learner@example.invalid", "القراءة", 20);
    expect(db.writes[0].row.score).toBe(100);
    expect(db.writes[0].row).not.toHaveProperty("attempts");
  });

  it("clamps negative adjustments at zero to satisfy the database check", async () => {
    const db = fakeDatabase({ score: 2 });
    await increaseSkill(db.supabase, "learner@example.invalid", "القراءة", -5);
    expect(db.writes[0].row.score).toBe(0);
  });

  it("does not write after a read failure", async () => {
    const db = fakeDatabase({ readError: new Error("RLS denied") });
    await expect(increaseSkill(db.supabase, "learner@example.invalid", "القراءة", 10))
      .rejects.toThrow("RLS denied");
    expect(db.writes).toEqual([]);
  });

  it("surfaces a failed upsert instead of claiming a saved skill", async () => {
    const db = fakeDatabase({ writeError: new Error("connection unavailable") });
    await expect(increaseSkill(db.supabase, "learner@example.invalid", "القراءة", 10))
      .rejects.toThrow("connection unavailable");
  });

  it("rejects invalid score deltas without contacting the database", async () => {
    const db = fakeDatabase();
    await expect(increaseSkill(db.supabase, "learner@example.invalid", "القراءة", NaN))
      .rejects.toThrow("Invalid");
    await expect(increaseSkill(db.supabase, "", "القراءة", 10))
      .rejects.toThrow("Invalid");
    expect(db.from).not.toHaveBeenCalled();
  });
});
