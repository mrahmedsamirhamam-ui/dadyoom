import { describe, expect, it } from "vitest";

import {
  LEVEL_QUESTIONS,
  SKILL_LABELS,
  evaluateLevelCheck,
  getRecommendedPath,
  getGuidedLearningPlan,
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

  it("builds three safe in-app learning steps for every assessed skill", () => {
    for (const skill of Object.keys(SKILL_LABELS) as (keyof typeof SKILL_LABELS)[]) {
      const plan = getGuidedLearningPlan(skill);
      expect(plan).toHaveLength(3);
      expect(plan.map((step) => step.id)).toEqual(["practice", "curriculum", "review"]);
      expect(plan[0].href).toBe(getRecommendedPath(skill).href);
      expect(new Set(plan.map((step) => step.href)).size).toBe(3);
      for (const step of plan) {
        expect(step.href.startsWith("/")).toBe(true);
        expect(step.href.startsWith("//")).toBe(false);
        expect(step.href.includes("://")).toBe(false);
        expect(step.title.trim()).not.toBe("");
        expect(step.detail.trim()).not.toBe("");
      }
    }
  });

  it("guides grammar learners to a real explanation route rather than duplicating the curriculum link", () => {
    const plan = getGuidedLearningPlan("grammar");
    expect(plan[0].href).toBe("/courses");
    expect(plan[1].href).toBe("/ask");
    expect(plan[2].href).toBe("/level-check");
    expect(plan[2].detail).toContain("لا تثبت تحسنًا معتمدًا");
  });
});
