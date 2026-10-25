import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readCompleteGradingPages } from "../../lib/lesson-activities/read-complete-pages";

type Row = { id: string; activity_id: string; earned_points: number };
const rows: Row[] = Array.from({ length: 2307 }, (_, i) => ({
  id: String(i + 1).padStart(8, "0"),
  activity_id: "synthetic-activity",
  earned_points: i % 6,
}));

describe("lesson activity grading reads with PostgREST caps", () => {
  it("reads every attempt when the API cap is far below the requested page size", async () => {
    const offsets: number[] = [];
    const result = await readCompleteGradingPages({
      pageSize: 200,
      readPage: async (offset, limit) => {
        offsets.push(offset);
        return {
          data: rows.slice(offset, offset + Math.min(limit, 87)),
          count: rows.length,
          error: null,
        };
      },
    });
    expect(result).toEqual(rows);
    expect(result).toHaveLength(2307);
    expect(offsets[0]).toBe(0);
    expect(offsets[1]).toBe(87);
    expect(offsets.at(-1)).toBe(2262);
  });

  it("handles empty curricula without querying later pages", async () => {
    let called = 0;
    const result = await readCompleteGradingPages({
      readPage: async () => {
        called += 1;
        return { data: [], count: 0, error: null };
      },
    });
    expect(result).toEqual([]);
    expect(called).toBe(1);
  });

  it("rejects silently truncated terminal pages", async () => {
    await expect(readCompleteGradingPages({
      readPage: async () => ({ data: [], count: 8, error: null }),
    })).rejects.toThrow("فقدت صفحة");
  });

  it("rejects count drift, duplicates, and unordered pages", async () => {
    let reads = 0;
    await expect(readCompleteGradingPages({
      pageSize: 2,
      readPage: async () => {
        reads++;
        return reads === 1
          ? { data: rows.slice(0, 2), count: 4, error: null }
          : { data: rows.slice(2, 4), count: 5, error: null };
      },
    })).rejects.toThrow("تغير عدد");

    await expect(readCompleteGradingPages({
      pageSize: 2,
      readPage: async () => ({
        data: [rows[1], rows[0]], count: 2, error: null,
      }),
    })).rejects.toThrow("ترتيب");

    await expect(readCompleteGradingPages({
      pageSize: 2,
      readPage: async (offset) => offset === 0
        ? { data: rows.slice(0, 2), count: 3, error: null }
        : { data: [rows[1]], count: 3, error: null },
    })).rejects.toThrow("ترتيب");
  });

  it("rejects missing exact counts, API errors and unbounded collections", async () => {
    await expect(readCompleteGradingPages({
      readPage: async () => ({ data: [], count: null, error: null }),
    })).rejects.toThrow("التحقق من عدد");
    await expect(readCompleteGradingPages({
      readPage: async () => ({ data: null, count: null, error: { message: "permission denied" } }),
    })).rejects.toThrow("تعذر تحميل");
    await expect(readCompleteGradingPages({
      maxRows: 2000,
      readPage: async () => ({ data: [], count: 2307, error: null }),
    })).rejects.toThrow("الحد الآمن");
  });

  it("forces the real grading endpoint to page with exact counts and caller scoping", () => {
    const source = readFileSync(
      resolve(process.cwd(), "app/api/lesson-activities/check/route.ts"), "utf8",
    );
    const activities = source.slice(
      source.indexOf("const allActivities = await readCompleteGradingPages("),
      source.indexOf("const allActivityIds ="),
    );
    const attempts = source.slice(
      source.indexOf("const attempts = await readCompleteGradingPages("),
      source.indexOf("// إنجاز الأنشطة"),
    );
    expect(activities).toContain('.eq("lesson_id", activity.lesson_id)');
    expect(activities).toContain('.eq("is_published", true)');
    expect(activities).toContain('{ count: "exact" }');
    expect(activities).toContain('.order("id", { ascending: true })');
    expect(attempts).toContain('.eq("user_id", user.id)');
    expect(attempts).toContain('.in("activity_id", allActivityIds)');
    expect(attempts).toContain('count: "exact"');
    expect(attempts).toContain('.order("id", { ascending: true })');
    expect(source).toContain('.range(offset, offset + limit - 1)');
    expect(source).toContain('if (!allActivityIds.includes(activityId))');
  });
});
