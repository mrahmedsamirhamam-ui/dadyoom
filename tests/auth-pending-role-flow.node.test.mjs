import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Privileged teacher/school intent cannot be turned into a role grant by email signup", () => {
  const route = read("app/api/auth/complete-profile/route.ts");
  assert.match(route, /isApprovalRequired\(role\) \? "student" : role/);
  assert.match(route, /role: initialRole/);
  assert.match(route, /pendingApproval: true/);
  assert.match(route, /"\/account\/role-status"/);
  assert.match(route, /ensurePendingRoleRequest/);
  assert.match(route, /existingRole && existingRole !== role && !matchesPendingApplication/);
  assert.doesNotMatch(route, /\.upsert\(\s*\{[^}]*role:/);
  assert.match(route, /error: existingError/);
});

test("Google signup cannot bypass pending approval with OAuth intent cookie", () => {
  const callback = read("app/auth/callback/route.ts");
  assert.match(callback, /requestedPrivilegedRole \? "student" : intent\.role/);
  assert.match(callback, /ensurePendingRoleRequest\(admin, user\.id, requestedPrivilegedRole\)/);
  assert.match(callback, /"\/account\/role-status"/);
  assert.match(callback, /storedRole === "student"/);
  assert.match(callback, /existingProfileError/);
  assert.doesNotMatch(callback, /role: intent\.role,/);
});

test("Role request service can only create pending applications, never alter statuses on conflict", () => {
  const svc = read("lib/auth/pending-role-request.ts");
  assert.match(svc, /export function isApprovalRequired/);
  assert.match(svc, /role === "teacher" \|\| role === "school"/);
  assert.match(svc, /\.from\("profile_role_requests"\)\.insert\(/);
  assert.match(svc, /insertError\.code !== "23505"/);
  assert.match(svc, /data\.requested_role !== requestedRole/);
  assert.doesNotMatch(svc, /from\("profiles"\)\.update/);
  assert.doesNotMatch(svc, /from\("profile_role_requests"\)\.upsert/);
});

test("Pending approval is explicitly visible on the account status page and student dashboard", () => {
  const page = read("app/account/role-status/page.tsx");
  const notice = read("components/auth/PendingRoleRequestNotice.tsx");
  const student = read("app/(dashboard)/student/layout.tsx");
  assert.match(page, /supabase\.auth\.getUser\(\)/);
  assert.match(page, /\.eq\("user_id", user\.id\)/);
  assert.match(page, /لم تُفعّل صلاحيات المعلم أو المدرسة بعد/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(page, /href="\/my"/);
  assert.match(notice, /profile_role_requests/);
  assert.match(notice, /طلب حساب/);
  assert.match(notice, /href="\/account\/role-status"/);
  assert.match(student, /<PendingRoleRequestNotice \/>/);
  assert.doesNotMatch(page, /createAdminClient|user_metadata|update\(\{ role:/);
});

test("Existing onboarding and signup navigate to approval status without second signup", () => {
  const onboard = read("components/auth/ProfileOnboardingForm.tsx");
  const signup = read("components/auth/EmailPasswordAuthForm.tsx");
  assert.match(onboard, /data\.pendingApproval \? "\/account\/role-status" : "\/my"/);
  assert.match(signup, /if \(completed\.pendingApproval\)/);
  assert.match(signup, /router\.replace\("\/account\/role-status"\)/);
  assert.match(signup, /router\.replace\(destination\)/);
});

test("The proposal is explicitly nonproduction and tested with fake PostgreSQL roles", () => {
  const sql = read("docs/security/REVIEW_ONLY_ROLE_APPROVAL_AND_RLS_2026-11-06.sql");
  const testSQL = read("tests/auth-profile-role-postgres-integration.sql");
  const ci = read(".github/workflows/review-role-rls-postgres.yml");
  assert.match(sql, /NOT DEPLOYED/);
  assert.match(sql, /NEW\.raw_user_meta_data->>'role'/);
  assert.match(sql, /REVOKE INSERT ON TABLE public\.profiles FROM authenticated, anon/);
  assert.match(sql, /NEW\.role IS DISTINCT FROM OLD\.role/);
  assert.match(sql, /initial_role :=/);
  assert.match(sql, /requested_role IN \('teacher','school'\)/);
  assert.match(testSQL, /student@invalid\.example/);
  assert.match(testSQL, /DISPOSABLE POSTGRES ROLE\/PROFILES SECURITY REGRESSION PASSED/);
  assert.match(ci, /postgres:16-alpine/);
  assert.doesNotMatch(ci, /SUPABASE_SERVICE_ROLE_KEY|hvqsvtomhlxavmfqoxfz/);
});
