import { describe, expect, it } from "vitest";
import { guestQuestions, assessGuestAnswer } from "@/lib/growth/guest-trial";

describe("no-signup Arabic micro lesson", () => {
  it("has two questions and grounded explanations", () => {
    expect(guestQuestions).toHaveLength(2);
    for (const question of guestQuestions) {
      expect(question.options).toContain(question.answer);
      expect(question.explanation.length).toBeGreaterThan(30);
    }
  });

  it("recognizes the right answer while tolerating Arabic diacritics", () => {
    expect(assessGuestAnswer(guestQuestions[0], "كِتاب")).toBe(true);
    expect(assessGuestAnswer(guestQuestions[0], "يركض")).toBe(false);
  });

  it("does not imply official curriculum coverage", () => {
    expect(guestQuestions.map((q) => q.prompt).join(" ")).not.toMatch(/وزار|منهج معتمد/);
  });
});
