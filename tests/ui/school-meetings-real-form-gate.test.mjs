import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const meetings = readFileSync("app/(dashboard)/school/meetings/page.tsx", "utf8");
const e2e = readFileSync("scripts/final-e2e-release-gate.mjs", "utf8");
const flow = e2e.slice(
  e2e.indexOf("async function focusedSchoolMeetingFlow("),
  e2e.indexOf("async function teacherRewardFlow("),
);

describe("School meeting creation uses shared auth and a genuinely visible form", () => {
  test("school SSR uses cached request viewer without repeated auth and profile reads", () => {
    expect(meetings).toContain("await getDashboardRequestViewer()");
    expect(meetings).toContain('role !== "school"');
    expect(meetings).toContain('role !== "admin"');
    expect(meetings).toContain('.eq("owner_id", user.id)');
    expect(meetings).not.toContain("supabase.auth.getUser()");
    expect(meetings).not.toContain('.from("profiles")');
    expect(meetings).toContain('action={createSchoolMeetingAction}');
  });
  test("production QA requires 200, correct page and visible meeting title", () => {
    expect(flow).toContain("const http = response?.status() ?? 0");
    expect(flow).toContain('path === "/school/meetings"');
    expect(flow).toContain('field.waitFor({ state: "visible", timeout: 10_000 })');
    expect(flow).toContain("E2E_SCHOOL_MEETING_FORM_RETRY");
    expect(flow).toContain('gate(meetingFormReady, "E2E_SCHOOL_MEETING_FORM_UNAVAILABLE")');
    expect(flow).toContain('await form.locator(\'input[name="title"]\').fill(meetingTitle)');
    expect(flow).toContain("E2E_SCHOOL_MEETING_CREATE=PASS");
  });
});
