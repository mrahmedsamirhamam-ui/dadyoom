import { test, expect } from "vitest";
import { readFileSync } from "node:fs";

test("teacher reward acknowledges persisted insert before deferred cache work", () => {
  const actions = readFileSync("features/classroom/actions.ts", "utf8");
  const section = actions.split("export async function awardStudentAction")[1].split("type DraftQuestion")[0];
  expect(section).toContain("await db.from(\"edu_rewards\").insert");
  expect(section).toContain("after(async () => {");
  expect(section.indexOf("after(async () => {")).toBeGreaterThan(section.indexOf("edu_rewards"));
  expect(section).not.toContain('revalidatePath("/teacher/classroom")');
  expect(section).toContain("TEACHER_AWARD_POST_COMMIT_CACHE_WARNING");
});

test("teacher award UI announces error or success and E2E inspects the same status", () => {
  const client = readFileSync("app/(dashboard)/teacher/classroom/TeacherClassroomClient.tsx","utf8");
  const e2e = readFileSync("scripts/final-e2e-release-gate.mjs","utf8");
  expect(client).toContain('role="status" aria-live="polite"');
  expect(client).toContain("setStatus(result.message)");
  expect(e2e).toContain("E2E_TEACHER_REWARD_UI_DIAGNOSTIC");
  expect(e2e).toContain("E2E_TEACHER_REWARD_STUDENT_SELECT_MISMATCH");
});
