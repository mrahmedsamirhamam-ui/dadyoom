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
  it("breaks down unpublished drafts without treating records as approved ministry lessons", () => {
    const drafts = section.slice(section.indexOf("-- 16. Unpublished readiness"));
    expect(drafts).toContain("draft_missing_stored_assessment");
    expect(drafts).toContain("draft_with_stored_assessment");
    expect(drafts).toContain("draft_short_content_under_1200");
    expect(drafts).toContain("draft_without_source_url");
    expect(drafts).toContain("draft_without_source_start_page");
    expect(drafts).toContain("draft_without_semester");
    expect(drafts).toContain("draft_without_source_scope");
    expect(drafts).toContain("co.code AS country_code");
    expect(drafts).toContain("g.grade_number");
    expect(drafts).toContain("l.semester");
    expect(drafts).toContain("l.status='draft'");
    expect(drafts).toContain("is_published IS TRUE");
    expect(drafts).not.toMatch(/correct_answer|question_attempts|student_lesson_progress/i);
    expect(drafts).toContain("DO NOT auto-publish");
  });
  it("flags Bahrain imported table headers and generic body scaffolds as unverified", () => {
    const section17 = audit.slice(audit.indexOf("-- 17. Bahrain imported-index quarantine"));
    expect(section17).toContain("draft_index_candidates");
    expect(section17).toContain("generic_scaffold_bodies");
    expect(section17).toContain("extracted_toc_or_header_titles");
    expect(section17).toContain("missing_verifiable_page_provenance");
    expect(section17).toContain("l.status='draft' AND co.code='BH'");
    expect(section17).toContain("Never auto-publish");
    expect(section17).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|GRANT|REVOKE)\s+(?:INTO|ON|FROM|TABLE|public\.)/i);
  });
  it("remains read only and never extracts personal rows, answers, or keys", () => {
    const plain=audit.replace(/--[^\n]*/g,"").replace(/'(?:''|[^'])*'/g,"''");
    expect(plain).not.toMatch(/\b(?:INSERT|DELETE|UPDATE|REVOKE|GRANT|CREATE|ALTER|DROP|TRUNCATE)\b/i);
    expect(section).not.toContain("question_attempts");
    expect(section).not.toContain("student_lesson_progress");
  });
});
