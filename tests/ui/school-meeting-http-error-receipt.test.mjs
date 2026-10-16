import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const form = readFileSync("app/(dashboard)/school/meetings/SchoolMeetingCreationForm.tsx", "utf8");
const route = readFileSync("app/api/school/meetings/route.ts", "utf8");
const helper = readFileSync("lib/live/create-school-meeting.ts", "utf8");
const actions = readFileSync("features/live/actions.ts", "utf8");

describe("School meeting HTTP route does not rely on server-action transport", () => {
  test("API imports the server-only business function with original RLS owner guards", () => {
    expect(route).toContain('import { createSchoolMeetingRecord } from "@/lib/live/create-school-meeting"');
    expect(route).not.toContain("@/features/live/actions");
    expect(route).toContain("await createSchoolMeetingRecord(await request.formData())");
    expect(helper).toContain("supabase.auth.getUser()");
    expect(helper).toContain('role !== "school" && role !== "admin"');
    expect(helper).toContain('.eq("owner_id", user.id)');
    expect(helper).toContain('room_name: roomName');
    expect(helper).toContain('school_id: school.id');
    expect(helper).toContain(".insert({");
    expect(actions).toContain("await createSchoolMeetingRecord(form)");
    expect(route).not.toContain("service_role");
  });
  test("non-JSON HTTP 500 does not look like a connectivity failure", () => {
    expect(form).toContain('response.headers.get("content-type")');
    expect(form).toContain("response.status >= 500");
    expect(form).toContain("لم يتم تأكيد حفظ الاجتماع");
    expect(form).toContain("تعذر الاتصال بالخادم");
    expect(form).toContain('credentials: "same-origin"');
    expect(form).toContain('data-school-meeting-result={result.ok ? "success" : "error"}');
  });
});
