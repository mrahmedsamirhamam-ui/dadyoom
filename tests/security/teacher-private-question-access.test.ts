import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const query = read("features/teacher/queries/getLessonQuestions.ts");
const actions = read("features/teacher/actions/manageLessonQuestions.ts");

const actionBody = (name: string) => {
  const start = actions.indexOf("export async function " + name + "(");
  if (start < 0) throw new Error("Missing teacher action: " + name);
  const end = actions.indexOf("export async function ", start + 1);
  return actions.slice(start, end < 0 ? undefined : end);
};

describe("private stored-answer keys remain reserved for verified editors", () => {
  it("the editor read checks signed-in role and teacher lesson ownership before elevating", () => {
    const auth = query.indexOf("supabase.auth.getUser()");
    const role = query.indexOf('role !== "admin" && role !== "teacher"');
    const lesson = query.indexOf('.from("lessons")');
    const owner = query.indexOf('role === "teacher" && lesson.created_by !== user.id');
    const admin = query.indexOf("const admin = createAdminClient()");
    const privateRead = query.indexOf('.from("questions")');
    expect(query).toContain('import "server-only"');
    expect(auth).toBeGreaterThan(-1);
    expect(role).toBeGreaterThan(auth);
    expect(lesson).toBeGreaterThan(role);
    expect(owner).toBeGreaterThan(lesson);
    expect(admin).toBeGreaterThan(owner);
    expect(privateRead).toBeGreaterThan(admin);
    expect(query).toMatch(/await admin\s*\.from\("questions"\)/);
    expect(query).not.toMatch(/await supabase\s*\.from\("questions"\)/);
  });

  it.each([
    "createLessonQuestion",
    "updateLessonQuestion",
    "moveLessonQuestion",
    "deleteLessonQuestion",
  ])("%s verifies ownership before opening the private client", (name) => {
    const source = actionBody(name);
    const owner = source.indexOf("await requireLessonAccess(");
    const privileged = source.indexOf("const admin = createAdminClient()");
    expect(owner).toBeGreaterThan(-1);
    expect(privileged).toBeGreaterThan(owner);
  });

  it("all direct stored-question reads and writes in editor actions are server-only", () => {
    expect(actions).toContain("type AdminSupabaseClient = ReturnType<typeof createAdminClient>");
    expect(actions.match(/await admin\s*\.from\("questions"\)/g)).toHaveLength(4);
    expect(actions).not.toMatch(/await supabase\s*\.from\("questions"\)/);
    expect(actions.match(/requireQuestionInLesson\(\s*admin,/g)).toHaveLength(3);
    expect(actions).toContain('.eq(\n        "lesson_id",\n        lessonId');
  });

  it("keeps move/delete RPCs on authenticated session for database auth.uid checks", () => {
    expect(actionBody("moveLessonQuestion")).toContain("supabase as unknown as SafeRpcClient");
    expect(actionBody("deleteLessonQuestion")).toContain("supabase as unknown as SafeRpcClient");
    expect(actionBody("moveLessonQuestion")).toContain('"move_lesson_question_safe"');
    expect(actionBody("deleteLessonQuestion")).toContain('"delete_lesson_question_safe"');
  });
});
