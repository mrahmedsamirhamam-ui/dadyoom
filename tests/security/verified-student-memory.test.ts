import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { updateStudentMemory } from "../../features/student-memory/services/updateStudentMemory";

const studentId = "11111111-1111-4111-8111-111111111111";
const otherStudent = "22222222-2222-4222-8222-222222222222";
const email = "verified@example.invalid";
const lessonId = "33333333-3333-4333-8333-333333333333";
const questionId = "44444444-4444-4444-8444-444444444444";
const sessionId = "55555555-5555-4555-8555-555555555555";

type Answer = {
  id: string; assessment_id: string; lesson_id: string; session_id: string;
  selected_answer: number; is_correct: boolean; skill: string;
};
type Key = {
  id: string; lesson_id: string | null; student_email: string;
  correct_answer: number; skill: string | null; completed: boolean;
};
type Session = { id: string; lesson_id: string; student_id: string };
type Options = {
  answers?: Answer[]; keys?: Key[]; sessions?: Session[];
  queryError?: string; writeError?: string;
};

function answer(overrides: Partial<Answer> = {}): Answer {
  return {
    id: "answer-1", assessment_id: questionId, lesson_id: lessonId,
    session_id: sessionId, selected_answer: 1,
    is_correct: false, skill: "مزور من المتصفح", ...overrides,
  };
}
function key(overrides: Partial<Key> = {}): Key {
  return {
    id: questionId, lesson_id: lessonId, student_email: email,
    correct_answer: 1, skill: "القراءة", completed: true, ...overrides,
  };
}

function fixture(opts: Options = {}) {
  const answers = opts.answers ?? [answer()];
  const keys = opts.keys ?? [key()];
  const sessions = opts.sessions ?? [{ id: sessionId, lesson_id: lessonId, student_id: studentId }];
  const calls: { table: string; selected: string; filters: Record<string, unknown>; range?: number[] }[] = [];
  const writes: unknown[][] = [];

  const from = vi.fn((table: string) => {
    if (!["assessment_session_answers", "ai_assessments",
      "assessment_sessions", "student_memory"].includes(table)) {
      throw new Error("Unexpected student-memory query " + table);
    }

    const record = { table, selected: "", filters: {} as Record<string, unknown>,
      range: undefined as number[] | undefined };
    calls.push(record);
    const q = {
      select(fields: string) { record.selected = fields; return q; },
      eq(name: string, value: unknown) { record.filters[name] = value; return q; },
      order(_name: string, _options: unknown) { return q; },
      async range(start: number, end: number) {
        record.range = [start, end];
        return {
          data: answers
            .filter(a => a && record.filters.student_id === studentId)
            .slice(start, end + 1),
          error: opts.queryError && table === "assessment_session_answers"
            ? new Error(opts.queryError) : null,
        };
      },
      async in(name: string, ids: string[]) {
        record.filters[name] = ids;
        return {
          data: (table === "ai_assessments" ? keys : sessions)
            .filter(row => ids.includes(row.id))
            .filter(row => table !== "ai_assessments"
              ? (row as Session).student_id === record.filters.student_id
              : (row as Key).student_email === record.filters.student_email),
          error: opts.queryError && table !== "assessment_session_answers"
            ? new Error(opts.queryError) : null,
        };
      },
      async upsert(rows: unknown[], _options: unknown) {
        writes.push(rows);
        return { error: opts.writeError ? new Error(opts.writeError) : null };
      },
    };
    return q;
  });
  return { client: { from } as unknown as SupabaseClient, from, calls, writes };
}

function update(db: ReturnType<typeof fixture>, studentEmail = email) {
  return updateStudentMemory({
    supabase: db.client, studentId, studentEmail,
  });
}

describe("trusted student memory recomputation", () => {
  it("ignores forged is_correct, correct_answer and skill from saved answer rows", async () => {
    const db = fixture();
    const out = await update(db);
    expect(out).toMatchObject([{
      student_id: studentId, skill: "القراءة", score: 100, attempts: 1,
    }]);
    expect(db.writes).toHaveLength(1);
    expect(db.calls.find(c => c.table === "assessment_session_answers")?.selected)
      .toBe("assessment_id,lesson_id,session_id,selected_answer");
    expect(JSON.stringify(db.calls)).not.toContain("is_correct");
    expect(db.calls.find(c => c.table === "ai_assessments")?.filters)
      .toMatchObject({ student_email: email });
  });

  it("records an incorrect selection even if client stored is_correct=true", async () => {
    const db = fixture({ answers: [answer({ selected_answer: 0, is_correct: true })] });
    const out = await update(db);
    expect(out).toMatchObject([{ skill: "القراءة", score: 0, attempts: 1 }]);
  });

  it("rejects a foreign key, unmatched lesson or other student session before writing", async () => {
    for (const options of [
      { keys: [key({ student_email: "other@example.invalid" })] },
      { keys: [key({ lesson_id: "other-lesson" })] },
      { sessions: [{ id: sessionId, lesson_id: lessonId, student_id: otherStudent }] },
      { keys: [key({ completed: false })] },
    ]) {
      const db = fixture(options);
      await expect(update(db)).rejects.toThrow(/Unverifiable/);
      expect(db.writes).toEqual([]);
    }
  });

  it("recomputes all answer pages rather than silently truncating at 500 rows", async () => {
    const answers = Array.from({ length: 501 }, (_, i) =>
      answer({ id: String(i), selected_answer: i === 500 ? 0 : 1 })
    );
    const db = fixture({ answers });
    const out = await update(db);
    expect(out).toMatchObject([{ attempts: 501, score: 100 }]);
    expect(db.calls.filter(c => c.table === "assessment_session_answers").map(c => c.range))
      .toEqual([[0, 499], [500, 999]]);
  });

  it("returns empty without creating a bogus memory row for new students", async () => {
    const db = fixture({ answers: [] });
    expect(await update(db)).toEqual([]);
    expect(db.writes).toEqual([]);
  });

  it("fails closed on DB lookup or upsert errors", async () => {
    const lookup = fixture({ queryError: "privacy boundary failed" });
    await expect(update(lookup)).rejects.toThrow("privacy boundary failed");
    expect(lookup.writes).toEqual([]);

    const write = fixture({ writeError: "upsert rejected" });
    await expect(update(write)).rejects.toThrow("upsert rejected");
  });

  it("rejects an absent trusted authenticated identity", async () => {
    const db = fixture();
    await expect(update(db, "")).rejects.toThrow("Student identity");
    expect(db.from).not.toHaveBeenCalled();
  });
});
