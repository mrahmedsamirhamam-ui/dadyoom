import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const meetings = readFileSync("app/(dashboard)/school/meetings/page.tsx", "utf8");
const form = readFileSync("app/(dashboard)/school/meetings/SchoolMeetingCreationForm.tsx", "utf8");
const route = readFileSync("app/api/school/meetings/route.ts", "utf8");
const actions = readFileSync("features/live/actions.ts", "utf8");
const secureMeeting = readFileSync("lib/live/create-school-meeting.ts", "utf8");
const e2e = readFileSync("scripts/final-e2e-release-gate.mjs", "utf8");
const flow = e2e.slice(
  e2e.indexOf("async function focusedSchoolMeetingFlow("),
  e2e.indexOf("async function teacherRewardFlow("),
);

describe("School meetings use authenticated SSR and a real save receipt", () => {
  test("school SSR retains owner and role protections", () => {
    expect(meetings).toContain("await getDashboardRequestViewer()");
    expect(meetings).toContain('role !== "school"');
    expect(meetings).toContain('role !== "admin"');
    expect(meetings).toContain('.eq("owner_id", user.id)');
    expect(meetings).not.toContain("supabase.auth.getUser()");
    expect(meetings).not.toContain('.from("profiles")');
    expect(meetings).toContain("<SchoolMeetingCreationForm />");
  });

  test("production E2E requires HTTP 200, hydrated form, receipt and DB row", () => {
    expect(flow).toContain("const http = response?.status() ?? 0");
    expect(flow).toContain('path === "/school/meetings"');
    expect(flow).toContain('field.waitFor({ state: "visible", timeout: 10_000 })');
    expect(flow).toContain("E2E_SCHOOL_MEETING_FORM_RETRY");
    expect(flow).toContain('gate(meetingFormReady, "E2E_SCHOOL_MEETING_FORM_UNAVAILABLE")');
    expect(flow).toContain("E2E_SCHOOL_MEETING_JS_HYDRATION_FAILED");
    expect(flow).toContain('await readyButton.click()');
    expect(flow).toContain('data-school-meeting-result="success"');
    expect(flow).toContain("E2E_SCHOOL_MEETING_ACTION_RECEIPT_FAILED");
    expect(flow).toContain("E2E_SCHOOL_MEETING_CREATE_DB_FAILED");
  });

  test("explicit same-origin API sends user session, not client service role", () => {
    expect(form).toContain("onSubmit={submitMeeting}");
    expect(form).toContain('fetch("/api/school/meetings"');
    expect(form).toContain('credentials: "same-origin"');
    expect(form).toContain('"X-Dadyoom-Meeting-Request": "1"');
    expect(form).toContain('data-school-meeting-result={result.ok ? "success" : "error"}');
    expect(form).not.toContain("useActionState(");
    expect(route).toContain('request.headers.get("x-dadyoom-meeting-request")');
    expect(route).toContain("await createSchoolMeetingRecord(await request.formData())");
    expect(route).toContain('"Cache-Control": "no-store"');
    expect(route).not.toContain("service_role");
    expect(route).not.toContain("@/features/live/actions");
    expect(actions).toContain("await createSchoolMeetingRecord(form)");
    expect(secureMeeting).toContain('role !== "school" && role !== "admin"');
    expect(secureMeeting).toContain('.eq("owner_id", user.id)');
    expect(actions).toContain('await createSchoolMeetingAction(form)');
    expect(actions).toContain("SCHOOL_MEETING_SAVE_FAILURE");
  });
});
