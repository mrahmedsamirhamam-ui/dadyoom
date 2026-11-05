import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { buildActivityProgressPatch } from "@/lib/lesson-progress/activity-progress";

const now = "2026-11-05T20:00:00.000Z";

describe("lesson progress remains complete after practice", () => {
  it.each(["completed", "mastered"])("never downgrades a %s lesson on a wrong retry", (status) => {
    const patch = buildActivityProgressPatch(
      { status, progress_percent: 100, best_score: 95, attempts: 4 },
      20,
      10,
      now,
    );

    expect(patch.status).toBe(status);
    expect(patch.progress_percent).toBe(100);
    expect(patch.best_score).toBe(95);
    expect(patch.last_score).toBe(10);
    expect(patch.attempts).toBe(5);
  });

  it("allows normal incomplete lessons to improve without inventing completion", () => {
    const patch = buildActivityProgressPatch(
      { status: "in_progress", progress_percent: 25, best_score: 30, attempts: 2 },
      50,
      45,
      now,
    );
    expect(patch.status).toBe("in_progress");
    expect(patch.progress_percent).toBe(50);
    expect(patch.best_score).toBe(45);
    expect(patch.attempts).toBe(3);
  });

  it("keeps the first scored activity incomplete until the server completion gate", () => {
    const patch = buildActivityProgressPatch(null, 100, 100, now);
    expect(patch.status).toBe("in_progress");
    expect(patch.progress_percent).toBe(100);
    expect(patch.best_score).toBe(100);
    expect(patch.attempts).toBe(1);
  });

  it("clamps malformed practice values but never awards mastery", () => {
    const patch = buildActivityProgressPatch(null, 120, -50, now);
    expect(patch.status).toBe("in_progress");
    expect(patch.progress_percent).toBe(100);
    expect(patch.best_score).toBe(0);
  });

  it("keeps a concurrent server completion safe from stale activity writes", () => {
    const src = readFileSync(resolve(process.cwd(), "app/api/lesson-activities/check/route.ts"), "utf8");
    expect(src).toContain("buildActivityProgressPatch(");
    expect(src).toMatch(/\.eq\(\s*["']status["']\s*,\s*existingProgress\.status\s*\)/);
    expect(src).not.toContain('status:\n        "in_progress",');
    expect(src).not.toContain("completed_at: null");
  });
});

describe("student should finish AFTER taking the lesson assessments", () => {
  it("shows an assessment shortcut first and completion AFTER interactive activities", () => {
    const src = readFileSync(resolve(process.cwd(), "app/lessons/[id]/page.tsx"), "utf8");
    const shortcut = src.indexOf('href="#lesson-assessment"');
    const assessment = src.indexOf('id="lesson-assessment"');
    const activities = src.indexOf("<InteractiveLessonActivities");
    const completion = src.indexOf("<LearningCompleteLessonButton");
    expect(shortcut).toBeGreaterThan(0);
    expect(assessment).toBeGreaterThan(shortcut);
    expect(activities).toBeGreaterThan(assessment);
    expect(completion).toBeGreaterThan(activities);
    expect(src).toContain('learningProgress.status !== "mastered"');
  });
});
