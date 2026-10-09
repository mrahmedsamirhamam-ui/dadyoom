import { describe, expect, it } from "vitest";
import { stableChoiceOrder } from "../../lib/assessments/stable-choice-order";

const original = [
  { id: "a", text: "correct" },
  { id: "b", text: "distractor one" },
  { id: "c", text: "distractor two" },
] as const;

describe("stableChoiceOrder", () => {
  it("preserves the exact answer IDs, text and database source order", () => {
    const output = stableChoiceOrder(original, "quiz-question-123");
    expect(original.map(x => x.id)).toEqual(["a", "b", "c"]);
    expect(output.map(x => x.id).sort()).toEqual(["a", "b", "c"]);
    expect(output.map(x => x.text).sort()).toEqual(original.map(x => x.text).sort());
    expect(output).not.toBe(original);
  });
  it("is deterministic for hydration, rerender and retries", () => {
    expect(stableChoiceOrder(original, "question-a")).toEqual(stableChoiceOrder(original, "question-a"));
    expect(stableChoiceOrder([], "question-a")).toEqual([]);
  });
  it("does not always show the correct answer in the first position", () => {
    const positions = [0, 0, 0];
    for (let i = 0; i < 120; i += 1) {
      const items = stableChoiceOrder(original, `question-${i}-7c5e`);
      positions[items.findIndex(x => x.id === "a")] += 1;
    }
    expect(positions.every(n => n > 10)).toBe(true);
  });
});
