import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const migration = read("supabase/migrations/20261106_p0_profile_role_request_guard.sql");

test("SQL migration blocks direct signed-in INSERT and identity/role UPDATE while keeping benign profile edit", () => {
  assert.match(migration, /REVOKE INSERT ON TABLE public\.profiles FROM anon, authenticated/);
  assert.match(migration, /REVOKE UPDATE ON TABLE public\.profiles FROM anon, authenticated/);
  assert.match(migration, /GRANT UPDATE \(/);
  assert.match(migration, /full_name, country, grade_number, interests, learning_goal/);
  assert.doesNotMatch(migration.slice(migration.indexOf("GRANT UPDATE ("), migration.indexOf(") ON TABLE public.profiles TO authenticated")), /\brole\b|\bemail\b|\bid\b/);
  assert.match(migration, /NEW\.role IS DISTINCT FROM OLD\.role/);
  assert.match(migration, /NEW\.requested_role IS DISTINCT FROM OLD\.requested_role/);
  assert.match(migration, /NEW\.id IS DISTINCT FROM OLD\.id/);
  assert.match(migration, /BEFORE UPDATE ON public\.profiles/);
  assert.match(migration, /DROP POLICY IF EXISTS "Users insert own profile"/);
  assert.match(migration, /REVOKE EXECUTE ON FUNCTION public\.handle_new_user\(\)/);
});
test("Database trigger never takes teacher or school privileges from editable Auth user metadata", () => {
  assert.match(migration, /SECURITY DEFINER/);
  assert.match(migration, /SET search_path = ''/);
  assert.match(migration, /selected_role IN \('student', 'child', 'parent'\)/);
  assert.match(migration, /selected_role IN \('teacher', 'school'\)/);
  assert.match(migration, /ON CONFLICT \(id\) DO NOTHING/);
  assert.match(migration, /requested_role_at/);
  assert.doesNotMatch(migration, /UPDATE public\.profiles SET role\s*=\s*NEW\.raw_user_meta_data/i);
});
test("Teacher and school registration is only a non-privileged role request", () => {
  const email = read("app/api/auth/complete-profile/route.ts");
  const google = read("app/auth/callback/route.ts");
  for (const route of [email, google]) {
    assert.match(route, /requested_role/);
    assert.match(route, /"teacher","school"|"teacher", "school"/);
    assert.match(route, /\/account\/role-request/);
    assert.match(route, /\.from\("profiles"\)\.insert\(/);
    assert.doesNotMatch(route, /\.from\("profiles"\)\.upsert\(/);
  }
  assert.match(email, /role: \["teacher","school"\]\.includes\(role\) \? "student" : role/);
  assert.match(google, /role: \["teacher", "school"\]\.includes\(intent\.role\) \? "student" : intent\.role/);
});
test("Returning session routes an unapproved teacher or school safely to request status, not teacher data", () => {
  for (const path of ["app/my/page.tsx", "app/page.tsx", "app/api/auth/destination/route.ts"]) {
    const source = read(path);
    assert.match(source, /requested_role/);
    assert.match(source, /\/account\/role-request/);
    assert.match(source, /student/);
  }
  const pending = read("app/account/role-request/page.tsx");
  assert.match(pending, /supabase\.auth\.getUser\(\)/);
  assert.match(pending, /eq\("id", user\.id\)/);
  assert.match(pending, /profile\?\.role !== "student"/);
  assert.match(pending, /طلبات|قيد المراجعة/);
});
test("Admin approval is authenticated, scoped, CSRF-checked, records approver, and rechecks pending state", () => {
  const route = read("app/api/admin/role-requests/route.ts");
  const page = read("app/admin/role-requests/page.tsx");
  const layout = read("app/admin/layout.tsx");
  assert.match(route, /supabase\.auth\.getUser\(\)/);
  assert.match(route, /profile\?\.role !== "admin"/);
  assert.match(route, /new URL\(origin\)\.origin !== new URL\(request\.url\)\.origin/);
  assert.match(route, /"application\/x-www-form-urlencoded"/);
  assert.match(route, /user\.id === userId/);
  assert.match(route, /role_approved_by: user\.id/);
  assert.match(route, /role_approved_at: new Date\(\)\.toISOString\(\)/);
  assert.match(route, /\.eq\("role", "student"\)/);
  assert.match(route, /\.eq\("requested_role", requestedRole\)/);
  assert.match(page, /\.limit\(100\)/);
  assert.match(page, /\.eq\("role", "student"\)/);
  assert.match(layout, /\/admin\/role-requests/);
});

test("Google signup preserves a pending request created after Supabase's auth.users trigger", () => {
  const callback = read("app/auth/callback/route.ts");
  assert.match(callback, /existingProfile\?\.role\?\.trim\(\)\.toLowerCase\(\) === "student"/);
  assert.match(callback, /!existingProfile\?\.requested_role/);
  assert.match(callback, /requested_role: intent\.role as "teacher" \| "school"/);
  assert.match(callback, /\.eq\("id", user\.id\)\.eq\("role", "student"\)\.is\("requested_role", null\)/);
  assert.match(callback, /currentProfile = refreshed/);
  assert.match(callback, /currentProfile\.requested_role/);
  assert.doesNotMatch(callback, /role: intent\.role,\s*country:/);
});

test("Password login accepts only a server-confirmed pending-role path", () => {
  const form = read("components/auth/EmailPasswordAuthForm.tsx");
  const route = read("app/api/auth/destination/route.ts");
  assert.match(form, /"\/account\/role-request"/);
  assert.match(form, /\/api\/auth\/destination/);
  assert.match(route, /profile\?\.requested_role/);
  assert.match(route, /"\/account\/role-request"/);
});
