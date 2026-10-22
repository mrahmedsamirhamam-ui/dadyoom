import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
const complete = read("features/student-progress/actions/completeLesson.ts");
const mastery = read("features/lesson-mastery/actions/syncLessonMastery.ts");

describe("lesson activity answer key read is server-private", () => {
  it.each([["completion", complete], ["mastery", mastery]])(
    "%s authorizes published lesson before privileged activity query",
    (_name, s) => {
      const auth = s.indexOf("supabase.auth.getUser()");
      const denyAuth = s.indexOf("if (authError || !user)");
      const lesson = s.indexOf('.from("lessons")');
      const published = s.indexOf('.eq("status", "published")');
      const denyLesson = s.indexOf("if (lessonVisibilityError || !visibleLesson)");
      const admin = s.indexOf("const admin = createAdminClient()");
      const activity = s.indexOf('.from("lesson_activities")');
      expect(auth).toBeGreaterThan(-1);
      expect(denyAuth).toBeGreaterThan(auth);
      expect(lesson).toBeGreaterThan(denyAuth);
      expect(published).toBeGreaterThan(lesson);
      expect(denyLesson).toBeGreaterThan(published);
      expect(admin).toBeGreaterThan(denyLesson);
      expect(activity).toBeGreaterThan(admin);
      expect(s).toMatch(/await admin\s*\.from\("lesson_activities"\)/);
      expect(s).not.toMatch(/await supabase\s*\.from\("lesson_activities"\)/);
    }
  );
  it("completion proves progress ownership before privileged activity keys", () => {
    expect(complete.indexOf("if (!progress)")).toBeGreaterThan(
      complete.indexOf('.eq("student_id", user.id)')
    );
    expect(complete.indexOf("const admin = createAdminClient()")).toBeGreaterThan(
      complete.indexOf("if (!progress)")
    );
  });
  it("the published lesson RPC omits the raw activity answer field", () => {
    const sql = read("supabase/migrations/20261022195032_sanitize_public_get_lesson_page_bundle_answer_keys.sql");
    const source = sql.indexOf("from public.lesson_activities a");
    const projection = sql.slice(sql.lastIndexOf("jsonb_build_object(", source), source);
    expect(source).toBeGreaterThan(-1);
    expect(projection).toContain("'content', a.content");
    expect(projection).not.toMatch(/a\.answer\b/);
    expect(projection).not.toMatch(/['"]answer['"]/);
  });

  it("does not change weighted scoring or identity-scoped attempt reads", () => {
    expect(complete).toContain("scoreGradedActivityAttempts(");
    expect(mastery).toContain("scoreGradedActivityAttempts(");
    expect(complete).toContain('from("lesson_activity_attempts")');
    expect(mastery).toContain('from("lesson_activity_attempts")');
    expect(mastery).toContain('.eq("user_id", user.id)');
    expect(complete).toMatch(/\.eq\(\s*"user_id",\s*user\.id\s*\)/);
  });
});
