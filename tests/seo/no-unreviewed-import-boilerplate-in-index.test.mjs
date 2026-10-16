import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const sql = readFileSync("supabase/migrations/20261016160913_exclude_unresolved_ocr_and_boilerplate_from_seo.sql","utf8");
const contract = readFileSync("lib/curriculum/lesson-source-review.ts","utf8");

describe("Real published content without verified textbook titles does not gain SEO certification", () => {
 test("rejects generic imports and unresolved OCR using the same source review markers",()=>{
   expect(contract).toContain('text.startsWith("يتناول هذا الدرس موضوع «")');
   expect(contract).toContain('text.includes("مدخل OCR غير محسوم")');
   expect(sql).toContain("l.content not like 'يتناول هذا الدرس موضوع «%'");
   expect(sql).toContain("l.content not ilike '%مدخل OCR غير محسوم%'");
 });
 test("preserves active publication, lesson scope and canonical stable materialized index",()=>{
   expect(sql).toContain("l.status = 'published'");
   expect(sql).toContain("with (security_invoker = true)");
   expect(sql).toContain("duplicate_content_count = 1");
   expect(sql).toContain("coalesce(l.summary, '') like any");
   expect(sql).toContain("refresh materialized view concurrently public.seo_indexable_lessons_fast;");
   expect(sql).not.toMatch(/\bdelete\s+from\s+(?:public\.)?lessons\b/iu);
   expect(sql).not.toMatch(/\bdrop\s+materialized\s+view\b/iu);
   expect(sql).not.toMatch(/\bupdate\s+(?:public\.)?lessons\b/iu);
 });
});
