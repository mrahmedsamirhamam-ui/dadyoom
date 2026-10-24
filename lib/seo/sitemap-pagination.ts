/**
 * Collect every published sitemap row from PostgREST.
 *
 * An API may cap `.range(from, to)` below our requested window size.
 * Therefore advance by the ACTUAL returned row count, not the requested
 * batch size, and only stop after a verified empty page. Otherwise even a
 * successful HTTP 206 could make thousands of lessons disappear.
 *
 * This is bounded to <50k URLs per sitemap (two kinds, 20k each);
 * future growth requires a proper sitemap index/shards, not truncation.
 */
export const SITEMAP_BATCH_SIZE = 1000;
export const SITEMAP_MAX_ROWS_PER_KIND = 20_000;

type PageResult<T> = {
  data: T[] | null;
  error?: { message: string } | null;
};

export async function collectSitemapRows<T>(
  loadPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;

  while (offset <= SITEMAP_MAX_ROWS_PER_KIND) {
    const result = await loadPage(offset, offset + SITEMAP_BATCH_SIZE - 1);

    if (result.error || !Array.isArray(result.data)) {
      throw new Error("SITEMAP_PUBLISHED_PAGE_READ_FAILED");
    }

    // A full count is not a signal of completion. Read one empty page
    // after the last data page to verify that nothing was skipped.
    if (result.data.length === 0) return rows;

    if (offset + result.data.length > SITEMAP_MAX_ROWS_PER_KIND) {
      throw new Error("SITEMAP_INDEX_SHARDING_REQUIRED");
    }

    rows.push(...result.data);
    offset += result.data.length;
  }

  // Even exactly 20k rows need one empty confirmation page.
  throw new Error("SITEMAP_INDEX_SHARDING_REQUIRED");
}
