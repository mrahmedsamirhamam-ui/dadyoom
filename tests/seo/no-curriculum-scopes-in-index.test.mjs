import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync("supabase/migrations/20261016153314_exclude_curriculum_scope_records_from_seo_index.sql", "utf8");
const source = readFileSync("lib/curriculum/lesson-content-kind.ts", "utf8");

describe("SEO indexability excludes national curriculum scopes, not actual lessons", () => {
  test("preserves secure invoker view, real lesson quality gates and concurrent source refresh", () => {
    for (const content of ["with (security_invoker = true)", "duplicate_content_count = 1",
      "l.status = 'published'", "and not (c.code = 'LY'",
      "coalesce(l.summary, '') like any", "refresh materialized view concurrently public.seo_indexable_lessons_fast"]) {
      expect(migration).toContain(content);
    }
    expect(migration).not.toMatch(/\bdrop\s+(?:materialized\s+)?view\b/iu);
    expect(migration).not.toMatch(/\bdelete\s+from\s+public\.lessons\b/iu);
  });
  test("uses existing curriculum scope classifications and lets genuine originals win", () => {
    for (const heading of ["تمثل هذه العقدة مجال", "تمثل هذه العقدة «",
      "وحدة ضاديوم أصلية لمواءمة مجال", "حزمة وطنية أصلية",
      "حزمة أصلية من ضاديوم لتغطية معايير",
      "درس ضاديوم الأصلي:", "مسار القراءة والفهم الأصلي — ضاديوم"]) {
      expect(source).toContain(heading);
      expect(migration).toContain(heading);
    }
    expect(migration).toContain("and not (l.content like any");
  });
});
