import { test } from "vitest";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

test("book-reference placeholders are excluded from SEO view without excluding real lessons in the same book units", () => {
  const sql = readFileSync("data/curriculum-completeness/seo-exclude-libya-book-reference-nodes-20261009.sql","utf8");
  assert.ok(sql.includes("WITH (security_invoker = true)"));
  assert.ok(sql.includes("l.title LIKE '%تغطية كتابية تكاملية%'"));
  assert.ok(sql.includes("c.code = 'LY'"));
  assert.ok(sql.includes("SELECT count(*) INTO n"));
  assert.ok(!sql.includes("u.title LIKE '%كتاب%'"));
});
