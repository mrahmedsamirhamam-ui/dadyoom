import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ASSESSMENT_TOOLS,
  HALL_RUBRIC,
  STRATEGY_CARDS,
  createFictionalClass,
  buildTeacherGoalOverview,
  MISTAKE_LABELS,
} from "../lib/adaptive-goal-paths/teacher-overview.mjs";
import { assessQuestions, DIAGNOSTIC, HALL_GOAL } from "../lib/adaptive-goal-paths/haal-pilot.mjs";

test("Educator library has distinct 12 strategies and 9 assessment tools with no empty guidance", () => {
  assert.equal(STRATEGY_CARDS.length, 12);
  assert.equal(ASSESSMENT_TOOLS.length, 9);
  for (const rows of [STRATEGY_CARDS, ASSESSMENT_TOOLS]) {
    assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
  }
  for (const strategy of STRATEGY_CARDS) {
    for (const key of ["title", "fit", "action", "pitfall"]) {
      assert.ok(strategy[key].length > 6, strategy.id + ":" + key);
    }
  }
  assert.equal(HALL_RUBRIC.goalId, HALL_GOAL.id);
  assert.equal(HALL_RUBRIC.criteria.length, 2);
  for (const row of HALL_RUBRIC.criteria) {
    assert.equal(row.levels.length, 3, row.id);
    assert.equal(new Set(row.levels).size, 3);
  }
});

test("Fictional teacher overview aggregates exactly 30 learners without returning individual records", () => {
  const records = createFictionalClass();
  assert.equal(records.length, 30);
  const overview = buildTeacherGoalOverview(records);
  assert.equal(overview.total, 30);
  assert.equal(overview.paths.reduce((sum, row) => sum + row.count, 0), 30);
  assert.equal(overview.checkPasses + overview.supportInvites, 30);
  assert.equal(overview.unverified, 30);
  assert.equal(overview.certifiedMasteryCount, null);
  assert.equal(overview.illustrativeOnly, true);
  assert.ok(overview.misconceptions.every(row => row.count > 0 && MISTAKE_LABELS[row.kind]));
  assert.ok(overview.averageHints >= 0);
  assert.doesNotMatch(JSON.stringify(overview), /"name"|"studentId"|"email"|"phone"|"dateOfBirth"|"student_id"/);
  for (const row of records) {
    assert.deepEqual(Object.keys(row).sort(), ["anchorCorrect", "goalId", "hintsUsed", "misconception", "selectedPath", "verified"].sort());
    assert.equal(row.verified, false);
  }
});

test("Teacher aggregation is per learning objective, not fixed per student", () => {
  const one = createFictionalClass(3);
  const overview = buildTeacherGoalOverview([...one, {
    goalId: "another-goal",
    selectedPath: "start", anchorCorrect: 0, hintsUsed: 9, misconception: "grammar", verified: true,
  }]);
  assert.equal(overview.total, 3);
  assert.equal(buildTeacherGoalOverview([]).total, 0);
  assert.equal(buildTeacherGoalOverview([]).averageHints, 0);
});

test("Unrecognized or invalid aggregate records fail closed; no class rank exposure", () => {
  assert.throws(() => buildTeacherGoalOverview([{ goalId: HALL_GOAL.id, selectedPath: "secret", anchorCorrect: 5, hintsUsed: 0, misconception: null, verified: false }]), /Invalid/);
  assert.throws(() => buildTeacherGoalOverview([{ goalId: HALL_GOAL.id, selectedPath: "start", anchorCorrect: 8, hintsUsed: 0, misconception: null, verified: false }]), /Invalid/);
  assert.throws(() => buildTeacherGoalOverview([{ goalId: HALL_GOAL.id, selectedPath: "start", anchorCorrect: 1, hintsUsed: 0, misconception: "untrusted", verified: false }]), /Unknown/);
  assert.throws(() => createFictionalClass(101), RangeError);
});

test("Diagnostic errors distinguish reversing roles from confusing verb with the ḥāl", () => {
  const q = DIAGNOSTIC[0];
  assert.equal(q.correctId, "a");
  assert.equal(assessQuestions([q], { [q.id]: "b" }).rows[0].errorKind, "role_reversal");
  assert.equal(assessQuestions([q], { [q.id]: "c" }).rows[0].errorKind, "verb_as_haal");
  assert.equal(assessQuestions([q], { [q.id]: "a" }).rows[0].errorKind, null);
  assert.equal(assessQuestions([q], {}).rows[0].errorKind, null);
});

test("Teacher pilot is explicitly fictional and has no production data integration", () => {
  const source = readFileSync(new URL("../app/pilot/haal/teacher/page.tsx", import.meta.url), "utf8");
  assert.match(source, /بيانات افتراضية بالكامل/);
  assert.match(source, /createFictionalClass\(30\)/);
  assert.match(source, /robots: \{ index: false, follow: false \}/);
  assert.match(source, /dir="rtl"/);
  assert.doesNotMatch(source, /createClient|createAdminClient|fetch\(|supabase\.|service_role|student_id/);
  const learner = readFileSync(new URL("../app/pilot/haal/page.tsx", import.meta.url), "utf8");
  assert.match(learner, /diagnosticHints/);
  assert.match(learner, /hintsUsed: Object\.values\(diagnosticHints\)/);
  assert.match(learner, /\/pilot\/haal\/teacher/);
  assert.doesNotMatch(learner, /localStorage|sessionStorage|createAdminClient/);
});
