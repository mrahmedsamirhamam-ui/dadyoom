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
  it("unlocks the next passport after ten approved distinct books", () => {
    const result = getReadingProgress(Array.from({ length: 10 }, (_, i) => ({ bookId: String(i), approved: true })));
    expect(result.passports[0].finished).toBe(true);
    expect(result.passports[1].unlocked).toBe(true);
  });
  it("caps challenge progress at fifty", () => {
    const result = getReadingProgress(Array.from({ length: 60 }, (_, i) => ({ bookId: String(i), approved: true })));
    expect(result.completed).toBe(CHALLENGE_TOTAL);
    expect(result.passports.every((stage) => stage.finished)).toBe(true);
  });
});
