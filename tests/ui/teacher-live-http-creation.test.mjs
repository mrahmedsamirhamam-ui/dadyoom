import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const page = readFileSync("app/(dashboard)/teacher/live/page.tsx","utf8");
const form = readFileSync("app/(dashboard)/teacher/live/TeacherLiveCreationForm.tsx","utf8");
const route = readFileSync("app/api/teacher/live/route.ts","utf8");
const create = readFileSync("lib/live/create-teacher-session.ts","utf8");
const actions = readFileSync("features/live/actions.ts","utf8");
describe("Teacher live session creation HTTP contract", () => {
  test("only current teacher's courses and classes are selectable", () => {
    expect(page).toContain("<TeacherLiveCreationForm");
    expect((page.match(/\.eq\("teacher_id", user\.id\)/g) ?? []).length).toBe(3); // sessions list, owned courses, owned classes
    expect(page).not.toContain("action={createLiveSessionAction}");
  });
  test("route preserves auth, class/course ownership and RLS", () => {
    expect(route).toContain("await createTeacherLiveSessionRecord(await request.formData())");
    expect(route).not.toContain("@/features/live/actions");
    expect(create).toContain("supabase.auth.getUser()");
    expect(create).toContain("COURSE_NOT_OWNED_BY_TEACHER");
    expect(create).toContain("CLASS_NOT_OWNED_BY_TEACHER");
    expect(create).toContain(".insert({");
    expect(actions).toContain("await createTeacherLiveSessionRecord(form)");
    expect(route).not.toContain("service_role");
  });
  test("hydrated form confirms JSON, non-JSON failures and input linking", () => {
    expect(form).toContain("useSyncExternalStore(noopSubscribe, () => true, () => false)");
    expect(form).toContain("disabled={!hydrated || pending}");
    expect(form).toContain('fetch("/api/teacher/live"');
    expect(form).toContain('credentials: "same-origin"');
    expect(form).toContain("response.status >= 500");
    expect(form).toContain("data-teacher-live-result");
    expect(form).toContain('!fields.get("courseId") && !fields.get("classId")');
  });
});
