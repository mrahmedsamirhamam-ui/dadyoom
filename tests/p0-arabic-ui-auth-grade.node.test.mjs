import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { ARABIC_COUNT_NOUNS, formatArabicCount } from "../lib/i18n/arabic-count.mjs";
import { rolesForProtectedApiPath } from "../lib/auth/api-role-guard.mjs";

const file = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Arabic-count zero, one, dual, 3–10, 11–99, hundreds and large values", () => {
  assert.equal(formatArabicCount(0, "grade"), "لا توجد صفوف");
  assert.equal(formatArabicCount(1, "grade"), "صفّ واحد");
  assert.equal(formatArabicCount(2, "grade"), "صفّان");
  assert.equal(formatArabicCount(3, "grade"), "3 صفوف");
  assert.equal(formatArabicCount(10, "skill"), "10 مهارات");
  assert.equal(formatArabicCount(11, "grade"), "11 صفًّا");
  assert.equal(formatArabicCount(12, "grade"), "12 صفًّا");
  assert.equal(formatArabicCount(13, "lesson"), "13 درسًا");
  assert.equal(formatArabicCount(21, "student"), "21 طالبًا");
  assert.equal(formatArabicCount(100, "teacher"), "100 معلم");
  assert.equal(formatArabicCount(103, "teacher"), "103 معلمين");
  assert.equal(formatArabicCount(112, "activity"), "112 نشاطًا");
  assert.equal(formatArabicCount(0, "question"), "لا توجد أسئلة");
  assert.equal(formatArabicCount(2, "school"), "مدرستان");
  assert.equal(Object.keys(ARABIC_COUNT_NOUNS).length, 9);
});
test("Never silently format invalid numeric input into grammatically wrong labels", () => {
  for (const value of [NaN, Infinity, -1, 2.3, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => formatArabicCount(value, "lesson"), RangeError);
  }
  assert.throws(() => formatArabicCount(12, "invented"), TypeError);
});
test("All four roles have protected API boundaries, plus child and admin", () => {
  assert.deepEqual(rolesForProtectedApiPath("/api/admin/users"), ["admin"]);
  assert.deepEqual(rolesForProtectedApiPath("/api/teacher/classes"), ["teacher", "admin"]);
  assert.deepEqual(rolesForProtectedApiPath("/api/parent/children"), ["parent", "admin"]);
  assert.deepEqual(rolesForProtectedApiPath("/api/school/teachers"), ["school", "admin"]);
  assert.deepEqual(rolesForProtectedApiPath("/api/student/progress"), ["student", "child", "admin"]);
  assert.deepEqual(rolesForProtectedApiPath("/api/child/progress"), ["child", "admin"]);
  assert.equal(rolesForProtectedApiPath("/api/teachers/anything"), undefined);
  assert.equal(rolesForProtectedApiPath("/api/parenting"), undefined);
  assert.equal(rolesForProtectedApiPath("/api/public"), undefined);
  assert.equal(rolesForProtectedApiPath("/school"), undefined);
});
test("Next 16 proxy matches all protected namespaces, checks a verified profile role", () => {
  const src = file("proxy.ts");
  assert.match(src, /rolesForProtectedApiPath\(pathname\)/);
  for (const ns of ["admin", "teacher", "parent", "school", "student", "child"]) {
    assert.ok(src.includes('"/api/' + ns + '/:path*"'), ns);
  }
  assert.match(src, /await authorizeSession\(supabase, roles\)/);
  assert.match(src, /Cache-Control.*no-store/);
  const auth = file("lib/auth/authorization.ts");
  assert.match(auth, /client.auth.getUser\(\)/);
  assert.match(auth, /\.from\("profiles"\)/);
  assert.match(auth, /\.select\("role"\)/);
  assert.doesNotMatch(auth, /user_metadata|raw_user_meta_data/);
});
test("Reviewed migration requires admin consent, not client-controlled profile roles", () => {
  const sql = file("supabase/migrations/20261106_p0_profile_role_request_guard.sql");
  assert.match(sql, /REVOKE INSERT ON TABLE public\.profiles FROM anon, authenticated/);
  assert.match(sql, /REVOKE UPDATE ON TABLE public\.profiles FROM anon, authenticated/);
  assert.match(sql, /NEW\.role IS DISTINCT FROM OLD\.role/);
  assert.match(sql, /NEW\.requested_role IS DISTINCT FROM OLD\.requested_role/);
  assert.match(sql, /safe_role := CASE/);
  assert.match(sql, /safe_role,\s*\n\s*nullif/);
  const complete = file("app/api/auth/complete-profile/route.ts");
  assert.match(complete, /requested_role/);
  assert.doesNotMatch(complete, /\.upsert\(/);
  const approve = file("app/api/admin/role-requests/route.ts");
  assert.match(approve, /requireAdminResponse/);
  assert.match(approve, /\.eq\("role", "student"\)/);
  assert.match(approve, /role_approved_by: user.id/);
});
test("Student question grade is calculated with a private server key after RLS visibility check", () => {
  const route = file("app/api/questions/answer/route.ts");
  const visible = route.indexOf('from("dadyoom_student_questions")');
  const admin = route.indexOf("const admin = createAdminClient()");
  assert.ok(visible >= 0 && admin > visible);
  assert.match(route, /await supabase.auth.getUser\(\)/);
  assert.match(route, /readBoundedJsonObject\(request\)/);
  assert.match(route, /gradeStoredMcq\(/);
  assert.match(route, /\.from\("question_attempts"\)/);
  assert.match(route, /user_id: user.id/);
  assert.match(route, /is_correct: grade.isCorrect/);
  assert.doesNotMatch(route, /is_correct: raw|user_id: raw|grade: raw|score: raw/);
});
test("Legacy forged skills scores and XP are rejected until server-attested receipts exist", () => {
  const route = file("app/api/skills/progress/route.ts");
  assert.match(route, /UNVERIFIED_SKILL_SCORE/);
  assert.match(route, /status: 409/);
  assert.match(route, /await supabase.auth.getUser\(\)/);
  assert.doesNotMatch(route, /clampScore|xpFromScore|completeDailyChallengeFromSkillResult|\.upsert\(/);
});
test("Role dashboards use reviewed Arabic copy and counts instead of unsafe number+noun", () => {
  const teacher = file("app/(dashboard)/teacher/page.tsx");
  const school = file("app/(dashboard)/school/page.tsx");
  const student = file("app/(dashboard)/student/page.tsx");
  const parent = file("app/(dashboard)/parent/page.tsx");
  const header = file("components/home/HomeInteractionPanel.tsx");
  for (const src of [teacher, school]) assert.match(src, /formatArabicCount\(/);
  assert.doesNotMatch(teacher, /\{classes\.length\}\s*فصل/);
  assert.doesNotMatch(school, /\{schoolTeachers\.length\}\s*معلم/);
  assert.doesNotMatch(school, /\{teacherClassCount\}\s*فصل/);
  assert.doesNotMatch(student, /لا توجد مهارة ضعيفة/);
  assert.doesNotMatch(parent, /سنضيف في الخطوة التالية/);
  assert.doesNotMatch(header, /شات ضاد|اختبر الأزرار الآن/);
});
