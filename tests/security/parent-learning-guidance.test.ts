import { describe, expect, it } from "vitest";
import { buildParentLearningGuidance } from "../../features/parent-link/services/parent-learning-guidance";

describe("safe family learning guidance", () => {
  it("does not invent mastery or high marks before any completed lesson", () => {
    const result = buildParentLearningGuidance({
      completedLessons: 0, masteredLessons: 0, averageScore: 100,
    });
    expect(result.academicStatus).toBe("بانتظار بيانات");
    expect(result.masteryRate).toBe(0);
    expect(result.nextAction).toContain("10 دقائق");
  });

  it.each([
    [10, 8, 90, "أداء متميز"],
    [10, 3, 90, "أداء جيد"],
    [10, 4, 72, "أداء جيد"],
    [10, 2, 55, "يحتاج متابعة"],
    [10, 0, 35, "يحتاج دعمًا إضافيًا"],
  ] as const)("uses supported performance status for %i/%i at %i%%", (completed, mastered, average, expected) => {
    const result = buildParentLearningGuidance({
      completedLessons: completed, masteredLessons: mastered, averageScore: average,
    });
    expect(result.academicStatus).toBe(expected);
    expect(result.nextAction.length).toBeGreaterThan(15);
  });

  it("clamps malformed figures rather than displaying impossible percentages", () => {
    const result = buildParentLearningGuidance({
      completedLessons: 3, masteredLessons: 99, averageScore: 999,
    });
    expect(result.masteryRate).toBe(100);
    expect(result.academicStatus).toBe("أداء متميز");
    const missing = buildParentLearningGuidance({
      completedLessons: Number.NaN, masteredLessons: -5, averageScore: Number.POSITIVE_INFINITY,
    });
    expect(missing.masteryRate).toBe(0);
    expect(missing.academicStatus).toBe("بانتظار بيانات");
  });

  it("keeps guidance separate from authoritative grading", () => {
    const result = buildParentLearningGuidance({
      completedLessons: 4, masteredLessons: 1, averageScore: 45,
    });
    expect(result).toHaveProperty("nextAction");
    expect(result).not.toHaveProperty("isCorrect");
    expect(result).not.toHaveProperty("bestScore");
    expect(result).not.toHaveProperty("studentId");
  });
});
