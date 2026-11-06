import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Profile completion denies new self-assigned admin but lets an existing incomplete admin finish profile", () => {
  const route = read("app/api/auth/complete-profile/route.ts");
  assert.match(route, /isSelfSignupRole\(role\)/);
  assert.match(route, /existingRole === "admin" && role === "admin"/);
  assert.match(route, /existingRole && existingRole !== role/);
  assert.match(route, /status: 409/);
  assert.match(route, /\.update\(\{ email: user\.email, full_name: fullName, country \}\)/);
  assert.match(route, /destinationForStoredRole\(existingRole \|\| role\)/);
});

test("Existing role lookup errors fail closed and cannot reach privileged insert", () => {
  const route = read("app/api/auth/complete-profile/route.ts");
  const callback = read("app/auth/callback/route.ts");
  assert.match(route, /error: existingError/);
  assert.match(route, /if \(existingError\)/);
  assert.match(route, /status: 503/);
  assert.ok(route.indexOf("if (existingError)") < route.indexOf('createAdminClient()'));
  assert.match(callback, /error: existingProfileError/);
  assert.match(callback, /if \(existingProfileError\)/);
  assert.ok(callback.indexOf("if (existingProfileError)") < callback.indexOf('createAdminClient()'));
  assert.match(callback, /profile_lookup/);
});

test("New profiles use INSERT, not UPSERT, to avoid overwriting roles created in concurrent requests", () => {
  const route = read("app/api/auth/complete-profile/route.ts");
  const callback = read("app/auth/callback/route.ts");
  assert.match(route, /from\("profiles"\)\.insert\(/);
  assert.match(callback, /from\("profiles"\)\.insert\(/);
  assert.doesNotMatch(route, /from\("profiles"\)\.upsert\(/);
  assert.doesNotMatch(callback, /from\("profiles"\)\.upsert\(/);
  assert.match(route, /racedProfile\.role/);
  assert.match(callback, /racedProfile\.role/);
});

test("Role is read from persisted profiles in onboarding, and a preexisting role cannot be changed by clicking buttons", () => {
  const page = read("app/onboarding/page.tsx");
  const form = read("components/auth/ProfileOnboardingForm.tsx");
  assert.match(page, /lockedRole = allowedRoles\.has\(storedRole\) \|\| storedRole === "admin"/);
  assert.match(page, /lockedRole=\{lockedRole\}/);
  assert.match(page, /existingDestination !== "\/onboarding"/);
  assert.match(form, /lockedRole \? \(/);
  assert.match(form, /role === "admin" \? "مدير"/);
  assert.match(form, /router\.replace\("\/my"\)/);
  assert.doesNotMatch(form, /router\.replace\(data\.destination \|\| "\/student"\)/);
  assert.match(form, /role="alert"/);
});

test("Auth data-management review file remains a proposal only", () => {
  const proposal = read("docs/security/REVIEW_ONLY_PROFILE_ROLE_IMMUTABILITY_2026-11-06.sql");
  assert.match(proposal, /NOT EXECUTED ON PRODUCTION/);
  assert.match(proposal, /NEW\.role IS DISTINCT FROM OLD\.role/);
});
