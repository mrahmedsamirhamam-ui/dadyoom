import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { scoreGradedActivityAttempts } from "../../features/lesson-mastery/services/score-graded-activities";

const activities = [
  { id: "a", points: 5 },
  { id: "b", points: 15 },
];

describe("consistent, graded, weighted mastery", () => {
  it("uses the published point weights, not number of correct activities", () => {
    const x = scoreGradedActivityAttempts(activities, [
      { activity_id: "a", earned_points: 5, is_correct: true, attempt_number: 1 },
      { activity_id: "b", earned_points: 0, is_correct: false, attempt_number: 1 },
    ]);
    expect(x).toMatchObject({
      askedQuestions: 2, answeredQuestions: 2, correctAnswers: 1,
      wrongAnswers: 1, totalPossible: 20, totalEarned: 5, score: 25,
    });
  });

  it("keeps the best graded attempt rather than a worse later retry", () => {
    const x = scoreGradedActivityAttempts([{ id: "a", points: 5 }], [
      { activity_id: "a", earned_points: 5, is_correct: true, attempt_number: 1 },
      { activity_id: "a", earned_points: 0, is_correct: false, attempt_number: 2 },
    ]);
    expect(x.score).toBe(100);
    expect(x.correctAnswers).toBe(1);
    expect(x.answeredQuestions).toBe(1);
  });

  it("does not accept forged points above a published activity's maximum", () => {
    const x = scoreGradedActivityAttempts([{ id: "a", points: 5 }], [
      { activity_id: "a", earned_points: 5000, is_correct: true, attempt_number: 1 },
      { activity_id: "unknown", earned_points: 15, is_correct: true },
    ]);
    expect(x.totalEarned).toBe(5);
    expect(x.score).toBe(100);
    expect(x.answeredQuestions).toBe(1);
  });

  it("clamps historical earned points after the teacher reduces an activity weight", () => {
    const currentWeights = [{ id: "a", points: 5 }, { id: "b", points: 5 }];
    const olderAttempts = [
      { activity_id: "a", earned_points: 20, is_correct: true, attempt_number: 1 },
      { activity_id: "b", earned_points: 0, is_correct: false, attempt_number: 1 },
    ];
    const score = scoreGradedActivityAttempts(currentWeights, olderAttempts);
    expect(score).toMatchObject({ totalPossible: 10, totalEarned: 5, score: 50 });

    const activityRoute = readFileSync(
      resolve(process.cwd(), "app/api/lesson-activities/check/route.ts"), "utf8"
    );
    expect(activityRoute).toContain("scoreGradedActivityAttempts(");
    expect(activityRoute).toContain("points: item.points");
    expect(activityRoute).not.toContain("bestEarnedByActivity");
    expect(activityRoute).not.toContain("totalEarned /");
  });

  it("leaves unanswered activities unearned, and gives zero without scored points", () => {
    const x = scoreGradedActivityAttempts(activities, [
      { activity_id: "a", earned_points: 5, is_correct: true },
    ]);
    expect(x).toMatchObject({
      askedQuestions: 2, answeredQuestions: 1, totalEarned: 5, score: 25,
    });
    expect(scoreGradedActivityAttempts(
      [{ id: "completion-only", points: 0 }],
      [{ activity_id: "completion-only", earned_points: 0, is_correct: true }]
    ).score).toBe(0);
  });

  it("uses one shared scoring rule in both canonical completion and reporting", () => {
    const complete = readFileSync(
      resolve(process.cwd(), "features/student-progress/actions/completeLesson.ts"), "utf8"
    );
    const mastery = readFileSync(
      resolve(process.cwd(), "features/lesson-mastery/actions/syncLessonMastery.ts"), "utf8"
    );
    expect(complete).toContain("scoreGradedActivityAttempts(");
    expect(mastery).toContain("scoreGradedActivityAttempts(");
    expect(complete).toContain("requirePositiveAssessmentPoints(graded.totalPossible)");
    expect(mastery).toContain('select("id,answer,is_required,points", { count: "exact" })');
    expect(mastery).toContain('select("id,activity_id,earned_points,is_correct,attempt_number"');
    expect(complete).toContain('.from("dadyoom_student_questions")');
    expect(mastery).toContain('.from("dadyoom_student_questions")');
  });
});
