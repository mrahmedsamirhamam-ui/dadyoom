import { describe, expect, it } from "vitest";
import { parseAnswerSubmission } from "@/lib/security/answer-submission";

const VALID = "a1111111-1111-4111-8111-111111111111";
describe("P0: browser cannot submit grades or identity", () => {
  it("accepts only a question id and an option id", () => {
    expect(parseAnswerSubmission({
      questionId: VALID, selectedAnswer: "b",
    })).toEqual({ questionId: VALID, selectedAnswer: "b" });
  });
  it.each([
    null, [], {}, { questionId: VALID }, { questionId: "spoof", selectedAnswer: "b" },
    { questionId: VALID, selectedAnswer: { id: "b" } },
    { questionId: VALID, selectedAnswer: "" },
    { questionId: VALID, selectedAnswer: "x".repeat(129) },
    { questionId: VALID, selectedAnswer: "b", isCorrect: true },
    { questionId: VALID, selectedAnswer: "b", score: 100 },
    { questionId: VALID, selectedAnswer: "b", userId: "other" },
    { questionId: VALID, selectedAnswer: "b", correctAnswer: "b" },
    { questionId: VALID, selectedAnswer: "b", role: "admin" },
  ])("rejects unexpected payload %j", (value) => {
    expect(parseAnswerSubmission(value)).toBeNull();
  });
});
