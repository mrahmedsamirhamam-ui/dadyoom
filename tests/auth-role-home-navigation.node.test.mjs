import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { destinationForStoredRole, USER_ROLE_DESTINATIONS } from "../lib/auth/role-destination.mjs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("All six authenticated roles have unique stable home destinations", () => {
  const expected = {
    student: "/student", child: "/child", teacher: "/teacher",
    parent: "/parent", school: "/school", admin: "/admin",
  };
  assert.deepEqual(USER_ROLE_DESTINATIONS, expected);
  assert.equal(new Set(Object.values(expected)).size, 6);
  for (const [role, href] of Object.entries(expected)) {
    assert.equal(destinationForStoredRole(role), href);
  }
  for (const role of ["", "__proto__", "guest", "superadmin", null]) {
    assert.equal(destinationForStoredRole(role), "/onboarding");
  }
});

test("Role home requires authenticated verified user, reads own stored role, never metadata or URL role", () => {
  const page = read("app/my/page.tsx");
  assert.match(page, /createClient\(\)/);
  assert.match(page, /supabase\.auth\.getUser\(\)/);
  assert.match(page, /if \(authError \|\| !user\) redirect\("\/login"\)/);
  assert.match(page, /\.from\("profiles"\)/);
  assert.match(page, /\.eq\("id", user\.id\)/);
  assert.match(page, /\.select\("role,country,full_name"\)/);
  assert.match(page, /redirect\(destinationForStoredRole\(profile\.role\)\)/);
  assert.match(page, /redirect\("\/onboarding"\)/);
  assert.match(page, /force-dynamic/);
  assert.doesNotMatch(page, /user\.user_metadata|searchParams|window\.location|service_role|createAdminClient/);
});

test("Home is public for guests and takes authenticated learners back to their own space", () => {
  const home = read("app/page.tsx");
  assert.match(home, /export default async function HomePage/);
  assert.match(home, /supabase\.auth\.getUser\(\)/);
  assert.match(home, /if \(!authError && user\)/);
  assert.match(home, /redirect\(destinationForStoredRole\(profile\.role\)\)/);
  assert.match(home, /redirect\("\/onboarding"\)/);
  assert.match(home, /return \(/);
  assert.match(home, /جرّب درسًا الآن دون تسجيل/);
  assert.doesNotMatch(home, /user_metadata|app_metadata|localStorage/);
});

test("Shared navigation and logos point to role home instead of anonymous marketing landing", () => {
  const navbar = read("components/Navbar.tsx");
  const layout = read("components/roles/RolePortalLayout.tsx");
  const admin = read("app/admin/layout.tsx");
  const child = read("components/child/EarlyLearningRoom.tsx");
  assert.match(navbar, /<DadyoomLogo href=\{user \? "\/my" : "\/"\}/);
  assert.match(navbar, /case "child":/);
  assert.match(navbar, /href: "\/child"/);
  assert.match(navbar, /href: "\/my", label: "مساحتي"/);
  assert.match(layout, /<DadyoomLogo href="\/my"/);
  assert.match(layout, /redirect\(destinationForStoredRole\(actualRole\)\)/);
  assert.doesNotMatch(layout, /destinations\[actualRole\] \?\?\s*"\/"/);
  assert.match(admin, /<DadyoomLogo href="\/admin"/);
  assert.match(admin, /redirect\("\/my"\)/);
  assert.match(child, /href="\/child"/);
});

test("Lesson return is account-aware, accessible, and sign-out is a separate action", () => {
  const lesson = read("app/lessons/[id]/page.tsx");
  const logout = read("components/auth/LogoutButton.tsx");
  assert.match(lesson, /href="\/my"/);
  assert.match(lesson, /العودة إلى مساحتي/);
  assert.doesNotMatch(lesson, /العودة إلى لوحة الطالب/);
  assert.match(logout, /supabase\.auth\.signOut\(\)/);
  assert.match(logout, /if \(signOutError\) throw signOutError/);
  assert.match(logout, /catch \{/);
  assert.match(logout, /تعذر تسجيل الخروج/);
  assert.match(logout, /role="alert"/);

  assert.match(logout, /تسجيل الخروج من الحساب/);
  assert.match(logout, /تسجيل الخروج/);
  assert.doesNotMatch(logout, /router\.replace\("\/my"\)/);
});


test("Onboarding never redirects back to itself for unknown stored roles", () => {
  const onboarding = read("app/onboarding/page.tsx");
  assert.match(onboarding, /existingDestination !== "\/onboarding"/);
  assert.match(onboarding, /redirect\(existingDestination\)/);
});
