import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { readCompleteGradingPages } from "../../lib/lesson-activities/read-complete-pages";
import { scoreGradedActivityAttempts } from "../../features/lesson-mastery/services/score-graded-activities";

const source = readFileSync(
  resolve(process.cwd(), "features/student-progress/actions/completeLesson.ts"),
  "utf8",
);

describe("canonical 90% lesson completion uses complete owner-scoped assessment evidence", () => {
  it("fully pages every authoritative activity, question, attempt and XP snapshot", () => {
    expect((source.match(/readCompleteGradingPages\(\{/g) ?? [])).toHaveLength(7);
    expect((source.match(/\.range\(offset, offset \+ limit - 1\)/g) ?? [])).toHaveLength(7);
    expect((source.match(/count: "exact"/g) ?? [])).toHaveLength(7);
    expect((source.match(/\.order\("id", \{ ascending: true \}\)/g) ?? [])).toHaveLength(7);

    for (const table of [
      "lesson_activities",
      "lesson_activity_attempts",
      "dadyoom_student_questions",
      "question_attempts",
      "student_lesson_progress",
    ]) {
      expect(source).toContain('.from("' + table + '")');
    }
    expect((source.match(/\.eq\("student_id", user\.id\)/g) ?? []).length)
      .toBeGreaterThanOrEqual(2);
    expect((source.match(/\.eq\("user_id", user\.id\)/g) ?? []).length)
      .toBeGreaterThanOrEqual(3);
    expect(source).toContain('.eq("is_published", true)');
    expect(source).toContain('.eq("status", "published")');
    expect(source).toContain("requireAssessedItems(questionIds.length)");
    expect(source).toContain("REQUIRED_MASTERY_SCORE = 90");
  });

  it("prevents silent 1000-row truncation from manufacturing a passing activity score", async () => {
    // 1,002 genuine activities: a stale one-page read of 1,000 would
    // misleadingly report 100% while two remain completely unanswered.
    const activities = Array.from({ length: 1002 }, (_, i) => ({
      id: String(i + 1).padStart(8, "0"), points: 1,
    }));
    const attempts = activities.slice(0, 1000).map((item) => ({
      id: item.id,
      activity_id: item.id,
      earned_points: 1,
      is_correct: true,
      attempt_number: 1,
    }));
    const page = async <T extends { id: string }>(values: T[]) =>
      readCompleteGradingPages({
        readPage: async (offset: number, limit: number) => ({
          data: values.slice(offset, offset + Math.min(limit, 83)),
          count: values.length,
          error: null,
        }),
      });

    const scored = scoreGradedActivityAttempts(
      await page(activities),
      await page(attempts),
    );
    expect(scored.answeredQuestions).toBe(1000);
    expect(scored.totalPossible).toBe(1002);
    expect(scored.score).toBeLessThan(100);
    expect(scored.answeredQuestions).toBeLessThan(activities.length);
  });

  it("fails closed when a required activity or XP snapshot changes between pages", async () => {
    let count = 1001;
    await expect(readCompleteGradingPages({
      readPage: async (offset, limit) => {
        if (offset > 0) count = 1002;
        return {
          data: Array.from({ length: Math.min(limit, 1001-offset) }, (_, i) => ({
            id: String(offset+i+1).padStart(6, "0"),
          })),
          count,
          error: null,
        };
      },
    })).rejects.toThrow("تغير عدد بيانات التقويم");
  });
});
