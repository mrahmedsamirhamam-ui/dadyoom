import { describe, expect, it, vi } from "vitest";
import {
  collectSitemapRows,
  SITEMAP_BATCH_SIZE,
  SITEMAP_MAX_ROWS_PER_KIND,
} from "@/lib/seo/sitemap-pagination";

describe("public sitemap pagination", () => {
  it("collects all 8,307 published lessons instead of stopping at 5,000", async () => {
    const publishedIds = Array.from({ length: 8307 }, (_, index) => index + 1);
    const page = vi.fn(async (from: number, to: number) => ({
      data: publishedIds.slice(from, to + 1).map((id) => ({ id })),
      error: null,
    }));

    const result = await collectSitemapRows(page);

    expect(result).toHaveLength(8307);
    expect(result[0]?.id).toBe(1);
    expect(result.at(-1)?.id).toBe(8307);
    expect(new Set(result.map((row) => row.id)).size).toBe(8307);
    expect(page).toHaveBeenCalledTimes(10);
    expect(page).toHaveBeenLastCalledWith(8307, 9306);
    expect(SITEMAP_BATCH_SIZE).toBe(1000);
  });

  it("still fetches all rows when PostgREST caps each range at 350", async () => {
    const expected = Array.from({ length: 8307 }, (_, id) => ({ id }));
    const capped = vi.fn(async (from: number, to: number) => ({
      data: expected.slice(from, Math.min(to + 1, from + 350)),
      error: null,
    }));

    const rows = await collectSitemapRows(capped);
    expect(rows).toEqual(expected);
    expect(capped).toHaveBeenCalledTimes(25);
    expect(capped).toHaveBeenLastCalledWith(8307, 9306);
  });

  it("accepts exactly 20,000 rows after an empty terminal page", async () => {
    const page = vi.fn(async (from: number, to: number) => ({
      data: Array.from(
        { length: Math.max(0, Math.min(to + 1, SITEMAP_MAX_ROWS_PER_KIND) - from) },
        (_, id) => ({ id: from + id }),
      ),
      error: null,
    }));

    const rows = await collectSitemapRows(page);
    expect(rows).toHaveLength(SITEMAP_MAX_ROWS_PER_KIND);
    expect(page).toHaveBeenCalledTimes(21);
  });

  it("returns empty rows for a valid empty published collection", async () => {
    await expect(
      collectSitemapRows(async () => ({ data: [], error: null })),
    ).resolves.toEqual([]);
  });

  it("fails instead of returning an incomplete sitemap on database errors", async () => {
    const page = vi.fn(async (from: number) => ({
      data: from === 0 ? [{ id: 1 }] : null,
      error: null,
    }));

    // A full first page is needed to force the failed second request.
    const fullPage = Array.from({ length: SITEMAP_BATCH_SIZE }, (_, id) => ({ id }));
    const failed = vi.fn(async (from: number) => ({
      data: from === 0 ? fullPage : null,
      error: from === 0 ? null : { message: "private backend error" },
    }));

    await expect(collectSitemapRows(failed)).rejects.toThrow(
      "SITEMAP_PUBLISHED_PAGE_READ_FAILED",
    );
    expect(failed).toHaveBeenCalledTimes(2);
    expect(page).not.toHaveBeenCalled();
  });

  it("requires sharding instead of silently truncating beyond the XML safety bound", async () => {
    const page = vi.fn(async (from: number, to: number) => ({
      data: Array.from(
        { length: to - from + 1 },
        (_, offset) => ({ id: from + offset }),
      ),
      error: null,
    }));

    await expect(collectSitemapRows(page)).rejects.toThrow(
      "SITEMAP_INDEX_SHARDING_REQUIRED",
    );
    expect(page).toHaveBeenCalledTimes(
      SITEMAP_MAX_ROWS_PER_KIND / SITEMAP_BATCH_SIZE + 1,
    );
  });
});
