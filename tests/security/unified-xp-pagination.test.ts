import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => {
    throw new Error("Unexpected session Supabase client in injected-client test");
  }),
}));

import { getUnifiedGamificationXP } from "../../features/student-progress/services/unified-gamification";

type XPRow = { id: string; xp?: number; bonus_xp?: number; bonus_awarded?: boolean; student_id?: string; user_id?: string };
type Data = Record<string, XPRow[]>;
const owner = "11111111-1111-4111-8111-111111111111";
const stranger = "22222222-2222-4222-8222-222222222222";
const ids = (n: number) => String(n).padStart(7, "0");

function fakeXPDatabase(
  values: Data,
  options: { capped?: number; missing?: string[]; permissionError?: string; countDrift?: string } = {},
) {
  const calls: Array<{
    table: string; selection: string; exactCount: boolean;
    filters: Record<string, unknown>; orderedBy: string; offset: number; length: number;
  }> = [];
  const from = vi.fn((table: string) => {
    const filters: Record<string, unknown> = {};
    let selection = "";
    let exactCount = false;
    let orderedBy = "";
    const q = {
      select(fields: string, opts?: { count?: string }) {
        selection = fields;
        exactCount = opts?.count === "exact";
        return q;
      },
      eq(key: string, value: unknown) {
        filters[key] = value;
        return q;
      },
      order(key: string) {
        orderedBy = key;
        return q;
      },
      async range(offset: number, end: number) {
        const call = { table, selection, exactCount, filters: { ...filters },
          orderedBy, offset, length: end - offset + 1 };
        calls.push(call);
        if (options.missing?.includes(table))
          return { data: null, count: null, error: { code: "42P01", message: "relation does not exist" } };
        if (options.permissionError === table)
          return { data: null, count: null, error: { code: "42501", message: "permission denied" } };
        const filtered = (values[table] ?? []).filter(row =>
          Object.entries(filters).every(([k, v]) => (row as unknown as Record<string, unknown>)[k] === v)
        ).sort((a, b) => a.id.localeCompare(b.id));
        const cap = Math.min(end - offset + 1, options.capped ?? 1000);
        return {
          data: filtered.slice(offset, offset + cap),
          count: options.countDrift === table && offset > 0
            ? filtered.length + 1 : filtered.length,
          error: null,
        };
      },
    };
    return q;
  });
  return { db: { from } as unknown as SupabaseClient, calls, from };
}

function rows(n: number, key: "student_id" | "user_id", xpKey: "xp" | "bonus_xp", value: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: ids(i + 1),
    [key]: owner,
    [xpKey]: value,
    ...(xpKey === "bonus_xp" ? { bonus_awarded: true } : {}),
  })) as XPRow[];
}

describe("unified gamification reads every owner-visible XP record", () => {
  it("totals over 5,000 verified rows despite a 73-row PostgREST response cap", async () => {
    const lesson = rows(2505, "student_id", "xp", 2);
    const skill = rows(1701, "user_id", "xp", 3);
    const challenge = rows(1501, "user_id", "bonus_xp", 5);
    const fixture = fakeXPDatabase({
      student_lesson_progress: [...lesson, { id: "9999999", student_id: stranger, xp: 9999 }],
      student_skill_progress: [...skill, { id: "9999999", user_id: stranger, xp: 9999 }],
      student_daily_challenges: [...challenge, { id: "9999998", user_id: owner, bonus_xp: 9999, bonus_awarded: false }],
    }, { capped: 73 });
    const result = await getUnifiedGamificationXP(owner, fixture.db);
    expect(result).toEqual({
      lessonXP: 5010,
      skillXP: 5103,
      dailyChallengeXP: 7505,
      totalXP: 17618,
    });
    for (const table of [
      "student_lesson_progress", "student_skill_progress", "student_daily_challenges"
    ]) {
      const calls = fixture.calls.filter(c => c.table === table);
      expect(calls.length).toBeGreaterThan(20);
      expect(calls[0].offset).toBe(0);
      expect(calls[1].offset).toBe(73);
      expect(calls.every(c => c.exactCount && c.orderedBy === "id")).toBe(true);
      const ownerColumn = table === "student_lesson_progress" ? "student_id" : "user_id";
      expect(calls.every(c => c.filters[ownerColumn] === owner)).toBe(true);
      expect(calls.every(c => c.selection.startsWith("id,"))).toBe(true);
    }
    expect(fixture.calls.filter(c => c.table === "student_daily_challenges")
      .every(c => c.filters.bonus_awarded === true)).toBe(true);
  });

  it("keeps optional missing legacy tables compatible, without hiding forbidden reads", async () => {
    const values = { student_lesson_progress: rows(3, "student_id", "xp", 10) };
    const missing = fakeXPDatabase(values, {
      missing: ["student_skill_progress", "student_daily_challenges"],
    });
    expect(await getUnifiedGamificationXP(owner, missing.db))
      .toEqual({ lessonXP: 30, skillXP: 0, dailyChallengeXP: 0, totalXP: 30 });

    const denied = fakeXPDatabase(values, { permissionError: "student_skill_progress" });
    await expect(getUnifiedGamificationXP(owner, denied.db))
      .rejects.toThrow("تعذر تحميل بيانات التقويم كاملة");
  });

  it("rejects a changing total rather than understating earned XP", async () => {
    const fixture = fakeXPDatabase({
      student_lesson_progress: rows(205, "student_id", "xp", 7),
      student_skill_progress: [],
      student_daily_challenges: [],
    }, { capped: 73, countDrift: "student_lesson_progress" });
    await expect(getUnifiedGamificationXP(owner, fixture.db))
      .rejects.toThrow("تغير عدد بيانات التقويم");
  });
});
