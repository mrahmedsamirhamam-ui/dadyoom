import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const form = readFileSync("app/(dashboard)/school/meetings/SchoolMeetingCreationForm.tsx", "utf8");
const qa = readFileSync("scripts/final-e2e-release-gate.mjs", "utf8");

describe("School meeting submit stays disabled before client hydration", () => {
  test("the fetch submit handler cannot run on an SSR-only button", () => {
    expect(form).toContain("useSyncExternalStore(noopSubscribe, () => true, () => false)");
    expect(form).toContain("disabled={!hydrated || pending}");
    expect(form).toContain('data-school-meeting-js-ready={hydrated ? "yes" : "no"}');
    expect(form).toContain("جارٍ تجهيز نموذج الاجتماع...");
    expect(form).toContain("onSubmit={submitMeeting}");
  });
  test("production QA waits for client readiness and real server receipt", () => {
    expect(qa).toContain("E2E_SCHOOL_MEETING_JS_HYDRATION_FAILED");
    expect(qa).toContain('data-school-meeting-js-ready="yes"');
    expect(qa).toContain('form:has(input[name="title"])');
    expect(qa).not.toContain("const createButton = schoolPage");
    expect(qa).toContain("await readyButton.click()");
    expect(qa.indexOf("await readyButton.click()")).toBeLessThan(qa.indexOf("E2E_SCHOOL_MEETING_ACTION_RECEIPT_FAILED"));
  });
});
