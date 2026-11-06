import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  checkOnboardingRole, NEEDS_ADMIN_APPROVAL, SELF_SIGNUP_ROLES,
} from "../../lib/auth/profile-role-policy.mjs";

const read = path => readFileSync(new URL("../../" + path, import.meta.url), "utf8");

test("All five ordinary/privileged roles are distinguished by server policy", () => {
  assert.deepEqual(SELF_SIGNUP_ROLES, ["student", "child", "parent"]);
  assert.deepEqual(NEEDS_ADMIN_APPROVAL, ["teacher", "school", "admin"]);
  for (const role of SELF_SIGNUP_ROLES) {
    assert.deepEqual(checkOnboardingRole({ requestedRole: role }), { ok: true, role, existing: false });
  }
  for (const role of NEEDS_ADMIN_APPROVAL) {
    assert.deepEqual(checkOnboardingRole({ requestedRole: role }), { ok: false, code: "APPROVAL_REQUIRED" });
  }
});

test("No browser role request can reassign a stored profile; existing admin still completes data", () => {
  for (const stored of ["student", "child", "teacher", "parent", "school", "admin"]) {
    assert.deepEqual(checkOnboardingRole({ storedRole: stored }), { ok: true, role: stored, existing: true });
    for (const attempted of ["student", "child", "teacher", "parent", "school", "admin"]) {
      if (attempted === stored) continue;
      assert.deepEqual(checkOnboardingRole({ storedRole: stored, requestedRole: attempted }), { ok: false, code: "ROLE_CHANGE_FORBIDDEN" });
    }
  }
  assert.equal(checkOnboardingRole({ storedRole: "owner", requestedRole: "admin" }).ok, false);
  assert.equal(checkOnboardingRole({ requestedRole: "root" }).ok, false);
  assert.equal(checkOnboardingRole({ requestedRole: undefined }).role, "student");
});

test("Account creation and OAuth reject browser-authored privileged roles and avoid UPSERT races", () => {
  const route = read("app/api/auth/complete-profile/route.ts");
  const oauth = read("app/auth/callback/route.ts");
  const intent = read("app/api/auth/oauth-intent/route.ts");
  const signup = read("components/auth/EmailPasswordAuthForm.tsx");
  assert.match(route, /checkOnboardingRole/);
  assert.match(route, /if \(readError\)/);
  assert.match(route, /\.insert\(\{/);
  assert.doesNotMatch(route, /\.upsert\(/);
  assert.match(route, /\.update\(\{ full_name: fullName, country \}\)/);
  assert.match(oauth, /checkOnboardingRole/);
  assert.match(oauth, /\.insert\(/);
  assert.doesNotMatch(oauth, /\.upsert\(/);
  assert.match(intent, /checkOnboardingRole/);
  assert.match(signup, /\/api\/auth\/complete-profile/);
  assert.doesNotMatch(signup, /\.from\("profiles"\)\s*\.upsert\(/);
  assert.doesNotMatch(signup, /metadataRole/);
  assert.doesNotMatch(signup, /user_metadata\?\.role/);
});

test("Proxy includes all role-protected API prefixes; handler-local protection remains necessary", () => {
  const proxy = read("proxy.ts");
  for (const namespace of ["admin", "teacher", "parent", "school", "student", "child"]) {
    assert.ok(proxy.includes('"/api/' + namespace + '/:path*"'), namespace);
  }
  assert.match(proxy, /authorizeSession\(supabase, roles\)/);
  const source = read("lib/auth/authorization.ts");
  assert.match(source, /auth\.getUser\(\)/);
  assert.match(source, /\.from\("profiles"\)/);
  assert.doesNotMatch(source, /user_metadata|raw_user_meta_data/);
});

test("Database SQL staging guard protects direct INSERT and UPDATE, but is not applied to production", () => {
  const sql = read("docs/security/STAGING_ONLY_PROFILE_ROLE_GUARD_ISSUE_117.sql");
  assert.match(sql, /BEFORE INSERT OR UPDATE ON public\.profiles/);
  assert.match(sql, /NEW\.role IS DISTINCT FROM OLD\.role/);
  assert.match(sql, /NEW\.email IS DISTINCT FROM OLD\.email/);
  assert.match(sql, /NEW\.id IS DISTINCT FROM OLD\.id/);
  assert.match(sql, /auth\.uid\(\)/);
  assert.match(sql, /student', 'child', 'parent/);
  assert.match(sql, /STAGING CANDIDATE ONLY/);
});
