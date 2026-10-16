import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const server = readFileSync("features/live/actions.ts", "utf8");
const client = readFileSync("app/(dashboard)/school/meetings/SchoolMeetingCreationForm.tsx", "utf8");
const route = readFileSync("app/api/school/meetings/route.ts", "utf8");

describe("Vinext meeting creation transport", () => {
  test("server action remains async for existing callers", () => {
    expect(server).not.toContain("export const initialSchoolMeetingActionState");
    expect(server).toContain("export async function createSchoolMeetingWithResult(");
  });
  test("browser uses an explicit protected API instead of an unreliable action receipt", () => {
    expect(client).not.toContain("useActionState(");
    expect(client).toContain('fetch("/api/school/meetings"');
    expect(route).toContain("await createSchoolMeetingAction(await request.formData())");
    expect(route).toContain('status: 403, headers: NO_STORE');
  });
});
