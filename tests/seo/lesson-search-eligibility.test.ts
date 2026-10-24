import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isLessonSearchEligible } from "@/lib/seo/lesson-search-eligibility";

const uuid = "11111111-1111-4111-8111-111111111111";
function stubLookup(
  result: { data: { id: string } | null; error: { message: string } | null },
) {
  const calls: string[] = [];
  const db = {
    from(table: string) {
      calls.push("from:" + table);
      return {
        select(columns: string) {
          calls.push("select:" + columns);
          return {
            eq(column: string, value: string) {
              calls.push(`eq:${column}:${value}`);
              return {
                maybeSingle: async () => result,
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  return { db, calls };
}

afterEach(() => vi.restoreAllMocks());

describe("server-side published lesson search eligibility", () => {
  it("enables indexing only for exact matching rows in the curated view", async () => {
    const { db, calls } = stubLookup({ data: { id: uuid }, error: null });
    expect(await isLessonSearchEligible(db, uuid)).toBe(true);
    expect(calls).toEqual([
      "from:seo_indexable_lessons", "select:id", `eq:id:${uuid}`,
    ]);
  });

  it("does not index published but unqualified lesson content", async () => {
    const { db } = stubLookup({ data: null, error: null });
    expect(await isLessonSearchEligible(db, uuid)).toBe(false);
  });

  it("does not trust a row with a different ID", async () => {
    const { db } = stubLookup({ data: { id: "foreign-lesson" }, error: null });
    expect(await isLessonSearchEligible(db, uuid)).toBe(false);
  });

  it("fails closed without leaking database details to students or crawlers", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { db } = stubLookup({
      data: null, error: { message: "private key is unavailable" },
    });
    expect(await isLessonSearchEligible(db, uuid)).toBe(false);
    expect(log).toHaveBeenCalledWith("SEO_LESSON_ELIGIBILITY_READ_UNAVAILABLE");
    expect(log).not.toHaveBeenCalledWith("private key is unavailable");
  });

  it("does not query the database for an empty lesson ID", async () => {
    const { db, calls } = stubLookup({ data: { id: "" }, error: null });
    expect(await isLessonSearchEligible(db, "   ")).toBe(false);
    expect(calls).toHaveLength(0);
  });
});
