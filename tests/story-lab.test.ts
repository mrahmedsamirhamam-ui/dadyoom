import { describe, expect, it } from "vitest";
import { describeStoryPractice, evaluateStoryChoice } from "@/lib/story-lab/evaluation";
import { getLearningStory, LEARNING_STORIES } from "@/lib/story-lab/stories";

describe("Dadyoom original interactive story lab", () => {
  it("has three complete independent enrichment lessons with scene text and questions", () => {
    expect(LEARNING_STORIES).toHaveLength(3);
    expect(new Set(LEARNING_STORIES.map((story) => story.slug)).size).toBe(3);
    for (const story of LEARNING_STORIES) {
      expect(story.scenes.length).toBeGreaterThanOrEqual(4);
      expect(story.questions.length).toBeGreaterThanOrEqual(4);
      expect(story.rule.length).toBeGreaterThan(35);
      expect(story.goal.length).toBeGreaterThan(12);
      for (const scene of story.scenes) {
        expect(scene.line.trim()).not.toBe("");
        expect(scene.focus.trim()).not.toBe("");
      }
    }
  });

  it("all graded items have exactly one valid key and a constructive written explanation", () => {
    for (const story of LEARNING_STORIES) {
      for (const question of story.questions) {
        expect(question.choices.length).toBeGreaterThanOrEqual(3);
        expect(new Set(question.choices).size).toBe(question.choices.length);
        expect(Number.isInteger(question.correctIndex)).toBe(true);
        expect(question.correctIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctIndex).toBeLessThan(question.choices.length);
        expect(question.hint.length).toBeGreaterThan(8);
        expect(question.explanation.length).toBeGreaterThan(12);
        for (let i = 0; i < question.choices.length; i++) {
          const result = evaluateStoryChoice(question, i);
          expect(result.correct).toBe(i === question.correctIndex);
          expect(result.feedback).toBe(i === question.correctIndex ? question.explanation : question.hint);
        }
        expect(evaluateStoryChoice(question, -1).correct).toBe(false);
        expect(evaluateStoryChoice(question, question.choices.length).correct).toBe(false);
        expect(evaluateStoryChoice(question, 1.5).correct).toBe(false);
      }
    }
  });

  it("keeps the four classical final-hamza cases distinct", () => {
    const story = getLearningStory("final-hamza");
    expect(story).toBeDefined();
    const correct = story!.questions.map((q) => q.choices[q.correctIndex]);
    expect(correct).toEqual(["شاطِئ", "تباطُؤ", "ملجَأ", "دفْء"]);
    expect(getLearningStory("unknown")).toBeUndefined();
  });

  it("describes first-attempt practice but never issues an academic grade", () => {
    expect(describeStoryPractice(4, 4)).toContain("المحاولة الأولى");
    expect(describeStoryPractice(2, 4)).toContain("تقدم");
    expect(describeStoryPractice(1, 4)).toContain("واصل");
    expect(describeStoryPractice(0, 0)).toContain("ابدأ");
  });
});
