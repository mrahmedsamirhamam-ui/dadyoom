import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const server=readFileSync("features/live/actions.ts","utf8");
const client=readFileSync("app/(dashboard)/school/meetings/SchoolMeetingCreationForm.tsx","utf8");
describe("Vinext server action export compatibility",()=>{
 test("server action exports async functions, not a non-async initial state constant",()=>{
   expect(server).not.toContain("export const initialSchoolMeetingActionState");
   expect(server).toContain("export async function createSchoolMeetingWithResult(");
   expect(client).toContain('useActionState(createSchoolMeetingWithResult, { ok: false, message: "" })');
 });
});
