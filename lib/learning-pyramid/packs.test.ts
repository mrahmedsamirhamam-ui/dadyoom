import { describe, expect, it } from "vitest";
import { LEVELS, PYRAMID_PACKS, getPyramidPack } from "./packs";

describe("Dadyoom six-level Arabic mastery pyramid", () => {
  it("defines exactly six unique ordered thinking levels", () => {
    expect(LEVELS.map((item) => item.id)).toEqual([
      "discover", "understand", "apply", "analyze", "evaluate", "create",
    ]);
    expect(new Set(LEVELS.map((item) => item.id)).size).toBe(6);
  });
  it("has at least two complete, independently reusable Arabic packs", () => {
    expect(PYRAMID_PACKS.length).toBeGreaterThanOrEqual(2);
    for (const pack of PYRAMID_PACKS) {
      expect(getPyramidPack(pack.slug)).toBe(pack);
      expect(pack.steps).toHaveLength(6);
      expect(pack.steps.map((step) => step.level)).toEqual(LEVELS.map((level) => level.id));
      for (let index = 0; index < 5; index++) {
        const task = pack.steps[index].task;
        expect(task.kind).toBe("choice");
        if (task.kind !== "choice") continue;
        expect(task.options).toHaveLength(3);
        expect(task.options[task.correctIndex].length).toBeGreaterThan(1);
        expect(task.hint.length).toBeGreaterThan(4);
        expect(task.explanation.length).toBeGreaterThan(8);
      }
      const creative = pack.steps[5].task;
      expect(creative.kind).toBe("creative");
      if (creative.kind === "creative") {
        expect(creative.criteria).toHaveLength(3);
        expect(creative.teacherNote.length).toBeGreaterThan(15);
      }
    }
  });
  it("does not pretend a nonexistent official curriculum pack exists", () => {
    expect(getPyramidPack("not-a-book-lesson")).toBeUndefined();
  });
});
