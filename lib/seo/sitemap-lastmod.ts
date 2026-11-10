/**
 * Guard timestamp values before writing <lastmod> into sitemap XML.
 * Missing, malformed or impossible calendar dates should omit lastmod,
 * rather than fabricate recency or make the sitemap fail to serialize.
 */
export function safeSitemapLastModified(value: unknown): Date | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:(?:T| )\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)?)?$/i.exec(text);
  if (!match) return undefined;
  const [, year, month, day] = match;
  const isoDay = `${year}-${month}-${day}`;
  const utcDay = new Date(`${isoDay}T00:00:00.000Z`);
  if (!Number.isFinite(utcDay.valueOf()) || utcDay.toISOString().slice(0, 10) !== isoDay) return undefined;
  const date = new Date(text);
  if (!Number.isFinite(date.valueOf())) return undefined;
  return date;
}
