import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

test("OAuth callback carries session cookies into the final redirect", () => {
  const code = readFileSync("app/auth/callback/route.ts", "utf8");
  expect(code).toContain("createServerClient(");
  expect(code).toContain("authCookieWriters");
  expect(code).toContain("response.cookies.set(name, value, options)");
  expect(code).toContain('redirectWithAuth(destination, true)');
  expect(code).toContain('redirectWithAuth("/login?error=oauth_exchange")');
});
test("Login provides visible OAuth callback errors and a fresh post-login navigation", () => {
  const form = readFileSync("components/auth/EmailPasswordAuthForm.tsx", "utf8");
  expect(form).toContain('new URLSearchParams(window.location.search).get("error")');
  expect(form).toContain("oauth_exchange:");
  expect(form).toContain("window.location.replace(");
  expect(form).toContain('mode === "signup" && password.length < 8');
});
test("Provider status never equates a transient probe outage with disabled Google", () => {
  const endpoint = readFileSync("app/api/auth/provider-status/route.ts", "utf8");
  const button = readFileSync("components/auth/GoogleAuthButton.tsx", "utf8");
  expect(endpoint).toContain("google: null, configured: false");
  expect(button).toContain("data.configured === true ? data.google === true : null");
});
test("Mauritanian grade 13 can complete onboarding and enter their portal", () => {
  const callback = readFileSync("app/auth/callback/route.ts", "utf8");
  const form = readFileSync("components/auth/EmailPasswordAuthForm.tsx", "utf8");
  const complete = readFileSync("app/api/auth/complete-profile/route.ts", "utf8");
  const onboard = readFileSync("components/auth/ProfileOnboardingForm.tsx", "utf8");
  expect(callback).toContain("grade > 13");
  expect(form).toContain("gradeNumber > 13");
  expect(complete).toContain("gradeNumber > 13");
  expect(onboard).toContain('value !== 13 || country === "MR"');
});
test("Stale next portal is filtered and Grade 13 retains its session", () => {
  const callback = readFileSync("app/auth/callback/route.ts", "utf8");
  const form = readFileSync("components/auth/EmailPasswordAuthForm.tsx", "utf8");
  const year = readFileSync("lib/student/academic-year.ts", "utf8");
  const verifier = readFileSync("scripts/verify-production-auth-assets.mjs", "utf8");
  expect(callback).toContain("allowedNextForRole(role, requestedNext)");
  expect(callback).toContain("allowedNextForRole(safeRole, requestedNext)");
  expect(form).toContain("allowedPostLoginNext(nextPath, destination)");
  expect(year).toContain("if (grade === 13) return 13");
  expect(verifier).toContain("DADYOOM_OAUTH_CALLBACK_ROUTE=PASS");
});
