import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const score=readFileSync("app/api/games/complete/route.ts","utf8");
const home=readFileSync("app/admin/page.tsx","utf8");
describe("HTML arcade scores are bounded and editable from admin portal",()=>{
 test("score submissions require verified user and a real published lesson",()=>{
  expect(score).toContain("supabase.auth.getUser()");
  expect(score).toContain('.eq("status", "published")');
  expect(score).toContain("GAME_MODES.some");
  expect(score).toContain("Number(body.maxScore) !== 5");
  expect(score).toContain("score > 5");
  expect(score).toContain("student_id: user.id");
  expect(score).not.toContain("service_role");
 });
 test("the admin editor is discoverable without constructing URLs by hand",()=>{
  expect(home).toContain('href: "/admin/games"');
  expect(home).toContain("مصمم ألعاب الدروس");
 });
});
