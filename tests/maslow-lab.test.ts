import { describe, expect, it } from "vitest";
import {
  checkMaslowAnswer,
  findMaslowLevel,
  MASLOW_LEVELS,
  MASLOW_SITUATIONS,
} from "../lib/maslow-lab/content";

describe("Maslow learning lab", () => {
  it("covers the familiar five needs exactly once", () => {
    expect(MASLOW_LEVELS).toHaveLength(5);
    expect(new Set(MASLOW_LEVELS.map((need) => need.id)).size).toBe(5);
  });

  it("every scenario has a valid level and substantive feedback", () => {
    for (const item of MASLOW_SITUATIONS) {
      expect(findMaslowLevel(item.correctId).label).toBeTruthy();
      expect(item.explanation.length).toBeGreaterThan(20);
      expect(checkMaslowAnswer(item.id, item.correctId)?.correct).toBe(true);
    }
  });

  it("gives feedback for an incorrect classification without recording grades", () => {
    const item = MASLOW_SITUATIONS[0];
    const alternate = MASLOW_LEVELS.find((need) => need.id !== item.correctId)!;
    expect(checkMaslowAnswer(item.id, alternate.id)?.correct).toBe(false);
    expect(checkMaslowAnswer("does-not-exist", alternate.id)).toBeNull();
  });

  it("includes practical reading and writing prompts in every level", () => {
    for (const level of MASLOW_LEVELS) {
      expect(level.learningContext).toBeTruthy();
      expect(level.writingPrompt).toContain("اكتب");
      expect(level.teacherAction.length).toBeGreaterThan(15);
    }
  });
});
