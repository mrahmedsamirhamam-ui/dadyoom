import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { getAssessmentSessionAnalytics } from "../../features/assessment/services/getAssessmentSessionAnalytics";

type Answer = {
  assessment_id: string;
  selected_answer: number;
  skill: string;
  is_correct?: boolean;
};
type Key = { id: string; correct_answer: number };

function createFakeDatabase(answers: Answer[], keys: Key[]) {
  const queries: { table: string; filters: Record<string, unknown> }[] = [];
  const from = (table: string) => ({
    select: (_fields: string) => {
      const call = { table, filters: {} as Record<string, unknown> };
      queries.push(call);
      const chain = {
        eq(column: string, value: unknown) {
          call.filters[column] = value;
          return chain;
        },
        in(column: string, value: unknown) {
          call.filters[column] = value;
          return chain;
        },
        order(_column: string, _options?: { ascending: boolean }) {
          return chain;
        },
        then(resolve: (result: {data: unknown[]; error: null}) => unknown, reject?: (reason: unknown) => unknown) {
          return Promise.resolve({
            data: table === "assessment_session_answers" ? answers : keys,
            error: null,
          }).then(resolve, reject);
        },
      };
      return chain;
    },
  });
  return { supabase: { from } as unknown as SupabaseClient, queries };
}

const evaluate = (supabase: SupabaseClient) =>
  getAssessmentSessionAnalytics({
    supabase,
    sessionId: "session-test",
    studentId: "student-test",
    studentEmail: "test@example.invalid",
    lessonId: "lesson-test",
  });

describe("AI assessment analytics uses trusted keys, not writable flags", () => {
  it("marks a forged true flag wrong when the chosen option is incorrect", async () => {
    const { supabase, queries } = createFakeDatabase(
      [{ assessment_id: "q1", selected_answer: 0, skill: "النحو", is_correct: true }],
      [{ id: "q1", correct_answer: 2 }]
    );
    const result = await evaluate(supabase);
    expect(result.totalQuestions).toBe(1);
    expect(result.totalCorrect).toBe(0);
    expect(result.totalWrong).toBe(1);
    expect(queries.find(q => q.table === "assessment_session_answers")?.filters)
      .toMatchObject({ session_id: "session-test", student_id: "student-test" });
    expect(queries.find(q => q.table === "ai_assessments")?.filters)
      .toMatchObject({
        student_email: "test@example.invalid",
        lesson_id: "lesson-test",
        id: ["q1"],
      });
  });
  it("recognizes a correct choice even when a stored flag is false", async () => {
    const { supabase } = createFakeDatabase(
      [{ assessment_id: "q1", selected_answer: 2, skill: "القراءة", is_correct: false }],
      [{ id: "q1", correct_answer: 2 }]
    );
    const result = await evaluate(supabase);
    expect(result.totalCorrect).toBe(1);
    expect(result.totalWrong).toBe(0);
  });
  it("fails closed when one recorded question key is not authorized", async () => {
    const { supabase } = createFakeDatabase(
      [{ assessment_id: "q1", selected_answer: 2, skill: "القراءة" }],
      []
    );
    await expect(evaluate(supabase)).rejects.toThrow("مفاتيح جميع أسئلة الجلسة");
  });
  it("reports an empty session without issuing a private key query", async () => {
    const { supabase, queries } = createFakeDatabase([],[]);
    const result = await evaluate(supabase);
    expect(result.totalQuestions).toBe(0);
    expect(result.totalCorrect).toBe(0);
    expect(result.totalWrong).toBe(0);
    expect(queries.map(x => x.table)).toEqual(["assessment_session_answers"]);
  });
});
