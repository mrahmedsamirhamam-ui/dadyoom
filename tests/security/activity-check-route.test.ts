import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { preserveGradedLessonProgress } from "../../lib/lesson-activities/progress-state";

const source = readFileSync(
  resolve(process.cwd(), "app/api/lesson-activities/check/route.ts"), "utf8"
);

describe("student activity grading authorization", () => {
  it("checks RLS activity and published lesson before trusted answer access", () => {
    const auth = source.indexOf("supabase.auth.getUser()");
    const visibleActivity = source.indexOf('.from("lesson_activities")');
    const safeSelect = source.indexOf('.select("id,lesson_id")');
    const lesson = source.indexOf('.from("lessons")');
    const checkPublished = source.indexOf('visibleLesson.status !== "published"');
    const admin = source.indexOf("const admin = createAdminClient()");
    const privateRead = source.indexOf('.from("lesson_activities")', admin);
    expect(source).toContain('import "server-only"');
    expect(auth).toBeGreaterThan(-1);
    expect(visibleActivity).toBeGreaterThan(auth);
    expect(safeSelect).toBeGreaterThan(visibleActivity);
    expect(lesson).toBeGreaterThan(safeSelect);
    expect(checkPublished).toBeGreaterThan(lesson);
    expect(admin).toBeGreaterThan(checkPublished);
    expect(privateRead).toBeGreaterThan(admin);
    expect(source).toContain('.eq("id", visibleActivity.id)');
    expect(source).toContain('.eq("lesson_id", visibleActivity.lesson_id)');
    expect(source).toContain('answer,points,is_published');
  });

  it("uses private server client for lesson-wide answer specs", () => {
    const at = source.indexOf("كل أنشطة الدرس");
    const remainder = source.slice(at);
    expect(at).toBeGreaterThan(-1);
    expect(remainder).toMatch(/await admin\s*\.from\(\s*"lesson_activities"\s*\)/);
    expect(remainder).not.toMatch(/await supabase\s*\.from\(\s*"lesson_activities"\s*\)/);
    const returned = source.slice(source.indexOf("return NextResponse.json({", at));
    expect(returned).not.toContain("correctSpec:");
    expect(returned).not.toContain("answerData:");
    expect(returned).not.toContain("correct_answer:");
  });

  it("preserves completion when a student repeats an activity", () => {
    expect(preserveGradedLessonProgress(
      { status: "completed", progress_percent: 100 }, 30
    )).toEqual({ status: "completed", progress_percent: 100 });
    expect(preserveGradedLessonProgress(
      { status: "mastered", progress_percent: 90 }, 25
    )).toEqual({ status: "mastered", progress_percent: 90 });
    expect(preserveGradedLessonProgress(
      { status: "mastered", progress_percent: 95 }, 100
    )).toEqual({ status: "mastered", progress_percent: 100 });
  });

  it("keeps new/in-progress completion bounded to 0–100", () => {
    expect(preserveGradedLessonProgress(null, 35))
      .toEqual({ status: "in_progress", progress_percent: 35 });
    expect(preserveGradedLessonProgress(null, 300))
      .toEqual({ status: "in_progress", progress_percent: 100 });
    expect(preserveGradedLessonProgress(null, -10))
      .toEqual({ status: "in_progress", progress_percent: 0 });
  });

  it("persists attempts and progress via trusted server after scoring", () => {
    const admin = source.indexOf("const admin = createAdminClient()");
    const attempts = source.indexOf('"lesson_activity_attempts"');
    const attemptWrite = source.indexOf(".insert(", attempts);
    const progressUpdate = source.indexOf(".update(", source.indexOf('"student_lesson_progress"'));
    expect(admin).toBeGreaterThan(-1);
    expect(attemptWrite).toBeGreaterThan(admin);
    expect(progressUpdate).toBeGreaterThan(attemptWrite);
    expect(source).toMatch(/await admin\s*\.from\(\s*"lesson_activity_attempts"\s*\)\s*\.insert/);
    expect(source).toMatch(/await admin\s*\.from\(\s*"student_lesson_progress"\s*\)\s*\.update/);
    expect(source).toMatch(/await admin\s*\.from\(\s*"student_lesson_progress"\s*\)\s*\.insert/);
    expect(source).toContain('.eq("student_id", user.id)');
    expect(source).toContain('.eq("lesson_id", activity.lesson_id)');
    expect(source).toContain("user_id:");
    expect(source).toContain("user.id");
  });

  it("saves derived status and percent rather than resetting completed lessons", () => {
    expect(source).toContain("preserveGradedLessonProgress(");
    expect(source).toContain("status: safeProgress.status");
    expect(source).toContain("progress_percent: safeProgress.progress_percent");
    expect(source).not.toMatch(/status:\s*"in_progress"/);
    expect(source).toContain('"id,best_score,attempts,status,progress_percent"');
    expect(source).toContain("user.id");
  });
});
