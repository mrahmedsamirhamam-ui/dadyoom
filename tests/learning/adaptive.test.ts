import { describe, expect, it } from "vitest";
import { recommendNextStep, type LearnerPreferences } from "../../lib/learning/adaptive";

const preferences: LearnerPreferences = {
  goal: "conversation", preferredMode: "audio", interfaceLanguage: "en",
};

describe("global Arabic adaptive recommendations", () => {
  it("does not advance learners with insufficient evidence", () => {
    expect(recommendNextStep({ skill: "speaking", correct: 2, total: 2, recentMistakes: 0 }, preferences).action).toBe("practice");
  });
  it("recommends review when accuracy is low", () => {
    expect(recommendNextStep({ skill: "grammar", correct: 2, total: 5, recentMistakes: 1 }, preferences).action).toBe("review");
  });
  it("advances only after consistent performance", () => {
    const result = recommendNextStep({ skill: "reading", correct: 9, total: 10, recentMistakes: 0 }, preferences);
    expect(result.action).toBe("advance");
    expect(result.mode).toBe("audio");
  });
  it("does not advance when recent mistakes remain", () => {
    expect(recommendNextStep({ skill: "spelling", correct: 9, total: 10, recentMistakes: 3 }, preferences).action).toBe("review");
  });
  it("rejects invalid and negative evidence", () => {
    expect(() => recommendNextStep({ skill: "writing", correct: 5, total: 3, recentMistakes: 0 }, preferences)).toThrow();
    expect(() => recommendNextStep({ skill: "writing", correct: 0, total: -1, recentMistakes: 0 }, preferences)).toThrow();
  });
});
