import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const audit=readFileSync(resolve(process.cwd(),
  "scripts/curriculum-production-audit.sql"),"utf8");
const section=audit.slice(audit.indexOf("-- 14. Published assessment coverage"));

describe("operational curriculum assessment readiness gate", () => {
  it("counts published activities in addition to conventional questions", () => {
    expect(section).toContain("FROM public.questions");
    expect(section).toContain("FROM public.lesson_activities");
    expect(section).toContain("is_published IS TRUE");
    expect(section).toContain("coalesce(qc.n,0)>0 OR coalesce(ac.n,0)>0");
    expect(section).toContain("missing_stored_assessment");
    expect(section).toContain("published_assessment_coverage_pct");
    expect(section).toContain("l.status='published'");
  });
  it("isolates catalog and short-index placeholders from real lesson readiness", () => {
    expect(section).toContain("bahrain_short_no_question_import_candidates");
    expect(section).toContain("other_country_drafts_to_review");
    expect(section).toContain("published_book_catalog_reference_nodes");
    expect(section).toContain("published_empty_non_catalog_lessons");
    expect(section).toContain("co.code='BH'");
    expect(section).toContain("عقدة تغطية رسمية%");
  });
  it("remains read only and never extracts personal rows, answers, or keys", () => {
    const plain=audit.replace(/--[^\n]*/g,"").replace(/'(?:''|[^'])*'/g,"''");
    expect(plain).not.toMatch(/\b(?:INSERT|DELETE|UPDATE|REVOKE|GRANT|CREATE|ALTER|DROP|TRUNCATE)\b/i);
    expect(section).not.toContain("question_attempts");
    expect(section).not.toContain("student_lesson_progress");
  });
});
