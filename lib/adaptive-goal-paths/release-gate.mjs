/**
 * Fail-closed readiness gate for rolling out adaptive lessons beyond the sample.
 *
 * This gate verifies that required evidence has been RECORDED, not that the
 * evidence is true. An expert must independently validate official books.
 * It does not modify a database or authorize Cloudflare deployment.
 */
import { ANCHOR, HALL_GOAL, PATH_CONTENT, PATHS } from "./haal-pilot.mjs";

export const HALL_PILOT_MANIFEST = Object.freeze({
  goal: HALL_GOAL,
  scope: Object.freeze({ country: null, ministry: null, grade: 7, term: null }),
  source: Object.freeze({
    edition: null,
    officialBookUrl: null,
    status: "unverified",
    tableOfContentsChecked: false,
    lessonTextChecked: false,
  }),
  paths: PATH_CONTENT,
  sharedCheck: ANCHOR,
  reviews: Object.freeze({ linguistic: false, pedagogical: false, studentSafety: false }),
  trial: Object.freeze({ completed: false, participants: 0, controlsReviewed: false }),
  security: Object.freeze({ authenticatedServerAssessment: false, roleIsolationVerified: false }),
});

/**
 * Return a stable list of release blockers; do not accept an unknown manifest
 * as production-ready. A person, not this function, certifies real evidence.
 */
export function checkAdaptiveLessonRelease(manifest) {
  const blockers = [];
  if (!manifest || typeof manifest !== "object") {
    return Object.freeze({ ready: false, blockers: Object.freeze(["INVALID_MANIFEST"]) });
  }

  const goal = manifest.goal;
  if (typeof goal?.id !== "string" || !goal.id.trim() ||
      typeof goal?.objective !== "string" || !goal.objective.trim()) {
    blockers.push("MEASURABLE_GOAL_REQUIRED");
  }
  const mastery = goal?.mastery;
  if (!Number.isInteger(mastery?.questionsPerCheck) || mastery.questionsPerCheck < 5 ||
      !Number.isInteger(mastery?.minimumCorrect) ||
      mastery.minimumCorrect / mastery.questionsPerCheck < 0.8 ||
      !Number.isInteger(mastery?.spacedChecks) || mastery.spacedChecks < 3) {
    blockers.push("UNIFORM_MASTERY_AT_LEAST_80_PERCENT_3_SPACED_CHECKS");
  }

  const paths = manifest.paths;
  if (!paths || typeof paths !== "object" ||
      PATHS.some(path => !paths[path] ||
        ["intro", "example", "explanation", "practice", "hints"].some(key =>
          !paths[path][key] ||
          (key === "hints" && (!Array.isArray(paths[path].hints) || paths[path].hints.length !== 3))))) {
    blockers.push("THREE_COMPLETE_SUPPORT_PATHS_REQUIRED");
  }

  const shared = manifest.sharedCheck;
  if (!Array.isArray(shared) || shared.length !== mastery?.questionsPerCheck ||
      new Set(shared.map(q => q?.id)).size !== shared.length ||
      shared.some(q => !q?.id || !q?.choices?.some(option => option.id === q.correctId))) {
    blockers.push("SAME_VALIDATED_ANCHOR_FOR_ALL_PATHS");
  }

  if (!manifest.scope?.country || !manifest.scope?.ministry ||
      !Number.isInteger(manifest.scope?.grade) || !Number.isInteger(manifest.scope?.term)) {
    blockers.push("COUNTRY_MINISTRY_GRADE_TERM_REQUIRED");
  }

  const source = manifest.source;
  if (!source || source.status !== "verified" ||
      !source.edition || !source.officialBookUrl ||
      source.tableOfContentsChecked !== true || source.lessonTextChecked !== true) {
    blockers.push("OFFICIAL_CURRENT_TEXTBOOK_AND_LESSON_EVIDENCE_REQUIRED");
  }

  if (manifest.reviews?.linguistic !== true || manifest.reviews?.pedagogical !== true ||
      manifest.reviews?.studentSafety !== true) {
    blockers.push("THREE_HUMAN_REVIEWS_REQUIRED");
  }

  if (manifest.trial?.completed !== true ||
      !Number.isInteger(manifest.trial?.participants) || manifest.trial.participants < 30 ||
      manifest.trial.controlsReviewed !== true) {
    blockers.push("CONTROLLED_30_STUDENT_TRIAL_REQUIRED");
  }

  if (manifest.security?.authenticatedServerAssessment !== true ||
      manifest.security?.roleIsolationVerified !== true) {
    blockers.push("SERVER_GRADING_AND_ROLE_ISOLATION_REQUIRED");
  }

  return Object.freeze({ ready: blockers.length === 0, blockers: Object.freeze(blockers) });
}
