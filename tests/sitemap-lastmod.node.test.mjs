import test from "node:test";
import assert from "node:assert/strict";
import { safeSitemapLastModified } from "../lib/seo/sitemap-lastmod.ts";

test("retains real ISO timestamp with timezone", () => {
  assert.equal(safeSitemapLastModified("2026-11-10T05:01:00+00:00")?.toISOString(), "2026-11-10T05:01:00.000Z");
  assert.equal(safeSitemapLastModified("2026-11-10T08:01:00+03:00")?.toISOString(), "2026-11-10T05:01:00.000Z");
});
test("keeps valid date-only timestamp", () => {
  assert.equal(safeSitemapLastModified("2026-11-09")?.toISOString(), "2026-11-09T00:00:00.000Z");
});
test("never creates lastmod from missing or malformed values", () => {
  for (const value of [null, undefined, "", "n/a", "tomorrow", 1234, "2026/11/10", "2026-02-30", "2025-02-29", "2026-13-01", "2026-01-00", "2026-11-10T99:00:00Z"]) {
    assert.equal(safeSitemapLastModified(value), undefined, String(value));
  }
});
test("accepts leap-day calendar date without inventing a date", () => {
  assert.equal(safeSitemapLastModified("2028-02-29")?.toISOString(), "2028-02-29T00:00:00.000Z");
});
