import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { preserveGradedLessonProgress } from "../../lib/lesson-activities/progress-state";
import { parseStudentActivityAnswer } from "../../lib/lesson-activities/grading";

const source = readFileSync(
  resolve(process.cwd(), "app/api/lesson-activities/check/route.ts"), "utf8"
);

describe("student activity grading authorization", () => {
  it("accepts and normalizes legitimate Arabic, ordered and matching answers", () => {
    expect(parseStudentActivityAnswer(["  رمان  ", "طاووس", ""])).toEqual(["رمان", "طاووس"]);
    expect(parseStudentActivityAnswer(["باب|||مفتاح", "قمر|||ليل"])).toEqual([
      "باب|||مفتاح", "قمر|||ليل",
    ]);
    expect(parseStudentActivityAnswer(undefined)).toEqual([]);
    expect(parseStudentActivityAnswer([])).toEqual([]);
  });

  it("rejects mixed JSON types, oversized arrays, huge text and NUL characters", () => {
    for (const bad of [
      null, {}, "رمان", [1, "رمان"], ["صحيح", false],
      Array(65).fill("أ"), ["أ".repeat(4097)],
      Array(5).fill("ب".repeat(4096)), ["صحيح\u0000مزيف"],
    ]) {
      expect(parseStudentActivityAnswer(bad)).toBeNull();
    }
  });

  it("shares strict bounded JSON validation with question grading", () => {
    expect(source).toContain('import { readBoundedJsonObject } from "@/lib/http/read-bounded-json"');
    expect(source).toContain("await readBoundedJsonObject(request)");
    const parsed = source.indexOf("await readBoundedJsonObject(request)");
    const auth = source.indexOf("supabase.auth.getUser()");
    expect(parsed).toBeGreaterThan(-1);
    expect(auth).toBeGreaterThan(parsed);
    expect(source).toContain("parseStudentActivityAnswer(body.answer)");
    expect(source).toContain("status: parsed.status");
    expect(source).not.toContain("request.json()");
    expect(source).not.toContain("JSON.parse(rawBody)");
  });

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
    expect(source).toMatch(/await admin\s*\.from\(\s*"student_lesson_progress"\s*\)\s*\.upsert/);
    expect(source).toContain('.eq("student_id", user.id)');
    expect(source).toContain('.eq("lesson_id", activity.lesson_id)');
    expect(source).toContain("user_id:");
    expect(source).toContain("user.id");
  });

  it("checks owned CAS results instead of silently accepting zero updated rows", () => {
    const from = source.indexOf("await commitActivityProgressWithRetry({");
    const updateAt = source.indexOf("update: async (previous, values) => {", from);
    const updateCode = source.slice(updateAt, source.indexOf("insert: async (values)", updateAt));
    expect(from).toBeGreaterThan(-1);
    expect(updateAt).toBeGreaterThan(from);
    expect(updateCode).toContain('.eq("status", previous.status)');
    expect(updateCode).toContain('.eq("attempts", previous.attempts)');
    expect(updateCode).toContain('.lte("best_score", values.best_score)');
    expect(updateCode).toContain('.lte("progress_percent", values.progress_percent)');
    expect(updateCode).toContain('.eq("student_id", user.id)');
    expect(updateCode).toContain('.eq("lesson_id", activity.lesson_id)');
    expect(updateCode).toContain('.select("id")');
    expect(updateCode).toContain(".maybeSingle()");
    expect(updateCode).toContain("return data !== null");
    expect(source).toContain("ignoreDuplicates: true");
    expect(source).toContain('onConflict: "student_id,lesson_id"');
    expect(source).toContain('Number(storedProgress.best_score ?? 0)');
    expect(source).toContain('Number(storedProgress.progress_percent ?? 0)');
  });

  it("retries from fresh owner-scoped progress while preserving graded completion", () => {
    expect(source).toContain("commitActivityProgressWithRetry({");
    expect(source).toContain("initial: existingProgress");
    expect(source).toContain("score: currentScore");
    expect(source).toContain("activityPercent: progressPercent");
    expect(source).toContain("read: async () =>");
    expect(source).toContain('.select("id,status,attempts,best_score,progress_percent")');
    expect(source).toContain('return data;');
    expect(source).not.toMatch(/status:\\s*"in_progress"/);
    expect(source).toContain('"id,best_score,attempts,status,progress_percent"');
  });

});
