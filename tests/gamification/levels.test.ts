import { describe, expect, it } from "vitest";
import { getLevelProgress } from "@/services/gamification";

describe("Level Engine", () => {
  it("starts at level 1 with zero XP", () => {
    const level = getLevelProgress(0);

    expect(level.current.level).toBe(1);
    expect(level.progress).toBe(0);
  });

  it("reaches level 2 at 100 XP", () => {
    const level = getLevelProgress(100);

    expect(level.current.level).toBe(2);
  });

  it("returns max level correctly", () => {
    const level = getLevelProgress(100000);

    expect(level.next).toBeNull();
    expect(level.progress).toBe(100);
  });
});
