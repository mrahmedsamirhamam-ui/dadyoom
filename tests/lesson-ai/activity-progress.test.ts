import { describe, expect, it } from "vitest";
import { activityProgressState } from "@/lib/lesson-activities/progress-state";

describe("activity retries preserve canonical lesson completion", () => {
  it("does not undo a completed lesson", () => {
    expect(activityProgressState("completed", 40)).toEqual({
      status: "completed",
      progressPercent: 100,
    });
  });

  it("does not undo mastery on a wrong retry", () => {
    expect(activityProgressState("mastered", 0)).toEqual({
      status: "mastered",
      progressPercent: 100,
    });
  });

  it("keeps unfinished lessons in progress", () => {
    expect(activityProgressState("in_progress", 67)).toEqual({
      status: "in_progress",
      progressPercent: 67,
    });
    expect(activityProgressState(null, 0)).toEqual({
      status: "in_progress",
      progressPercent: 0,
    });
  });

  it("constrains activity completion percentages", () => {
    expect(activityProgressState("in_progress", -5).progressPercent).toBe(0);
    expect(activityProgressState("in_progress", 125).progressPercent).toBe(100);
  });
});
