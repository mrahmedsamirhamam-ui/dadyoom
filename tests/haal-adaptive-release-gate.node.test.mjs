import test from "node:test";
import assert from "node:assert/strict";
import { checkAdaptiveLessonRelease, HALL_PILOT_MANIFEST } from "../lib/adaptive-goal-paths/release-gate.mjs";
import { ANCHOR, ANCHOR_FORMS, HALL_GOAL, PATH_CONTENT } from "../lib/adaptive-goal-paths/haal-pilot.mjs";

test("The grade-seven model is never production-ready by default", () => {
  const status = checkAdaptiveLessonRelease(HALL_PILOT_MANIFEST);
  assert.equal(status.ready, false);
  assert.ok(status.blockers.includes("OFFICIAL_CURRENT_TEXTBOOK_AND_LESSON_EVIDENCE_REQUIRED"));
  assert.ok(status.blockers.includes("THREE_HUMAN_REVIEWS_REQUIRED"));
  assert.ok(status.blockers.includes("SERVER_GRADING_AND_ROLE_ISOLATION_REQUIRED"));
  assert.ok(status.blockers.includes("CONTROLLED_30_STUDENT_TRIAL_REQUIRED"));
});

test("Malformed and undocumented manifests fail closed", () => {
  assert.deepEqual(checkAdaptiveLessonRelease(null).blockers, ["INVALID_MANIFEST"]);
  const bad = checkAdaptiveLessonRelease({ goal: { id: "", objective: "" }, paths: {}, sharedCheck: [] });
  assert.equal(bad.ready, false);
  assert.ok(bad.blockers.includes("MEASURABLE_GOAL_REQUIRED"));
  assert.ok(bad.blockers.includes("THREE_COMPLETE_SUPPORT_PATHS_REQUIRED"));
  assert.ok(bad.blockers.includes("UNIFORM_MASTERY_AT_LEAST_80_PERCENT_3_SPACED_CHECKS"));
});

test("Only a complete evidence record can pass the readiness schema", () => {
  // Synthetic metadata for testing the schema only. Does NOT verify a ministry.
  const fixture = {
    goal: HALL_GOAL,
    scope: { country: "TEST", ministry: "FAKE MINISTRY FOR UNIT TEST", grade: 7, term: 1 },
    source: { status: "verified", edition: "SYNTHETIC TEST ONLY", officialBookUrl: "https://example.invalid/book.pdf", tableOfContentsChecked: true, lessonTextChecked: true },
    paths: PATH_CONTENT,
    sharedChecks: ANCHOR_FORMS,
    reviews: { linguistic: true, pedagogical: true, studentSafety: true },
    trial: { completed: true, participants: 30, controlsReviewed: true },
    security: { authenticatedServerAssessment: true, roleIsolationVerified: true },
  };
  assert.equal(checkAdaptiveLessonRelease(fixture).ready, true);
  assert.equal(checkAdaptiveLessonRelease({ ...fixture, source: { ...fixture.source, lessonTextChecked: false } }).ready, false);
  assert.equal(checkAdaptiveLessonRelease({ ...fixture, reviews: { ...fixture.reviews, pedagogical: false } }).ready, false);
  assert.equal(checkAdaptiveLessonRelease({ ...fixture, goal: { ...fixture.goal, mastery: { minimumCorrect: 3, questionsPerCheck: 5, spacedChecks: 3 } } }).ready, false);
  assert.equal(checkAdaptiveLessonRelease({ ...fixture, sharedChecks: [ANCHOR] }).ready, false);
  assert.equal(checkAdaptiveLessonRelease({ ...fixture, sharedChecks: [ANCHOR, ANCHOR, ANCHOR] }).ready, false);
  assert.equal(checkAdaptiveLessonRelease({ ...fixture, scope: { ...fixture.scope, country: null } }).ready, false);
});

test("Changing a pathway is not a reason to change the common goal or its check", () => {
  const r = checkAdaptiveLessonRelease({
    ...HALL_PILOT_MANIFEST,
    paths: { ...PATH_CONTENT, challenge: { ...PATH_CONTENT.challenge, hints: [] } },
  });
  assert.ok(r.blockers.includes("THREE_COMPLETE_SUPPORT_PATHS_REQUIRED"));
});
