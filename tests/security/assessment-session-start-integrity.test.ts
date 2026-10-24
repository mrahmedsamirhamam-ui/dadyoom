import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { startAssessmentSession } from "../../features/assessment/services/startAssessmentSession";

const studentId = "11111111-1111-4111-8111-111111111111";
const lessonId = "22222222-2222-4222-8222-222222222222";

type Session = {
  id: string;
  student_id: string;
  lesson_id: string;
  finished: boolean;
  current_question: number;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  difficulty: string;
};
const validSession: Session = {
  id: "33333333-3333-4333-8333-333333333333",
  student_id: studentId, lesson_id: lessonId,
  finished: false, current_question: 1, total_questions: 5,
  correct_answers: 0, wrong_answers: 0, difficulty: "easy",
};
type Fixture = {
  existing?: Session | null;
  lookupError?: Error;
  created?: Session | null;
  insertError?: Error;
};
function database(f: Fixture = {}) {
  const calls: { operation: "read" | "insert"; columns: string[]; predicates: unknown[] }[] = [];
  const query = {
    select: vi.fn((columns: string) => {
      calls[calls.length - 1]?.columns.push(columns);
      return query;
    }),
    eq: vi.fn((field: string, value: unknown) => {
      calls[calls.length - 1]?.predicates.push([field, value]);
      return query;
    }),
    maybeSingle: vi.fn(async () => ({
      data: f.existing === undefined ? validSession : f.existing,
      error: f.lookupError ?? null,
    })),
    insert: vi.fn((payload: unknown) => {
      calls.push({ operation: "insert", columns: [], predicates: [payload] });
      return query;
    }),
    single: vi.fn(async () => ({
      data: f.created === undefined ? validSession : f.created,
      error: f.insertError ?? null,
    })),
  };
  const from = vi.fn((table: string) => {
    expect(table).toBe("assessment_sessions");
    calls.push({ operation: "read", columns: [], predicates: [] });
    return query;
  });
  return { supabase: { from } as unknown as SupabaseClient, from, query, calls };
}

function start(db: ReturnType<typeof database>) {
  return startAssessmentSession({ supabase: db.supabase, studentId, lessonId });
}

describe("secure reuse or creation of assessment sessions", () => {
  it("reuses the authenticated learner's unfinished session without inserting", async () => {
    const db = database();
    expect(await start(db)).toMatchObject(validSession);
    expect(db.query.insert).not.toHaveBeenCalled();
    expect(db.query.eq).toHaveBeenCalledWith("student_id", studentId);
    expect(db.query.eq).toHaveBeenCalledWith("lesson_id", lessonId);
    expect(db.query.eq).toHaveBeenCalledWith("finished", false);
    const projected = db.calls[0].columns[0];
    expect(projected).toContain("id,student_id,lesson_id");
    expect(projected).not.toContain("*");
    expect(projected.split(",")).not.toContain("correct_answer");
  });

  it("creates an owned unfinished session only after a clean empty lookup", async () => {
    const db = database({ existing: null });
    expect(await start(db)).toMatchObject(validSession);
    expect(db.query.insert).toHaveBeenCalledExactlyOnceWith({
      student_id: studentId, lesson_id: lessonId,
    });
    expect(db.calls.map(x => x.operation)).toEqual(["read", "read", "insert"]);
  });

  it("never inserts if the unfinished-session lookup fails or finds multiple rows", async () => {
    for (const message of ["network unavailable", "PGRST116 multiple rows"]) {
      const db = database({ lookupError: new Error(message), existing: null });
      await expect(start(db)).rejects.toThrow(message);
      expect(db.query.insert).not.toHaveBeenCalled();
    }
  });

  it("rejects a returned session for another student or lesson", async () => {
    for (const row of [
      { ...validSession, student_id: "other" },
      { ...validSession, lesson_id: "other" },
      { ...validSession, finished: true },
      { ...validSession, id: "" },
    ]) {
      const db = database({ existing: row });
      await expect(start(db)).rejects.toThrow(/جلسة الاختبار/);
      expect(db.query.insert).not.toHaveBeenCalled();
    }
  });

  it("does not accept an inconsistent created session or failed insert", async () => {
    let db = database({ existing: null, insertError: new Error("database write denied") });
    await expect(start(db)).rejects.toThrow("database write denied");
    db = database({ existing: null, created: { ...validSession, student_id: "other" } });
    await expect(start(db)).rejects.toThrow(/جلسة الاختبار/);
    db = database({ existing: null, created: null });
    await expect(start(db)).rejects.toThrow(/إنشاء جلسة/);
  });

  it("rejects missing student or lesson IDs before touching the database", async () => {
    const db = database();
    await expect(startAssessmentSession({
      supabase: db.supabase, studentId: "", lessonId,
    })).rejects.toThrow(/الطالب والدرس/);
    await expect(startAssessmentSession({
      supabase: db.supabase, studentId, lessonId: " ",
    })).rejects.toThrow(/الطالب والدرس/);
    expect(db.from).not.toHaveBeenCalled();
  });
});
