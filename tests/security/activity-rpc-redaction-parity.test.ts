import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const typescriptProjection = read(
  "features/lesson-activities/services/public-lesson-activities.ts"
);
const sqlCandidate = read("scripts/security/proposed-public-lesson-activity-rpc.sql");
const appliedSql = read(
  "supabase/migrations/20261022195032_sanitize_public_get_lesson_page_bundle_answer_keys.sql"
);

function keysFrom(text: string, start: string, end: string): string[] {
  const first = text.indexOf(start);
  if (first < 0) throw new Error("Missing privacy field allowlist beginning: " + start);
  const last = text.indexOf(end, first + start.length);
  if (last < 0) throw new Error("Missing privacy field allowlist end: " + end);
  const body = text.slice(first + start.length, last);
  return Array.from(body.matchAll(/["']([a-z]+)["']/g), x => x[1]);
}

describe("public lesson redaction stays consistent at application and SQL RPC boundaries", () => {
  it("keeps the JSONB SQL and TypeScript hidden-key vocabularies exactly aligned", () => {
    const ts = keysFrom(typescriptProjection, "const privateFields = new Set([", "]);");
    const sql = keysFrom(sqlCandidate, "IF normalized = ANY (ARRAY[", "]) THEN");
    expect(ts.length).toBeGreaterThan(20);
    expect(new Set(ts).size).toBe(ts.length);
    expect(new Set(sql).size).toBe(sql.length);
    expect([...ts].sort()).toEqual([...sql].sort());
  });

  it("preserves the invoker boundary and published visibility in the SQL candidate", () => {
    expect(sqlCandidate).toContain("SECURITY INVOKER");
    expect(sqlCandidate).not.toMatch(/SECURITY DEFINER/);
    expect(sqlCandidate).toContain("v_uid uuid := auth.uid()");
    expect(sqlCandidate).toContain("l.status = 'published'");
    expect(sqlCandidate).toContain("a.is_published = true");
    expect(sqlCandidate).toContain("public.dadyoom_public_activity_content(a.content)");
    expect(sqlCandidate).toContain("from public.dadyoom_student_questions q");
    expect(sqlCandidate).not.toMatch(/'correct_answer'\s*,\s*q\./);
  });

  it("does not silently modify the already applied production migration", () => {
    expect(appliedSql).toContain("'content', a.content,");
    expect(appliedSql).not.toContain("dadyoom_public_activity_content");
    expect(sqlCandidate).toContain("PROPOSAL ONLY");
    expect(sqlCandidate).toContain("'content', public.dadyoom_public_activity_content(a.content),");
  });
});
