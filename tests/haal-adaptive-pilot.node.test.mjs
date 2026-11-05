import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ANCHOR, ANCHOR_FORMS, DIAGNOSTIC, HALL_GOAL, PATHS, PATH_LABELS, PATH_CONTENT,
  assessAnchor, assessQuestions, recommendPath, suggestSupport,
} from "../lib/adaptive-goal-paths/haal-pilot.mjs";

test("One common measurable goal, grade seven, and unchanged mastery criteria", () => {
  assert.equal(HALL_GOAL.grade, 7);
  assert.match(HALL_GOAL.objective, /سيستطيع الطالب/);
  assert.equal(HALL_GOAL.mastery.minimumCorrect, 4);
  assert.equal(HALL_GOAL.mastery.questionsPerCheck, 5);
  assert.equal(HALL_GOAL.mastery.spacedChecks, 3);
  assert.equal(ANCHOR.length, 5);
});

test("Each path changes its explanation and support, not the objective or anchor", () => {
  assert.deepEqual(PATHS, ["start", "progress", "challenge"]);
  assert.deepEqual(Object.keys(PATH_CONTENT), [...PATHS]);
  assert.equal(new Set(PATHS.map(path => PATH_CONTENT[path].intro)).size, 3);
  assert.equal(new Set(PATHS.map(path => PATH_CONTENT[path].example)).size, 3);
  for (const path of PATHS) {
    assert.ok(PATH_LABELS[path].startsWith("مسار "));
    assert.equal(PATH_CONTENT[path].hints.length, 3);
    for (const key of ["heading", "intro", "example", "explanation", "practice", "feedback"]) {
      assert.ok(PATH_CONTENT[path][key]?.length > 8, path + "/" + key);
    }
  }
});

test("Diagnostics have four checkable and distinct questions; no fixed student label", () => {
  assert.equal(DIAGNOSTIC.length, 4);
  assert.equal(new Set(DIAGNOSTIC.map(q => q.id)).size, 4);
  for (const question of [...DIAGNOSTIC, ...ANCHOR]) {
    assert.equal(question.choices.length, 3);
    assert.ok(question.choices.some(c => c.id === question.correctId));
    assert.ok(question.why.length > 15);
  }
});

test("Suggested path considers error/hint profile and does not punish slow responses", () => {
  const fast = recommendPath({ correct: 4, total: 4, responseTimesMs: [2000, 2200, 2300, 2100] });
  const slow = recommendPath({ correct: 4, total: 4, responseTimesMs: [75000, 80000, 93000, 66000] });
  assert.equal(fast, "challenge");
  assert.equal(slow, "challenge");
  assert.equal(recommendPath({ correct: 4, total: 4, hintsUsed: 3 }), "start");
  assert.equal(recommendPath({ correct: 3, total: 4, hintsUsed: 0 }), "progress");
  assert.equal(recommendPath({ correct: 1, total: 4 }), "start");
  assert.equal(recommendPath({ correct: 0, total: 0 }), "start");
});

test("Movement requires two consecutive successes or three struggles; never locks a user", () => {
  assert.equal(suggestSupport({ path: "start", consecutiveSuccess: 2 }), "progress");
  assert.equal(suggestSupport({ path: "progress", consecutiveSuccess: 2 }), "challenge");
  assert.equal(suggestSupport({ path: "challenge", consecutiveSuccess: 2 }), "challenge");
  assert.equal(suggestSupport({ path: "challenge", consecutiveStruggles: 3 }), "progress");
  assert.equal(suggestSupport({ path: "progress", consecutiveStruggles: 3 }), "start");
  assert.equal(suggestSupport({ path: "progress", consecutiveStruggles: 2 }), "progress");
});

test("Common anchor uses 4/5 threshold and never claims mastery from one session", () => {
  const right = Object.fromEntries(ANCHOR.map(q => [q.id, q.correctId]));
  const full = assessAnchor(right);
  assert.equal(full.correct, 5);
  assert.equal(full.passedThisCheck, true);
  assert.equal(full.certifiedMastery, false);
  const four = { ...right, [ANCHOR[0].id]: "z" };
  assert.equal(assessAnchor(four).passedThisCheck, true);
  const three = { ...four, [ANCHOR[1].id]: "z" };
  assert.equal(assessAnchor(three).passedThisCheck, false);
  assert.equal(assessQuestions(DIAGNOSTIC, {}).correct, 0);
});

test("Three equivalent independent anchor forms avoid replaying the same test items", () => {
  assert.equal(ANCHOR_FORMS.length, HALL_GOAL.mastery.spacedChecks);
  const ids = new Set();
  const stems = new Set();
  for (const form of ANCHOR_FORMS) {
    assert.equal(form.length, HALL_GOAL.mastery.questionsPerCheck);
    const correct = Object.fromEntries(form.map(q => [q.id, q.correctId]));
    assert.equal(assessAnchor(correct, form).passedThisCheck, true);
    for (const q of form) {
      assert.ok(q.stem.includes("الحال"));
      assert.equal(q.choices.length, 3);
      assert.ok(q.choices.some(choice => choice.id === q.correctId));
      assert.equal(ids.has(q.id), false, q.id);
      assert.equal(stems.has(q.stem), false, q.stem);
      ids.add(q.id);
      stems.add(q.stem);
    }
  }
  assert.equal(ids.size, 15);
  assert.equal(stems.size, 15);
  assert.match(assessAnchor({}, ANCHOR_FORMS[2]).note, /ثلاث جلسات متباعدة/);
});

test("Client pilot shows student choice and explicitly avoids persisted child data", () => {
  const client = readFileSync(new URL("../app/pilot/haal/page.tsx", import.meta.url), "utf8");
  assert.match(client, /choosePath\(item\)/);
  assert.match(client, /finishDiagnostic/);
  assert.match(client, /recommendPath/);
  assert.match(client, /currentAnchor\.map/);
  assert.match(client, /ANCHOR_FORMS/);
  assert.match(client, /aria-pressed/);
  assert.match(client, /dir="rtl"/);
  assert.match(client, /certifiedMastery|الإتقان النهائي|التقدير النهائي/);
  assert.doesNotMatch(client, /localStorage|sessionStorage|fetch\(|createAdminClient|service_role/);
  assert.doesNotMatch(client, /INSERT INTO|UPDATE students|public\.student/);
});
