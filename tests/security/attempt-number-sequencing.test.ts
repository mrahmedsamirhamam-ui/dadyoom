import { describe, expect, it } from "vitest";
import {
  ACTIVITY_ATTEMPT_NUMBER_CONSTRAINT,
  insertSequencedActivityAttempt,
  isAttemptNumberConflict,
} from "../../lib/lesson-activities/attempt-sequencing";

type DbError = { code: string; message: string; constraint?: string };
const duplicate = (): DbError => ({
  code: "23505",
  message: 'duplicate key value violates unique constraint "' +
    ACTIVITY_ATTEMPT_NUMBER_CONSTRAINT + '"',
});

describe("activity attempts with database-enforced unique numbering", () => {
  it("retries two concurrently submitted activities without duplicate numbers", async () => {
    const assigned: number[] = [];
    let conflicts = 0;
    const readLast = async () => Math.max(0, ...assigned);
    const insert = async (number: number) => {
      if (assigned.includes(number)) {
        conflicts++;
        return { error: duplicate() };
      }
      assigned.push(number);
      return { error: null };
    };

    const results = await Promise.all([
      insertSequencedActivityAttempt({ readLast, insert }),
      insertSequencedActivityAttempt({ readLast, insert }),
    ]);
    expect([...results].sort()).toEqual([1, 2]);
    expect(assigned).toHaveLength(2);
    expect(conflicts).toBe(1);
  });

  it("preserves a trusted, existing sequence and only retries its exact constraint", async () => {
    const assigned = [1, 2, 3];
    const readLast = async () => Math.max(...assigned);
    const insert = async (n: number) => {
      if (assigned.includes(n)) return { error: duplicate() };
      assigned.push(n);
      return { error: null };
    };
    expect(await insertSequencedActivityAttempt({ readLast, insert })).toBe(4);
    expect(assigned).toEqual([1, 2, 3, 4]);
    expect(isAttemptNumberConflict({ code: "23505", constraint: ACTIVITY_ATTEMPT_NUMBER_CONSTRAINT }))
      .toBe(true);
    expect(isAttemptNumberConflict({ code: "23505", message: "other_unique_key" }))
      .toBe(false);
    expect(isAttemptNumberConflict({ code: "42501", message: "permission denied" }))
      .toBe(false);
  });

  it("never retries a permission error or unrelated unique-key violation", async () => {
    for (const error of [
      { code: "42501", message: "permission denied" },
      { code: "23505", message: 'duplicate key violates "other_index"' },
    ]) {
      let writes = 0;
      await expect(insertSequencedActivityAttempt({
        readLast: async () => 3,
        insert: async () => { writes++; return { error }; },
      })).rejects.toMatchObject(error);
      expect(writes).toBe(1);
    }
  });

  it("fails closed after bounded attempts and rejects malformed persisted numbering", async () => {
    let writes = 0;
    await expect(insertSequencedActivityAttempt({
      readLast: async () => 7,
      insert: async () => { writes++; return { error: duplicate() }; },
      maxRetries: 3,
    })).rejects.toThrow("تعذر ترقيم محاولة النشاط");
    expect(writes).toBe(3);
    await expect(insertSequencedActivityAttempt({
      readLast: async () => -2, insert: async () => ({ error: null }),
    })).rejects.toThrow("رقم المحاولة المحفوظ غير صالح");
    await expect(insertSequencedActivityAttempt({
      readLast: async () => Number.MAX_SAFE_INTEGER,
      insert: async () => ({ error: null }),
    })).rejects.toThrow("رقم المحاولة المحفوظ غير صالح");
  });
});
