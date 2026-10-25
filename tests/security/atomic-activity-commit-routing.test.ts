import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("opt-in atomic activity grade and progress receipt", () => {
  const route = read("app/api/lesson-activities/check/route.ts");
  const candidate = read("scripts/security/proposed-atomic-activity-commit.sql");
  const verify = read("tests/security/shadow-atomic-activity-verify.sql");

  it("defaults to legacy server-authorized writes until staged RPC is deployed", () => {
    expect(route).toContain(
      'process.env.DADYOOM_ATOMIC_ACTIVITY_COMMIT === "enabled"'
    );
    expect(route).toContain("if (!atomicReceiptReady)");
    expect(route).toContain("nextAttemptNumber = await insertSequencedActivityAttempt({");
    expect(route).toContain("if (atomicReceiptReady) {");
    expect(route).toContain("} else {");
    expect(route).toContain("await commitActivityProgressWithRetry({");
  });

  it("does not insert an attempt before the transaction when enabled", () => {
    const preinsert = route.indexOf("if (!atomicReceiptReady)");
    const attemptWrite = route.indexOf('from("lesson_activity_attempts")', preinsert);
    const endOfLegacy = route.indexOf("// كل أنشطة الدرس", attemptWrite);
    const pending = route.indexOf("const attempts = atomicReceiptReady");
    const score = route.indexOf("const currentScore = scoreGradedActivityAttempts(");
    const rpc = route.indexOf('"dadyoom_commit_activity_attempt"');
    const fallback = route.indexOf("await commitActivityProgressWithRetry({",rpc);
    expect(attemptWrite).toBeGreaterThan(preinsert);
    expect(endOfLegacy).toBeGreaterThan(attemptWrite);
    expect(pending).toBeGreaterThan(endOfLegacy);
    expect(score).toBeGreaterThan(pending);
    expect(rpc).toBeGreaterThan(score);
    expect(fallback).toBeGreaterThan(rpc);
  });

  it("restricts database RPC invocation to trusted service role and fails on missing receipt", () => {
    expect(route).toContain("p_student_id: user.id");
    expect(route).toContain("p_lesson_id: activity.lesson_id");
    expect(route).toContain("p_activity_id: activityId");
    expect(route).toContain("p_selected_answer: studentAnswer");
    expect(route).toContain("p_earned_points: earnedPoints");
    expect(route).toContain("p_lesson_score: currentScore");
    expect(route).toContain("if (commitError || !receipt)");
    expect(route).toContain("Number(receipt.saved_attempt_number)");
    expect(candidate).toContain("PRODUCTION_ATOMIC_ACTIVITY_COMMIT_BLOCKED");
    expect(candidate).toContain("SECURITY INVOKER");
    expect(candidate).toContain("TO service_role");
    expect(candidate).toContain("FROM PUBLIC, anon, authenticated");
    expect(candidate).toContain("ON CONFLICT (student_id, lesson_id) DO UPDATE");
    expect(candidate).toContain("attempts = public.student_lesson_progress.attempts + 1");
  });

  it("ensures real disposable PostgreSQL checks rollback after failed progress", () => {
    expect(verify).toContain("SHADOW_ATOMIC_FAILED_PROGRESS_ROLLED_BACK_ATTEMPT=PASS");
    expect(verify).toContain("SHADOW_ATOMIC_BROWSER_EXECUTE_DENIED=PASS");
    expect(verify).toContain("ATOMIC_ATTEMPT_LEFT_BEHIND_AFTER_FAILED_PROGRESS");
    const workflow = read(".github/workflows/curriculum-coverage-ci.yml");
    expect(workflow).toContain("tests/security/shadow-atomic-activity-setup.sql");
    expect(workflow).toContain("tests/security/shadow-atomic-activity-verify.sql");
    expect(workflow).toContain("tests/security/atomic-activity-commit-routing.test.ts");
  });
});
