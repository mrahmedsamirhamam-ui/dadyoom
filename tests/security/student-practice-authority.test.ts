import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { completeAdaptiveStep } from "@/features/learning-plan/services/adaptive-path-lifecycle";
import { submitPracticeAction } from "@/features/practice/actions/submitPractice";
import { getLessonQuestions } from "@/features/questions/queries/getLessonQuestions";
import { getAdaptiveLessonData } from "@/features/adaptive-learning/queries/getAdaptiveLessonData";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/learning-plan/services/adaptive-path-lifecycle", () => ({ completeAdaptiveStep: vi.fn() }));

function client(results: Record<string, { data: unknown; error: unknown }>, user: { id: string } | null = { id: "student-a" }) {
  const queries: { table: string; selected: string }[] = [];
  const db = {
    auth: { getUser: vi.fn(async () => ({ data: { user }, error: null })) },
    from: vi.fn((table: string) => {
      const query = { table, selected: "" }; queries.push(query);
      const builder = {
        select: vi.fn((selected: string) => { query.selected = selected; return builder; }),
        eq: vi.fn(() => builder), order: vi.fn(() => builder), in: vi.fn(() => builder),
        maybeSingle: vi.fn(() => builder), limit: vi.fn(() => builder), gt: vi.fn(() => builder),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(results[table] ?? { data: null, error: null }).then(resolve),
      };
      return builder;
    }),
  };
  return { db, queries };
}
const options = [{ id: "a", text: "اختيار أ" }, { id: "b", text: "اختيار ب" }];
const stored = ["q1", "q2"].map(id => ({ id, question_type: "multiple_choice", options, correct_answer: "a" }));
let session: ReturnType<typeof client>;
let trusted: ReturnType<typeof client>;
const submitted = (value: unknown) => value as Parameters<typeof submitPracticeAction>[1];

beforeEach(() => {
  vi.clearAllMocks();
  session = client({ dadyoom_student_questions: { data: [{ id: "q1" }, { id: "q2" }], error: null } });
  trusted = client({ questions: { data: stored, error: null } });
  vi.mocked(createClient).mockResolvedValue(session.db as unknown as Awaited<ReturnType<typeof createClient>>);
  vi.mocked(createAdminClient).mockReturnValue(trusted.db as unknown as ReturnType<typeof createAdminClient>);
  vi.mocked(completeAdaptiveStep).mockResolvedValue({ completed: true } as unknown as Awaited<ReturnType<typeof completeAdaptiveStep>>);
});

describe("server-owned practice assessment", () => {
  it("requires authentication before any question or key read", async () => {
    session = client({}, null);
    vi.mocked(createClient).mockResolvedValue(session.db as unknown as Awaited<ReturnType<typeof createClient>>);
    await expect(submitPracticeAction("lesson", [])).rejects.toThrow("تسجيل الدخول");
    expect(session.db.from).not.toHaveBeenCalled(); expect(createAdminClient).not.toHaveBeenCalled();
  });
  it("requires visible published question IDs before administrative key access", async () => {
    session = client({ dadyoom_student_questions: { data: [], error: null } });
    vi.mocked(createClient).mockResolvedValue(session.db as unknown as Awaited<ReturnType<typeof createClient>>);
    await expect(submitPracticeAction("hidden", [{questionId:"q1",optionId:"a"}])).rejects.toThrow("لا توجد أسئلة");
    expect(createAdminClient).not.toHaveBeenCalled();
  });
  it.each([null, {}, [], [{questionId:"q1",optionId:"a"},{questionId:"q1",optionId:"a"}], [{questionId:"other",optionId:"a"}], [{questionId:"q1",optionId:10}]])("rejects malformed, repeated and foreign answers: %j", async value => {
    await expect(submitPracticeAction("lesson", submitted(value))).rejects.toThrow();
    expect(createAdminClient).not.toHaveBeenCalled(); expect(completeAdaptiveStep).not.toHaveBeenCalled();
  });
  it("requires every published question, and keeps keys server-only", async () => {
    await expect(submitPracticeAction("lesson", [{questionId:"q1",optionId:"a"}])).rejects.toThrow("المتبقي 1");
    expect(createAdminClient).not.toHaveBeenCalled();
  });
  it("ignores forged grade/user fields and does not unlock a failed practice", async () => {
    const result = await submitPracticeAction("lesson", submitted([{questionId:"q1",optionId:"b",is_correct:true,score:100,user_id:"other"},{questionId:"q2",optionId:"b",is_correct:true}]));
    expect(result.score).toBe(0); expect(result.passed).toBe(false); expect(completeAdaptiveStep).not.toHaveBeenCalled();
    expect(result).not.toHaveProperty("correct_answer");
    expect(result).not.toHaveProperty("correctAnswer");
    expect(result).not.toHaveProperty("explanation");
    expect(session.queries).toEqual([{ table:"dadyoom_student_questions",selected:"id" }]);
    expect(trusted.queries[0].table).toBe("questions");
  });
  it("grades valid answers from stored keys and uses authenticated identity", async () => {
    const result = await submitPracticeAction("lesson", [{questionId:"q1",optionId:"a"},{questionId:"q2",optionId:"a"}]);
    expect(result.score).toBe(100); expect(completeAdaptiveStep).toHaveBeenCalledWith(expect.objectContaining({studentId:"student-a",lessonId:"lesson",stepType:"practice"}));
  });
  it("fails closed for absent server keys or invalid options", async () => {
    trusted = client({ questions: { data: stored.slice(0,1), error: null } });
    vi.mocked(createAdminClient).mockReturnValue(trusted.db as unknown as ReturnType<typeof createAdminClient>);
    await expect(submitPracticeAction("lesson", [{questionId:"q1",optionId:"a"},{questionId:"q2",optionId:"a"}])).rejects.toThrow("تغيّرت");
    expect(completeAdaptiveStep).not.toHaveBeenCalled();
  });
  it("rejects a choice not present in stored options", async () => {
    await expect(submitPracticeAction("lesson", [{questionId:"q1",optionId:"invented"},{questionId:"q2",optionId:"a"}])).rejects.toThrow("غير صالح للتصحيح");
    expect(completeAdaptiveStep).not.toHaveBeenCalled();
  });
});

describe("remaining student question readers", () => {
  it("the general lesson reader projects safe rows and nested options", async () => {
    session = client({dadyoom_student_questions:{data:[{...stored[0],lesson_id:"lesson",question:"سؤال",points:1,question_order:1,explanation:"hidden",options:[{id:"a",text:"أ",is_correct:true}]}],error:null}});
    vi.mocked(createClient).mockResolvedValue(session.db as unknown as Awaited<ReturnType<typeof createClient>>);
    const rows = await getLessonQuestions("lesson");
    expect(session.queries[0].table).toBe("dadyoom_student_questions");
    expect(JSON.stringify(rows)).not.toMatch(/correct_answer|explanation|is_correct/);
    expect(rows[0].options).toEqual([{id:"a",text:"أ"}]);
  });
  it("adaptive ID fallback never needs raw question table access", async () => {
    session = client({dadyoom_student_questions:{data:[{id:"q1"}],error:null},question_attempts:{data:[],error:null}});
    const data = await getAdaptiveLessonData("student-a","lesson",{supabase:session.db as unknown as Awaited<ReturnType<typeof createClient>>,lesson:{id:"lesson",unit_id:"unit",lesson_number:1},nextLesson:null});
    expect(data?.attempts).toEqual([]);
    expect(session.queries).toEqual([{table:"dadyoom_student_questions",selected:"id"},{table:"question_attempts",selected:expect.any(String)}]);
  });
});
