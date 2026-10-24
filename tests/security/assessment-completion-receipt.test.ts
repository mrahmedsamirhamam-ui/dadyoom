import { beforeEach, describe, expect, it, vi } from "vitest";

import { verifyAssessmentCompletionReceipt } from
  "../../features/assessment/services/verifyAssessmentCompletionReceipt";

const sessionId = "11111111-1111-4111-8111-111111111111";
const studentId = "22222222-2222-4222-8222-222222222222";
const lessonId = "33333333-3333-4333-8333-333333333333";

const session = {
  id: sessionId,
  student_id: studentId,
  lesson_id: lessonId,
  total_questions: 5,
  correct_answers: 4,
  wrong_answers: 1,
  finished: true,
};
const analytics = { totalQuestions: 5, totalCorrect: 4, totalWrong: 1 };
const receipt = {
  session_id: sessionId,
  student_id: studentId,
  lesson_id: lessonId,
  total_questions: 5,
  correct_answers: 4,
  wrong_answers: 1,
};

function client(initial: typeof receipt | null = null) {
  let stored: typeof receipt | null = initial;
  const inserted: (typeof receipt)[] = [];
  const selects: string[] = [];
  const from = vi.fn((table: string) => {
    expect(table).toBe("assessment_completion_receipts");
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn((column: string) => { selects.push(column); return query; }),
      maybeSingle: vi.fn(async () => ({ data: stored, error: null })),
      insert: vi.fn(async (row: typeof receipt) => {
        inserted.push(row);
        stored = row;
        return { error: null };
      }),
    };
    return query;
  });
  return { admin: { from } as never, from, inserted, selects };
}

beforeEach(() => vi.clearAllMocks());

describe("append-only assessment receipt: trusted recovery after interruption", () => {
  it("mints a receipt only for verified newly completed sessions", async () => {
    const db = client();
    const verified = await verifyAssessmentCompletionReceipt({
      admin: db.admin, session, studentId, lessonId, analytics, allowCreate: true,
    });
    expect(verified).toBe(true);
    expect(db.inserted).toEqual([receipt]);
    expect(db.selects).toContain("student_id");
    expect(db.selects).toContain("lesson_id");
  });

  it("reuses a preexisting trusted receipt on an interrupted retry", async () => {
    const db = client(receipt);
    expect(await verifyAssessmentCompletionReceipt({
      admin: db.admin, session, studentId, lessonId, analytics, allowCreate: false,
    })).toBe(true);
    expect(db.inserted).toEqual([]);
  });

  it("denies an already-finished session with no prior server receipt", async () => {
    const db = client();
    expect(await verifyAssessmentCompletionReceipt({
      admin: db.admin, session, studentId, lessonId, analytics, allowCreate: false,
    })).toBe(false);
    expect(db.inserted).toEqual([]);
  });

  it("rejects a forged session score or truncated/reordered answer evidence before touching DB", async () => {
    for (const invalid of [
      { ...session, correct_answers: 5 },
      { ...session, total_questions: 1 },
      { ...session, wrong_answers: -1 },
      { ...session, finished: false },
      { ...session, lesson_id: "forged-lesson" },
    ]) {
      const db = client();
      expect(await verifyAssessmentCompletionReceipt({
        admin: db.admin, session: invalid, studentId, lessonId, analytics, allowCreate: true,
      })).toBe(false);
      expect(db.from).not.toHaveBeenCalled();
    }
  });

  it("denies a mismatching immutable receipt instead of overwriting it", async () => {
    const db = client({ ...receipt, correct_answers: 5, wrong_answers: 0 });
    expect(await verifyAssessmentCompletionReceipt({
      admin: db.admin, session, studentId, lessonId, analytics, allowCreate: true,
    })).toBe(false);
    expect(db.inserted).toEqual([]);
  });
});
