/**
 * Read every eligible published URL row without relying on PostgREST's
 * default row limit or silently losing everything after the first 5,000.
 *
 * The per-kind hard bound keeps a single sitemap under the 50,000-URL XML
 * protocol ceiling (two dynamic kinds, <=20k each, plus static routes).
 * When content grows past that limit, introduce a sitemap index/shards
 * rather than returning a misleading partial sitemap.
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

  for (
    let from = 0;
    from <= SITEMAP_MAX_ROWS_PER_KIND;
    from += SITEMAP_BATCH_SIZE
  ) {
    const result = await loadPage(from, from + SITEMAP_BATCH_SIZE - 1);

    // Fail closed on an interrupted database read: a silently partial
    // sitemap is harder to detect than a static-only fallback.
    if (result.error || !Array.isArray(result.data)) {
      throw new Error("SITEMAP_PUBLISHED_PAGE_READ_FAILED");
    }

    if (from === SITEMAP_MAX_ROWS_PER_KIND && result.data.length > 0) {
      throw new Error("SITEMAP_INDEX_SHARDING_REQUIRED");
    }

    rows.push(...result.data);

    if (result.data.length < SITEMAP_BATCH_SIZE) {
      return rows;
    }
  }

  return rows;
}
