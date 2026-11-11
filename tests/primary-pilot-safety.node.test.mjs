import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=(p)=>readFileSync(p,"utf8");
const route=read("app/api/admin/curriculum/primary-pilot/route.ts");
const server=read("lib/curriculum-review/primary-pilot-server.ts");
const sql=read("docs/sql/dadyoom-cm1-primary-pilot-staging.sql");
const ui=read("app/admin/curriculum/primary-pilot/PrimaryPilotBoard.tsx");

test("pilot route requires verified reviewer and request origin",()=>{
  assert.match(route,/getVerifiedLessonReviewer\(\)/);
  assert.match(route,/origin!==new URL\(request\.url\)\.origin/);
  assert.match(route,/reportHash!==reportHash/);
  assert.match(route,/ACTION_FOR_LANE\[row\.lane\]!==action/);
});
test("server can only write separate staging project in local preview",()=>{
  assert.match(server,/NODE_ENV === "production"/);
  assert.match(server,/DADYOOM_CM1_STAGING_WRITES_ENABLED/);
  assert.match(server,/stage\.origin === prod\.origin/);
  assert.match(server,/DADYOOM_CM1_STAGING_PROJECT_REF/);
  assert.doesNotMatch(route,/createAdminClient/);
  assert.doesNotMatch(route,/\.from\("lessons"\)\.update/);
});
test("database function enforces official source, runtime and human review",()=>{
  assert.match(sql,/CM1_OFFICIAL_SOURCE_EVIDENCE_MISSING/);
  assert.match(sql,/CM1_CONTENT_EVIDENCE_MISSING/);
  assert.match(sql,/CM1_RUNTIME_EVIDENCE_MISSING/);
  assert.match(sql,/CM1_INDEPENDENT_REVIEW_MISSING/);
  assert.match(sql,/CM1_SIX_QUALITY_AXES_REQUIRED/);
  assert.match(sql,/grade_number IN \(1,2,3\)/);
  assert.match(sql,/c\.code='BH'/);
  assert.match(sql,/FOR UPDATE OF l/);
  assert.match(sql,/SECURITY INVOKER/);
  assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
  assert.match(sql,/FROM PUBLIC, anon, authenticated/);
  assert.match(sql,/REVOKE ALL ON FUNCTION/);
  assert.doesNotMatch(sql,/^\s*UPDATE\s+public\.lessons/mi);
  assert.doesNotMatch(sql,/^\s*DELETE\s+FROM\s+public\.lessons/mi);
});
test("private decision keeps VERIFIED separate from publication status",()=>{
  assert.match(sql,/dadyoom_cm1_primary_decisions/);
  assert.match(sql,/official_syllabus_match/);
  assert.match(sql,/dadyoom_cm1_primary_events/);
  assert.match(route,/public.*lesson.*unchanged|lessons\.status/);
});
test("UI shows all four evidence keys and requires direct click",()=>{
  assert.match(ui,/PROOF_NAMES/);
  assert.match(ui,/proofKeys/);
  assert.match(ui,/window\.confirm/);
  assert.match(ui,/approve_official/);
  assert.match(ui,/mark_enrichment/);
  assert.match(ui,/keep_draft/);
});
