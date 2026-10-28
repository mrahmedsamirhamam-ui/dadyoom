import { describe, expect, it } from "vitest";
import {
  commitActivityProgressWithRetry,
  type ActivityProgressRow,
  type ActivityProgressUpdate,
} from "../../lib/lesson-activities/progress-state";

type Stored = ActivityProgressRow & { xp: number };

function inMemoryStore(initial: Stored | null) {
  let row: Stored | null = initial ? { ...initial } : null;
  let misses = 0;
  const read = async () => row ? { ...row } : null;
  const insert = async (value: ActivityProgressUpdate) => {
    if (row) {
      misses++;
      return false;
    }
    row = { id: "progress-id", xp: 0, ...value };
    return true;
  };
  const update = async (previous: ActivityProgressRow, value: ActivityProgressUpdate) => {
    if (!row ||
      row.id !== previous.id ||
      row.status !== previous.status ||
      row.attempts !== previous.attempts ||
      row.best_score > value.best_score ||
      row.progress_percent > value.progress_percent) {
      misses++;
      return false;
    }
    row = { ...row, ...value };
    return true;
  };
  return { read, insert, update, get row() { return row; }, get misses() { return misses; } };
}

function progress(overrides: Partial<Stored> = {}): Stored {
  return {
    id: "progress-id",
    status: "in_progress",
    attempts: 4,
    best_score: 80,
    progress_percent: 55,
    xp: 0,
    ...overrides,
  };
}

describe("real retryable activity progress CAS", () => {
  it("counts two simultaneous updates and preserves the higher best score", async () => {
    const store = inMemoryStore(progress());
    // Both requests intentionally start from the same stale read.
    const initial = await store.read();
    const args = { initial, read: store.read, update: store.update, insert: store.insert };
    await Promise.all([
      commitActivityProgressWithRetry({ ...args, score: 96, activityPercent: 95 }),
      commitActivityProgressWithRetry({ ...args, score: 90, activityPercent: 75 }),
    ]);

    expect(store.row).toMatchObject({
      attempts: 6, best_score: 96, progress_percent: 95,
      status: "in_progress", xp: 0,
    });
    expect(store.misses).toBe(1);
  });

  it("recovers from an initial insert race without overwriting the first row", async () => {
    const store = inMemoryStore(null);
    const args = { initial: null, read: store.read, update: store.update, insert: store.insert };
    await Promise.all([
      commitActivityProgressWithRetry({ ...args, score: 76, activityPercent: 55 }),
      commitActivityProgressWithRetry({ ...args, score: 91, activityPercent: 90 }),
    ]);
    expect(store.row).toMatchObject({
      attempts: 2, best_score: 91, progress_percent: 90,
      status: "in_progress", xp: 0,
    });
    expect(store.misses).toBe(1);
  });

  it("cannot downgrade a lesson completed between read and save", async () => {
    const store = inMemoryStore(progress({ status: "mastered", attempts: 6,
      best_score: 98, progress_percent: 100, xp: 30 }));
    const stale = progress({ attempts: 5, best_score: 85, progress_percent: 70 });
    await commitActivityProgressWithRetry({
      initial: stale, score: 91, activityPercent: 70,
      insert: store.insert, update: store.update, read: store.read,
    });
    expect(store.row).toMatchObject({
      status: "mastered", attempts: 7, best_score: 98, progress_percent: 100, xp: 30,
    });
    expect(store.misses).toBe(1);
  });

  it("treats every unsuccessful CAS as a conflict and eventually fails closed", async () => {
    const store = inMemoryStore(progress());
    let changes = 0;
    await expect(commitActivityProgressWithRetry({
      initial: await store.read(), score: 95, activityPercent: 90,
      insert: store.insert,
      update: async () => { changes++; return false; },
      read: store.read,
      maxAttempts: 3,
    })).rejects.toThrow("تعذر حفظ المحاولة بسبب تحديثات متزامنة");
    expect(changes).toBe(3);
    expect(store.row).toMatchObject({ attempts: 4, best_score: 80 });
  });

  it("does not treat a missing owner-scoped row or invalid grade as a success", async () => {
    const store = inMemoryStore(progress());
    await expect(commitActivityProgressWithRetry({
      initial: await store.read(), score: NaN, activityPercent: 90,
      insert: store.insert, update: store.update, read: store.read,
    })).rejects.toThrow("درجة التقويم غير صالحة");

    await expect(commitActivityProgressWithRetry({
      initial: await store.read(), score: 90, activityPercent: 70,
      insert: store.insert,
      update: async () => false,
      read: async () => null,
    })).rejects.toThrow("تعذر قراءة حالة التقدم");
    expect(store.row).toMatchObject({ attempts: 4, xp: 0 });
  });
});
