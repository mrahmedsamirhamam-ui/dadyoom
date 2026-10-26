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
  it("detects existing official grade-two titles before import without inspecting children", () => {
    const part18 = audit.slice(audit.indexOf("-- 18. Bahrain grade-two reconciliation"));
    expect(part18).toContain("MULTIPLE_PUBLISHED_RECORDS_REVIEW_DUPLICATES");
    expect(part18).toContain("ONE_TITLE_CANDIDATE_REVIEW_CONTENT");
    expect(part18).toContain("NO_TITLE_CANDIDATE_REVIEW");
    expect(part18).toContain("published_title_candidates");
    expect(part18).toContain("with_three_plus_questions");
    expect(part18).toContain("with_published_activities");
    expect(part18).toContain("g.grade_number=2");
    expect(part18).toContain("l.status='published'");
    expect(part18).toContain("Arabic tatweel and vowel marks MUST be removed");
    expect(part18).not.toContain("question_attempts");
    expect(part18).not.toContain("student_lesson_progress");
    expect(part18).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|DROP|TRUNCATE|GRANT|REVOKE)\s+(?:INTO|ON|FROM|TABLE)\b/i);
  });
  it("audits published Bahrain template-scaffold lessons without altering child progress", () => {
    const published = audit.slice(audit.indexOf("-- 19. Bahrain PUBLISHED scaffold quality queue"));
    expect(published).toContain("published_generic_scaffold_candidates");
    expect(published).toContain("scaffold_with_three_plus_questions");
    expect(published).toContain("scaffold_with_published_activities");
    expect(published).toContain("scaffold_with_source_url_not_proof");
    expect(published).toContain("scaffold_without_official_scope");
    expect(published).toContain("scaffold_with_index_style_title");
    expect(published).toContain("l.status='published'");
    expect(published).toContain("l.content LIKE 'يتناول هذا الدرس موضوع%'");
    expect(published).toContain("No automatic deletion");
    expect(published).not.toMatch(/question_attempts|student_lesson_progress|student_id|correct_answer/i);
    expect(published.replace(/--[^\n]*/g, "")).not.toMatch(
      /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|GRANT|REVOKE|TRUNCATE)\b/i,
    );
  });

  it("reconciles all thirteen Grade-5 reading titles without false misses from duplicated OCR alefs", () => {
    const g5 = audit.slice(
      audit.indexOf("-- 20. Bahrain Grade-5 source-title reconciliation"),
      audit.indexOf("-- 21. Grade-6 Bahrain fourteen reading title candidates"),
    );
    expect(g5).toContain("published_title_candidates");
    expect(g5).toContain("g.grade_number=5");
    expect(g5).toContain("l.status='published'");
    expect(g5).toContain("كنا يدا واحدة");
    expect(g5).toContain("معا في حب وطننا البحرين");
    expect(g5).toContain("'ا+','ا','g'");
    expect(g5).toContain("PDF extracted titles");
    expect(g5).toContain("NOT proof of verified textbook content");
    expect((g5.match(/\(\d+,'/g) || []).length).toBe(13);
    expect(g5).not.toMatch(/student_lesson_progress|question_attempts|correct_answer/);
    expect(g5.replace(/--[^\n]*/g, "")).not.toMatch(
      /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|GRANT|REVOKE|TRUNCATE)\b/i,
    );
  });

  it("reconciles all 14 existing Grade-6 reading titles without misclassifying prefix titles or changing lessons", () => {
    const grade6 = audit.slice(audit.indexOf("-- 21. Grade-6 Bahrain fourteen reading title candidates"));
    expect(grade6).toContain("published_title_candidates");
    expect(grade6).toContain("with_three_plus_questions");
    expect(grade6).toContain("with_published_activities");
    expect(grade6).toContain("with_generic_intro");
    expect(grade6).toContain("MULTIPLE_PUBLISHED_CANDIDATES_REVIEW");
    expect(grade6).toContain("ONE_PUBLISHED_CANDIDATE_REVIEW_TEXT");
    expect(grade6).toContain("REQUIRES_MANUAL_TITLE_REVIEW");
    expect(grade6).toContain("g.grade_number=6");
    expect(grade6).toContain("l.semester=1");
    expect(grade6).toContain("l.status='published'");
    expect(grade6).toContain("r.title LIKE 'أبي:%'");
    expect(grade6).toContain("طريق الخير (1)");
    expect(grade6).toContain("طريق الخير (2)");
    expect(grade6).toContain("NOT certify official text quality");
    expect((grade6.match(/\(\d+,'/g) || []).length).toBe(14);
    expect(grade6).not.toMatch(/student_lesson_progress|question_attempts|correct_answer/i);
    expect(grade6.replace(/--[^\n]*/g, "")).not.toMatch(
      /\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|GRANT|REVOKE|TRUNCATE)\b/i,
    );
  });

  it("remains read only and never extracts personal rows, answers, or keys", () => {
    const plain=audit.replace(/--[^\n]*/g,"").replace(/'(?:''|[^'])*'/g,"''");
    expect(plain).not.toMatch(/\b(?:INSERT|DELETE|UPDATE|REVOKE|GRANT|CREATE|ALTER|DROP|TRUNCATE)\b/i);
    expect(section).not.toContain("question_attempts");
    expect(section).not.toContain("student_lesson_progress");
  });
});
