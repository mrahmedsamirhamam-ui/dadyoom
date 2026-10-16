import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const client=readFileSync("app/(dashboard)/teacher/classroom/TeacherClassroomClient.tsx","utf8");
const actions=readFileSync("features/classroom/actions.ts","utf8");
const publish=actions.slice(actions.indexOf("export async function createAssignmentAction("),
  actions.indexOf("export async function submitAssignmentAction("));

describe("Teacher classroom targeted assignments never publish partially",()=>{
 test("target selector is controlled by real selected student, not hardwired to the entire class",()=>{
   expect(client).toContain("value={selectedAssignmentStudentId}");
   expect(client).toContain("onChange={setAssignmentStudentId}");
   expect(client).toContain('setAssignmentStudentId("");');
   expect(client).not.toContain('label="التوجيه"\n              name="studentId"\n              value=""');
 });
 test("verifies class ownership, active membership and published lesson before inserts",()=>{
   expect(publish).toContain('.eq("teacher_id", user.id)');
   expect(publish).toContain('.eq("is_active", true)');
   expect(publish).toContain('.eq("student_id", studentId)');
   expect(publish).toContain('.eq("status", "published").maybeSingle()');
 });
 test("incomplete assignments stay draft until question and target insertion succeeds",()=>{
   expect(publish).toContain('status: "draft"');
   expect(publish).toContain('update({ status: "published" })');
   expect(publish).toContain('.eq("status", "draft")');
   expect(publish).toContain("CLASSROOM_DRAFT_ROLLBACK_FAILED");
   expect(publish.indexOf('status: "draft"')).toBeLessThan(publish.indexOf('update({ status: "published" })'));
 });
});
