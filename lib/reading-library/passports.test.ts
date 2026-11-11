import { describe, expect, it } from "vitest";
import { CHALLENGE_TOTAL, getReadingProgress } from "./passports";

describe("reading passports", () => {
  it("ignores pending, blank and duplicate book entries", () => {
    const result = getReadingProgress([
      { bookId: "a", approved: true },
      { bookId: "a", approved: true },
      { bookId: "b", approved: false },
      { bookId: " ", approved: true },
    ]);
    expect(result.completed).toBe(1);
    expect(result.passports[1].unlocked).toBe(false);
  });
  it.each([0, 1, 9, 10, 11, 19, 20, 29, 30, 39, 40, 49, 50, 60])(
    "enforces passport boundaries at %i distinct approved books", (count) => {
      const result = getReadingProgress(Array.from({ length: count }, (_, i) => ({
        bookId: String(i), approved: true,
      })));
      const expected = Math.min(count, CHALLENGE_TOTAL);
      expect(result.completed).toBe(expected);
      expect(result.passports).toHaveLength(5);
      result.passports.forEach((stage, index) => {
        const start = index * 10;
        const stageCount = Math.max(0, Math.min(10, expected - start));
        expect(stage).toEqual({
          stage: index + 1,
          completed: stageCount,
          target: 10,
          unlocked: index === 0 || expected >= start,
          finished: stageCount === 10,
        });
      });
    },
  );
  it("does not double count a book when pending and approved records coexist", () => {
    expect(getReadingProgress([
      { bookId: "same", approved: false },
      { bookId: "same", approved: true },
      { bookId: "same", approved: true },
    ]).completed).toBe(1);
  });
});
