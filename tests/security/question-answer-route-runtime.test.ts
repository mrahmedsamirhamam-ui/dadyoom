import { beforeEach, describe, expect, it, vi } from "vitest";

// Exercise the real Next.js route handler without credentials or network I/O.
// The security suite globally blocks outbound requests: all data below is synthetic.
const { createClient, createAdminClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));

import { POST } from "../../app/api/questions/answer/route";

const userId = "11111111-1111-4111-8111-111111111111";
const strangerId = "22222222-2222-4222-8222-222222222222";
const questionId = "33333333-3333-4333-8333-333333333333";
const lessonId = "44444444-4444-4444-8444-444444444444";

type Row = Record<string, unknown>;
type StubOptions = {
  user?: { id: string } | null;
  visible?: Row | null;
  lesson?: Row | null;
  privateQuestion?: Row | null;
  saveError?: { message: string } | null;
};
type DbCall = {
  scope: "student" | "trusted";
  table: string;
  fields: string | null;
  filters: Record<string, unknown>;
};

function stubDatabase(options: StubOptions = {}) {
  const calls: DbCall[] = [];
  const writes: { table: string; value: Row; options: unknown }[] = [];
  const user = options.user === undefined ? { id: userId } : options.user;
  const fixtures: Record<string, Row | null> = {
    dadyoom_student_questions: options.visible === undefined
      ? { id: questionId, lesson_id: lessonId } : options.visible,
    lessons: options.lesson === undefined
      ? { id: lessonId, status: "published" } : options.lesson,
    questions: options.privateQuestion === undefined
      ? {
          id: questionId,
          lesson_id: lessonId,
          question_type: "multiple_choice",
          options: [{ id: "a", text: "خطأ" }, { id: "b", text: "صواب" }],
          correct_answer: "b",
          explanation: "التفسير الخاص",
        }
      : options.privateQuestion,
  };
  const from = (scope: DbCall["scope"]) => vi.fn((table: string) => {
    const call: DbCall = { scope, table, fields: null, filters: {} };
    calls.push(call);
    const query = {
      select: vi.fn((fields: string) => { call.fields = fields; return query; }),
      eq: vi.fn((field: string, value: unknown) => {
        call.filters[field] = value;
        return query;
      }),
      maybeSingle: vi.fn(async () => {
        const row = fixtures[table] ?? null;
        const matches = row && Object.entries(call.filters).every(([key, value]) =>
          row[key] === value);
        return { data: matches ? row : null, error: null };
      }),
      upsert: vi.fn(async (value: Row, upsertOptions: unknown) => {
        writes.push({ table, value, options: upsertOptions });
        return { error: options.saveError ?? null };
      }),
    };
    return query;
  });
  const student = { auth: { getUser: vi.fn().mockResolvedValue({
    data: { user }, error: null,
  }) }, from: from("student") };
  const trusted = { from: from("trusted") };
  createClient.mockResolvedValue(student);
  createAdminClient.mockReturnValue(trusted);
  return { calls, writes, student, trusted };
}

function request(body: unknown) {
  return new Request("http://localhost/api/questions/answer", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("real stored-question POST route: authorization and trusted grading", () => {
  it("rejects anonymous users without opening the trusted answer client", async () => {
    const db = stubDatabase({ user: null });
    const response = await POST(request({ questionId, selectedAnswer: "b" }));
    expect(response.status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(db.calls).toEqual([]);
    expect(db.writes).toEqual([]);
  });

  it("rejects malformed question identifiers before database lookup", async () => {
    const db = stubDatabase();
    const response = await POST(request({ questionId: "not-a-uuid", selectedAnswer: "b" }));
    expect(response.status).toBe(400);
    expect(db.calls).toEqual([]);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("blocks RLS-invisible questions before private key reads", async () => {
    const db = stubDatabase({ visible: null });
    const response = await POST(request({ questionId, selectedAnswer: "b" }));
    expect(response.status).toBe(404);
    expect(db.calls.map(c => c.table)).toEqual(["dadyoom_student_questions"]);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects unpublished lessons even if a stale question view returned an id", async () => {
    const db = stubDatabase({ lesson: { id: lessonId, status: "draft" } });
    const response = await POST(request({ questionId, selectedAnswer: "b" }));
    expect(response.status).toBe(404);
    expect(db.calls.map(c => c.table))
      .toEqual(["dadyoom_student_questions", "lessons"]);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("recomputes a forged correctness flag and never writes an impersonated user id", async () => {
    const db = stubDatabase();
    const response = await POST(request({
      questionId,
      selectedAnswer: "a",
      isCorrect: true,
      userId: strangerId,
      grade: 100,
      correctAnswer: "a",
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      isCorrect: false,
      correctAnswer: null,
      explanation: null,
    });
    expect(db.writes).toHaveLength(1);
    expect(db.writes[0]).toMatchObject({
      table: "question_attempts",
      value: { user_id: userId, question_id: questionId, selected_answer: "a", is_correct: false },
      options: { onConflict: "user_id,question_id" },
    });
    expect(db.calls.map(c => [c.scope, c.table])).toEqual([
      ["student", "dadyoom_student_questions"],
      ["student", "lessons"],
      ["trusted", "questions"],
      ["trusted", "question_attempts"],
    ]);
    expect(db.calls.find(c => c.table === "questions")?.filters)
      .toEqual({ id: questionId, lesson_id: lessonId });
    expect(db.calls.find(c => c.table === "questions")?.fields)
      .toContain("correct_answer");
  });

  it("returns explanatory feedback only for a verified correct option", async () => {
    const db = stubDatabase();
    const response = await POST(request({ questionId, selectedAnswer: "b", isCorrect: false }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      isCorrect: true,
      correctAnswer: "b",
      explanation: "التفسير الخاص",
    });
    expect(db.writes[0].value).toMatchObject({
      user_id: userId, is_correct: true, selected_answer: "b",
    });
  });

  it("rejects non-option answers without recording grades", async () => {
    const db = stubDatabase();
    const response = await POST(request({ questionId, selectedAnswer: "z" }));
    expect(response.status).toBe(400);
    expect(db.writes).toEqual([]);
  });

  it("fails closed if the private question no longer matches the published lesson", async () => {
    const db = stubDatabase({ privateQuestion: {
      id: questionId, lesson_id: strangerId, question_type: "multiple_choice",
      correct_answer: "b", options: [{ id: "a" }, { id: "b" }],
    } });
    const response = await POST(request({ questionId, selectedAnswer: "b" }));
    expect(response.status).toBe(404);
    expect(db.writes).toEqual([]);
  });

  it("rejects malformed JSON, invalid UTF-8 and empty bodies without private reads", async () => {
    const db = stubDatabase();
    const malformed = new Request("http://localhost/api/questions/answer", {
      method: "POST", body: "{not valid JSON",
    });
    expect((await POST(malformed)).status).toBe(400);
    expect((await POST(request(null))).status).toBe(400);
    expect((await POST(new Request("http://localhost/api/questions/answer", {
      method: "POST",
    }))).status).toBe(400);
    const brokenBytes = new Uint8Array([0xc3, 0x28]);
    const invalidUtf8 = new Request("http://localhost/api/questions/answer", {
      method: "POST", body: brokenBytes,
    });
    expect((await POST(invalidUtf8)).status).toBe(400);
    expect(db.calls).toEqual([]);
    expect(db.writes).toEqual([]);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects both advertised and chunked oversized JSON before grading", async () => {
    const db = stubDatabase();
    const advertised = new Request("http://localhost/api/questions/answer", {
      method: "POST", headers: { "content-length": "32769" },
      body: JSON.stringify({ questionId, selectedAnswer: "b" }),
    });
    expect((await POST(advertised)).status).toBe(413);

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(20000).fill(65));
        controller.enqueue(new Uint8Array(20000).fill(66));
        controller.close();
      },
    });
    const chunked = new Request("http://localhost/api/questions/answer", {
      method: "POST", body: stream, duplex: "half",
    } as RequestInit & { duplex: "half" });
    expect((await POST(chunked)).status).toBe(413);
    expect(db.calls).toEqual([]);
    expect(db.writes).toEqual([]);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("accepts a valid Arabic JSON body split inside multibyte UTF-8", async () => {
    const db = stubDatabase();
    const bytes = new TextEncoder().encode(JSON.stringify({
      questionId, selectedAnswer: "b", note: "رمان",
    }));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
        controller.close();
      },
    });
    const streamed = new Request("http://localhost/api/questions/answer", {
      method: "POST", body: stream, duplex: "half",
    } as RequestInit & { duplex: "half" });
    expect((await POST(streamed)).status).toBe(200);
    expect(db.writes).toHaveLength(1);
    expect(db.writes[0].value).toMatchObject({
      user_id: userId, question_id: questionId, is_correct: true,
    });
  });

});
