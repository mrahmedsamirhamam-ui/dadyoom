import { describe, expect, it } from "vitest";
import { originalBahrainPilots } from "../../lib/lesson-learning/original-bahrain-pilots";

describe("original Bahrain lesson pilots", () => {
  it("uses three distinct original grade-six skill sequences", () => {
    expect(originalBahrainPilots).toHaveLength(3);
    expect(new Set(originalBahrainPilots.map((lesson) => lesson.id)).size).toBe(3);
    expect(new Set(originalBahrainPilots.map((lesson) => lesson.domain)).size).toBe(3);
  });

  it("requires specific objectives, real answers and explanations", () => {
    for (const lesson of originalBahrainPilots) {
      expect(lesson.grade).toBe(6);
      expect(lesson.objectives).toHaveLength(2);
      expect(lesson.creativePrompt.length).toBeGreaterThan(35);
      expect(lesson.sourceNote).toMatch(/ليس|لا /u);
      expect(lesson.questions).toHaveLength(3);
      const ids = new Set();
      for (const question of lesson.questions) {
        expect(ids.has(question.id)).toBe(false);
        ids.add(question.id);
        expect(question.choices).toHaveLength(3);
        expect(question.correctIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctIndex).toBeLessThan(3);
        expect(question.why.length).toBeGreaterThan(35);
        expect(question.hint.length).toBeGreaterThan(20);
        expect(question.prompt.length).toBeGreaterThan(30);
      }
    }
  });

  it("keeps each pilot supplemental, never claims ministry authorization", () => {
    for (const lesson of originalBahrainPilots) {
      expect(lesson.sourceNote).not.toContain("معتمد من الوزارة");
      expect(lesson.introduction.length).toBeGreaterThan(40);
    }
  });
});
