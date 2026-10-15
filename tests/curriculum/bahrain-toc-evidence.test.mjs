import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = p => readFileSync(p,"utf8");
const action = read("app/admin/curriculum/coverage/toc-review/actions.ts");
const page = read("app/admin/curriculum/coverage/toc-review/page.tsx");
const sql = read("supabase/migrations/20261015195000_private_curriculum_toc_evidence.sql");
const audit = JSON.parse(read("data/curriculum-completeness/bahrain-book-completeness-2026-2027.json"));

describe("Bahrain official textbook TOC evidence intake",()=>{
 it("covers all 56 audited scopes with an admin-only form",()=>{
  expect(audit.books).toHaveLength(56);
  expect(page).toContain("bookTocScopeKey(book)");
  expect(page).toContain("getDashboardRequestViewer");
  expect(action).toContain('profile?.role?.trim().toLowerCase() !== "admin"');
  expect(action).toContain("allowedScopes.has(scope_key)");
 });
 it("requires official HTTPS URL and human-provided actual TOC, never approves lessons",()=>{
  expect(action).toContain('url.protocol !== "https:"');
  expect(action).toContain('host === "edunet.bh"');
  expect(action).toContain('host === "moe.gov.bh"');
  expect(action).toContain('review_state: "submitted_for_review"');
  for (const mutation of ['.from("lessons").update(','.from("lessons").upsert(','COMPLETE_BOOK"']) {
    expect(action).not.toContain(mutation);
  }
  expect(page).toContain("لا يُعتمد أي كتاب مكتملًا ولا يُنشر أي درس");
 });
 it("blocks direct client reads/writes of review evidence",()=>{
  expect(sql).toContain("enable row level security");
  expect(sql).toContain("revoke all on table public.curriculum_toc_evidence from public, anon, authenticated");
  expect(sql).toContain("grant select, insert, update on table public.curriculum_toc_evidence to service_role");
  expect(page).toContain('data-toc-evidence-state={failed ? "error" : "ready"}');
 });
});
