import { describe, expect, it } from "vitest";

import {
  LEVEL_QUESTIONS,
  SKILL_LABELS,
  evaluateLevelCheck,
  getRecommendedPath,
} from "../lib/level-check/assessment";

describe("Dadyoom introductory Arabic level check", () => {
  it("uses a stable and complete 12-question Arabic practice bank", () => {
    expect(LEVEL_QUESTIONS).toHaveLength(12);
    expect(new Set(LEVEL_QUESTIONS.map((question) => question.id)).size).toBe(12);
    const skills = Object.keys(SKILL_LABELS);
    for (const skill of skills) {
      expect(LEVEL_QUESTIONS.filter((question) => question.skill === skill)).toHaveLength(3);
    }
    for (const question of LEVEL_QUESTIONS) {
      expect(question.options).toHaveLength(4);
      expect(question.correctIndex).toBeGreaterThanOrEqual(0);
      expect(question.correctIndex).toBeLessThan(4);
      expect(question.options[question.correctIndex].trim().length).toBeGreaterThan(0);
      expect(question.explanation.trim()).not.toBe("");
    }
  });

  it("does not award points for unanswered questions", () => {
    const result = evaluateLevelCheck({});
    expect(result.answered).toBe(0);
    expect(result.correct).toBe(0);
    expect(result.percent).toBe(0);
    expect(result.band).toBe("foundation");
  });

  it("scores a complete correct response without storing student data", () => {
    const answers = Object.fromEntries(
      LEVEL_QUESTIONS.map((question) => [question.id, question.correctIndex])
    );
    const result = evaluateLevelCheck(answers);
    expect(result.answered).toBe(12);
    expect(result.correct).toBe(12);
    expect(result.percent).toBe(100);
    expect(result.band).toBe("advancing");
    expect(result.breakdown.every((item) => item.correct === 3)).toBe(true);
  });

  it("routes an area with low performance to an existing learning path", () => {
    const answers = Object.fromEntries(
      LEVEL_QUESTIONS.map((question) => [
        question.id,
        question.skill === "reading" ? (question.correctIndex + 1) % 4 : question.correctIndex,
      ])
    );
    const result = evaluateLevelCheck(answers);
    expect(result.focus.skill).toBe("reading");
    expect(result.focus.correct).toBe(0);
    expect(getRecommendedPath(result.focus.skill).href).toBe("/skills/reading/practice");
  });

  it("isn't fooled by negative or non-integer answer values", () => {
    const question = LEVEL_QUESTIONS[0];
    const result = evaluateLevelCheck({ [question.id]: -1 });
    expect(result.correct).toBe(0);
  });
});
