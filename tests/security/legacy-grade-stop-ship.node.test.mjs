import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = name => readFileSync(new URL("../../" + name, import.meta.url), "utf8");

test("Legacy AI/free-form check cannot grade from client-provided model answers or persist grades", () => {
  const route = read("app/api/assessments/check/route.ts");
  assert.match(route, /SERVER_VERIFIED_ANSWER_KEY_REQUIRED/);
  assert.match(route, /status: 409/);
  assert.match(route, /auth\.getUser\(\)/);
  assert.match(route, /"Cache-Control": "no-store"/);
  for (const forbidden of ["request.json()", "student_assessments", "student_skills", "student_mistakes", ".insert(", ".upsert("]) {
    assert.equal(route.includes(forbidden), false, "forbidden legacy score write path: " + forbidden);
  }
});

test("Staging privilege candidate revokes answer key access and spoofed-attempt writes", () => {
  const sql = read("docs/security/STAGING_ONLY_QUESTION_PRIVILEGES_ISSUE_57.sql");
  assert.match(sql, /REVOKE SELECT ON TABLE public\.questions FROM authenticated;/);
  assert.match(sql, /REVOKE INSERT, UPDATE, DELETE ON TABLE public\.question_attempts/);
  assert.doesNotMatch(sql, /GRANT SELECT\s*\([^)]*correct_answer/);
  assert.match(sql, /STAGING-ONLY/);
});

test("Onboarding never trusts user metadata for elevated roles and keeps stored role immutable", () => {
  const page = read("app/onboarding/page.tsx");
  const form = read("components/auth/ProfileOnboardingForm.tsx");
  assert.match(page, /\.select\("role,country,full_name"\)/);
  assert.match(page, /storedRole/);
  assert.match(page, /profileError/);
  assert.match(page, /selfSignupRoles/);
  assert.match(form, /storedRole \|\| role/);
  assert.match(form, /disabled=\{needsApproval\}/);
  assert.match(form, /لا يمكن تغييره من صفحة استكمال الملف/);
  assert.doesNotMatch(form, /\.from\("profiles"\)/);
});
