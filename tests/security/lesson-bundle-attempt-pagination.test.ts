import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { readCompleteGradingPages } from "../../lib/lesson-activities/read-complete-pages";

const source = readFileSync(
  resolve(process.cwd(), "features/lessons/queries/getLessonPageBundle.ts"), "utf8",
);

describe("lesson page bundle never hides capped attempt history", () => {
  it("fully paginates more than 1000 attempts even with a 73-row REST limit", async () => {
    const records = Array.from({ length: 2401 }, (_, i) => ({
      id: String(i + 1).padStart(8, "0"),
      activity_id: "lesson-activity",
      is_correct: i % 4 === 0,
      attempt_number: i + 1,
    }));
    const offsets: number[] = [];
    const all = await readCompleteGradingPages({
      readPage: async (offset, limit) => {
        offsets.push(offset);
        return {
          data: records.slice(offset, offset + Math.min(limit, 73)),
          count: records.length,
          error: null,
        };
      },
    });
    expect(all.length).toBe(2401);
    expect(offsets[0]).toBe(0);
    expect(offsets[1]).toBe(73);
    expect(offsets.length).toBeGreaterThan(30);
    const safe = all.map(({ activity_id, is_correct, attempt_number }) => ({
      activity_id, is_correct, attempt_number,
    }));
    expect(safe[2400].attempt_number).toBe(2401);
    expect(JSON.stringify(safe)).not.toContain('"id"');
  });

  it("enforces complete, owner-scoped, ID-ordered reads in all 3 bundle attempt paths", () => {
    expect((source.match(/readCompleteGradingPages\(\{/g) ?? [])).toHaveLength(3);
    expect((source.match(/count: "exact"/g) ?? [])).toHaveLength(3);
    expect((source.match(/\.range\(offset, offset \+ limit - 1\)/g) ?? [])).toHaveLength(3);
    expect((source.match(/\.order\("id", \{ ascending: true \}\)/g) ?? [])).toHaveLength(3);
    expect(source).toContain('.eq("user_id", bundle.student.id)');
    expect((source.match(/\.eq\("user_id", user\.id\)/g) ?? [])).toHaveLength(2);
    expect(source).toMatch(/if\\s*\\(\\s*!bundle\\.student\\s*\\|\\|/);
    expect(source).toContain('canReadBahrainDraftPreview(user.app_metadata, profile?.country)');
    expect(source).toContain('.from("lesson_activity_attempts")');
    expect(source).toContain('.from("question_attempts")');
    expect(source).toContain('activityAttemptsData.map(');
    expect(source).toContain('attemptRows.map(');
    expect(source).not.toContain('activityAttemptsError');
    expect(source).not.toContain('attemptsError');
  });

  it("rejects missing pages rather than showing a false clean activity history", async () => {
    await expect(readCompleteGradingPages({
      readPage: async () => ({ data: [], count: 1001, error: null }),
    })).rejects.toThrow("فقدت صفحة");
  });
});
