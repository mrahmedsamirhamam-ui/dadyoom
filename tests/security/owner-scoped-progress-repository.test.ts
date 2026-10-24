import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
const read = (p: string) => readFileSync(resolve(process.cwd(),p),"utf8");
const repo = read("features/student-progress/repositories/progress.repository.ts");
const complete = read("features/student-progress/services/progress.ts");

describe("owned progress writes have server-only authority", () => {
  it("refuses foreign progress ownership before creating a privileged writer", () => {
    expect(repo).toContain('import "server-only"');
    expect(repo).toContain("supabase.auth.getUser()");
    expect(repo).toContain("data.student_id !== user.id");
    expect(repo).toContain('.eq("student_id", user.id)');
    expect(repo).toContain('if (!progress)');
    expect(repo).toContain('if (!lesson)');
    expect(repo).toContain('.eq("status", "published")');
    expect(repo).not.toMatch(/return supabase\s*\.from\("student_lesson_progress"\)\s*\.(?:insert|update)/);
  });
  it("uses caller RLS before any admin writer", () => {
    const authorizer = repo.indexOf("async function requireStudentSession()");
    const firstAdmin = repo.indexOf("const admin = createAdminClient()");
    const ownCreate = repo.indexOf("data.student_id !== user.id");
    const publishedCreate = repo.indexOf("لا يمكن بدء درس غير منشور.");
    const progressOwn = repo.indexOf("سجل تقدم الدرس غير متاح.");
    const secondAdmin = repo.indexOf("const admin = createAdminClient()",firstAdmin+1);
    expect(authorizer).toBeGreaterThan(-1);
    expect(firstAdmin).toBeGreaterThan(publishedCreate);
    expect(publishedCreate).toBeGreaterThan(ownCreate);
    expect(secondAdmin).toBeGreaterThan(progressOwn);
    expect(repo.match(/const admin = createAdminClient\(\)/g)).toHaveLength(2);
  });
  it("prevents reassignment by allowing only canonical completion fields", () => {
    expect(repo).toContain("const permitted = new Set([");
    expect(repo).toContain("!permitted.has(key)");
    expect(repo).toContain('.eq("id", progress.id)');
    expect(repo).toContain('.eq("lesson_id", lesson.id)');
    expect(repo).toContain("student_id: user.id");
    expect(repo).toContain("lesson_id: lesson.id");
  });
  it("requires >=90% real assessment at the service completion boundary", () => {
    expect(complete).toContain("score < 90");
    expect(complete).toContain("score > 100");
    expect(complete.indexOf("score < 90")).toBeLessThan(complete.indexOf("updateLessonProgress("));
  });
});
