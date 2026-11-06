import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  USER_ROLE_DESTINATIONS, SELF_SIGNUP_ROLES,
  destinationForStoredRole, isSelfSignupRole,
} from "../lib/auth/role-destination.mjs";

const root = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Only server-persisted role determines dashboard destination", () => {
  assert.deepEqual(Object.keys(USER_ROLE_DESTINATIONS).sort(), [
    "admin", "child", "parent", "school", "student", "teacher",
  ]);
  for (const [role, path] of Object.entries(USER_ROLE_DESTINATIONS)) {
    assert.equal(destinationForStoredRole(role), path);
    assert.equal(destinationForStoredRole(role.toUpperCase()), path);
  }
  for (const role of [null, undefined, {}, ["admin"], "__proto__", "toString", "superadmin", "", "/admin"]) {
    assert.equal(destinationForStoredRole(role), "/onboarding");
  }
  assert.equal(SELF_SIGNUP_ROLES.length, 5);
  assert.ok(SELF_SIGNUP_ROLES.every(isSelfSignupRole));
  assert.equal(isSelfSignupRole("admin"), false);
  assert.equal(isSelfSignupRole("__proto__"), false);
});

test("Password login stays rate-limited, and browser no longer trusts editable role metadata", () => {
  const form = root("components/auth/EmailPasswordAuthForm.tsx");
  const route = root("app/api/auth/destination/route.ts");
  assert.match(form, /passwordSignIn/);
  assert.match(form, /\/api\/auth\/password-login/);
  assert.match(form, /supabase\.auth\.setSession/);
  assert.match(form, /\/api\/auth\/destination/);
  assert.doesNotMatch(form, /user_metadata\?\.role|metadataRole|roleDestinations|\.from\("profiles"\)\s*\.upsert/);
  assert.match(form, /minLength=\{signup \? 8 : undefined\}/);
  assert.match(route, /supabase\.auth\.getUser\(\)/);
  assert.match(route, /\.from\("profiles"\)/);
  assert.match(route, /destinationForStoredRole\(profile\?\.role\)/);
  assert.match(route, /"Cache-Control": "private, no-store"/);
  assert.doesNotMatch(route, /user_metadata|app_metadata|service_role|createAdminClient/);
});

test("Both mobile auth forms are accessible, role-aware and have one principal CTA", () => {
  const form = root("components/auth/EmailPasswordAuthForm.tsx");
  assert.match(form, /<AuthShell/);
  assert.match(form, /aria-label="طرق الدخول"/);
  assert.match(form, /aria-pressed=\{role === item.value\}/);
  assert.match(form, /<GoogleAuthButton/);
  assert.match(form, /إظهار كلمة المرور/);
  assert.match(form, /نسيت كلمة المرور/);
  assert.match(form, /role="alert"/);
  assert.match(form, /aria-busy=\{busy\}/);
  assert.match(form, /min-h-12/);
  assert.doesNotMatch(form, /window\.localStorage/);
});

test("Signup profile completion is server verified and a persisted role is not overwritten", () => {
  const route = root("app/api/auth/complete-profile/route.ts");
  assert.match(route, /supabase\.auth\.getUser\(\)/);
  assert.match(route, /existingRole && existingRole !== role/);
  assert.match(route, /status: 409/);
  assert.match(route, /isSelfSignupRole\(role\)/);
  assert.match(route, /\.update\(\{ email: user.email, full_name: fullName, country \}\)/);
  assert.match(route, /destinationForStoredRole\(existingRole \|\| role\)/);
  assert.doesNotMatch(route, /new Set\(\["admin"/);
});

test("Google callback won't trust a requested next path or overwrite incomplete stored roles", () => {
  const callback = root("app/auth/callback/route.ts");
  assert.match(callback, /supabase\.auth\.getUser\(\)/);
  assert.match(callback, /existingProfile\?\.role/);
  assert.match(callback, /destinationForStoredRole/);
  assert.doesNotMatch(callback, /requestedNext|safeNext|roleDestinations/);
});

test("Onboarding only redirects complete profiles and preserves incomplete stored role", () => {
  const onboarding = root("app/onboarding/page.tsx");
  assert.match(onboarding, /\.select\("role,country,full_name"\)/);
  assert.match(onboarding, /existing\?\.country\?\.trim\(\)/);
  assert.match(onboarding, /existing\?\.full_name\?\.trim\(\)/);
  assert.match(onboarding, /const existingDestination = destinationForStoredRole\(existing\?\.role\)/);
  assert.match(onboarding, /existingDestination !== "\/onboarding"/);
});

test("Forgot password is real recoverable route and sends no enumeration signal", () => {
  const forgot = root("app/forgot-password/page.tsx");
  const reset = root("app/auth/update-password/page.tsx");
  assert.match(forgot, /resetPasswordForEmail/);
  assert.match(forgot, /\/auth\/update-password/);
  assert.match(forgot, /إذا كان هذا البريد مرتبطًا بحساب/);
  assert.match(reset, /exchangeCodeForSession/);
  assert.match(reset, /verifyOtp/);
  assert.match(reset, /updateUser\(\{ password \}\)/);
  assert.match(reset, /password !== confirm/);
});

test("Role dashboards expose primary actions first but never delete other links", () => {
  const portal = root("components/roles/RolePortalLayout.tsx");
  assert.match(portal, /const primaryHrefs/);
  assert.match(portal, /student: \["\/student", "\/courses", "\/journey", "\/skills"\]/);
  assert.match(portal, /<details/);
  assert.match(portal, /links\.filter\(item => !primaryHrefs\[role\]\.includes\(item\.href\)\)/);
  assert.match(portal, /supabase\.auth\.getUser\(\)/);
});

test("Existing production role trigger gap is documented as not deployed", () => {
  const sql = root("docs/security/REVIEW_ONLY_PROFILE_ROLE_IMMUTABILITY_2026-11-06.sql");
  assert.match(sql, /NOT EXECUTED ON PRODUCTION/);
  assert.match(sql, /NEW\.role IS DISTINCT FROM OLD\.role/);
  assert.match(sql, /Profile role changes require an authorized administrator/);
});


test("Mobile home has visible login and two legible CTAs with adequate touch targets", () => {
  const home = root("app/page.tsx");
  assert.match(home, /href="\/login" className="inline-flex min-h-11/);
  assert.match(home, /href="\/signup"/);
  assert.match(home, /جرّب درسًا الآن دون تسجيل/);
  assert.match(home, /أنشئ حسابًا لحفظ تقدمك/);
  assert.match(home, /min-h-12 w-full items-center justify-center/);
  assert.doesNotMatch(home, /href="\/login" className="hidden/);
});
