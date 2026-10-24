import { describe, expect, it, vi } from "vitest";
import {
  readCompleteContentTable,
  CONTENT_BACKUP_BATCH_SIZE,
} from "@/lib/curriculum-packs/content-backup.mjs";

describe("curriculum importer safe content snapshot", () => {
  it("backs up every one of 32,543 questions, not just PostgREST's first page", async () => {
    const records = Array.from({ length: 32543 }, (_, n) => ({ id: n + 1 }));
    const query = vi.fn(async (from: number, to: number) => ({
      data: records.slice(from, to + 1), error: null,
    }));
    const rows = await readCompleteContentTable(query);
    expect(rows).toHaveLength(32543);
    expect(rows[0].id).toBe(1);
    expect(rows.at(-1).id).toBe(32543);
    expect(query).toHaveBeenCalledTimes(34);
    expect(query).toHaveBeenLastCalledWith(32543, 33542);
    expect(CONTENT_BACKUP_BATCH_SIZE).toBe(1000);
  });

  it("handles provider-imposed 300-row caps without omitting records", async () => {
    const records = Array.from({ length: 2101 }, (_, id) => ({ id: `row-${id}` }));
    const query = vi.fn(async (from: number, to: number) => ({
      data: records.slice(from, Math.min(to + 1, from + 300)), error: null,
    }));
    expect(await readCompleteContentTable(query)).toEqual(records);
    expect(query).toHaveBeenCalledTimes(9);
    expect(query).toHaveBeenLastCalledWith(2101, 3100);
  });

  it("throws before any snapshot can be written if a later page fails", async () => {
    const query = vi.fn(async (from: number) => from === 0
      ? { data: [{ id: 1 }, { id: 2 }], error: null }
      : { data: null, error: { message: "private backend error" } });
    await expect(readCompleteContentTable(query, { batchSize: 2 }))
      .rejects.toThrow("CURRICULUM_BACKUP_PAGE_READ_FAILED");
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("rejects duplicate identifiers and an unexpectedly oversized response", async () => {
    await expect(readCompleteContentTable(async () => ({
      data: [{ id: 1 }, { id: 1 }], error: null,
    }))).rejects.toThrow("CURRICULUM_BACKUP_DUPLICATE_ROW_ID");
    await expect(readCompleteContentTable(async () => ({
      data: [{ id: 1 }, { id: 2 }], error: null,
    }), { batchSize: 1 })).rejects.toThrow("CURRICULUM_BACKUP_UNEXPECTED_BATCH_SIZE");
  });

  it("requires an empty terminal read at an exact configured upper bound", async () => {
    const query = vi.fn(async (from: number, to: number) => ({
      data: Array.from({ length: Math.max(0, Math.min(4, to + 1) - from) },
        (_, index) => ({ id: from + index })), error: null,
    }));
    expect(await readCompleteContentTable(query, { batchSize: 2, maxRows: 4 }))
      .toHaveLength(4);
    expect(query).toHaveBeenCalledTimes(3);
  });

  it("fails instead of silently truncating tables larger than its safety limit", async () => {
    await expect(readCompleteContentTable(async (from: number) => ({
      data: [{ id: from }], error: null,
    }), { batchSize: 1, maxRows: 2 }))
      .rejects.toThrow("CURRICULUM_BACKUP_REQUIRES_LARGER_LIMIT");
  });
});
