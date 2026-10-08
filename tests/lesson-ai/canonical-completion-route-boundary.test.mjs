import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(new URL("../../" + path, import.meta.url), "utf8");

describe("canonical completion server action and route boundaries", () => {
  const core = read("features/student-progress/services/complete-lesson-core.ts");
  const action = read("features/student-progress/actions/completeLesson.ts");
  const route = read("app/api/lessons/complete/route.ts");

  it("calls an ordinary shared server module directly from the HTTP API", () => {
    expect(core).not.toMatch(/^"use server"/);
    expect(route).toContain("await completeLessonCore(");
    expect(route).not.toContain("await completeLessonAction(");
    expect(action).toContain('"use server";');
    expect(action).toContain("return completeLessonCore(progressId);");
  });

  it("preserves ownership, graded activity gating, 90% mastery, XP and completion write", () => {
    expect(core).toContain("supabase.auth.getUser()");
    expect(core).toContain('.eq("student_id", user.id)');
    expect(core).toContain("requiredCompletionActivities");
    expect(core).toContain("gradableActivities");
    expect(core).toContain("const REQUIRED_MASTERY_SCORE = 90;");
    expect(core).toContain("getCanonicalTotalXP");
    expect(core).toContain("await completeLesson(");
    expect(core).toContain("after(async () => {");
  });
});
