import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DIAGNOSTIC, ANCHOR_FORMS, PRACTICE_BANK } from "../lib/adaptive-goal-paths/haal-pilot.mjs";
import { HALL_GOAL, PATHS } from "../lib/adaptive-goal-paths/haal-public.mjs";
import {
  getPublicHaalPilotQuestions,
  gradeHaalPilotRequest,
} from "../lib/adaptive-goal-paths/haal-service.mjs";

const answers = questions => Object.fromEntries(questions.map(question => [question.id, question.correctId]));
const submit = (kind, options = {}) => gradeHaalPilotRequest({ goalId: HALL_GOAL.id, kind, ...options });

test("GET bank has all public questions, same objective, ZERO answer keys or explanations", () => {
  const publicBank = getPublicHaalPilotQuestions();
  assert.equal(publicBank.goalId, HALL_GOAL.id);
  assert.equal(publicBank.diagnostic.length, 4);
  assert.equal(publicBank.anchorForms.length, 3);
  assert.equal(publicBank.anchorForms.flat().length, 15);
  for (const path of PATHS) assert.equal(publicBank.practice[path].length, 2);
  for (const item of [...publicBank.diagnostic, ...publicBank.anchorForms.flat(), ...Object.values(publicBank.practice).flat()]) {
    assert.deepEqual(Object.keys(item).sort(), ["choices", "id", "stem"]);
    assert.equal(item.choices.length, 3);
    assert.ok(item.choices.every(choice => Object.keys(choice).sort().join(",") === "id,label"));
  }
  assert.doesNotMatch(JSON.stringify(publicBank), /correctId|errorsByChoice|errorKind|"why"|"explanation"/);
  assert.equal(publicBank.certifiedMasteryAvailable, false);
  assert.equal(publicBank.storage, "none");
});

test("Diagnostic grading returns only score and mistake categories; learners select their pathway", () => {
  const correct = submit("diagnostic", { answers: answers(DIAGNOSTIC) });
  assert.equal(correct.ok, true);
  assert.equal(correct.correct, 4);
  assert.equal(correct.total, 4);
  assert.deepEqual(correct.errorKinds, []);
  assert.equal(correct.recommendationIsBinding, false);
  assert.equal(correct.certifiedMastery, false);
  const wrong = { ...answers(DIAGNOSTIC), d1: "b", d2: "c" };
  const mismatch = submit("diagnostic", { answers: wrong });
  assert.deepEqual(mismatch.errorKinds, ["role_reversal", "verb_as_haal"]);
  assert.doesNotMatch(JSON.stringify(mismatch), /correctId|"why"|"explanation"/);
});

test("Practice check requires specific route path and question ID and no account writes", () => {
  for (const path of PATHS) {
    const q = PRACTICE_BANK[path][0];
    const result = submit("practice", { path, questionId: q.id, answers: { [q.id]: q.correctId } });
    assert.equal(result.ok, true);
    assert.equal(result.correct, true);
    assert.ok(result.explanation.length > 5);
    assert.equal(result.certifiedMastery, false);
  }
  const wrong = submit("practice", { path: "start", questionId: "s1", answers: { s1: "b" } });
  assert.equal(wrong.correct, false);
  assert.equal(wrong.explanation, null);
});

test("Common 4/5 criterion holds across three forms without claims of final mastery", () => {
  for (let formIndex = 0; formIndex < ANCHOR_FORMS.length; formIndex++) {
    const form = ANCHOR_FORMS[formIndex];
    const allRight = submit("anchor", { formIndex, answers: answers(form) });
    assert.equal(allRight.ok, true);
    assert.equal(allRight.correct, 5);
    assert.equal(allRight.passedThisCheck, true);
    assert.equal(allRight.certifiedMastery, false);
    assert.equal(allRight.feedback.length, 5);
    assert.ok(allRight.feedback.every(row => row.correct));
    const mostlyRight = { ...answers(form), [form[0].id]: form[0].choices.find(c => c.id !== form[0].correctId).id };
    assert.equal(submit("anchor", { formIndex, answers: mostlyRight }).passedThisCheck, true);
    mostlyRight[form[1].id] = form[1].choices.find(c => c.id !== form[1].correctId).id;
    assert.equal(submit("anchor", { formIndex, answers: mostlyRight }).passedThisCheck, false);
  }
});

test("Reject malformed, extra, forged, incomplete, and invalid submissions", () => {
  for (const payload of [null, [], {}, { goalId: "other", kind: "anchor" }]) {
    assert.equal(gradeHaalPilotRequest(payload).ok, false);
  }
  assert.equal(submit("diagnostic", { answers: { d1: "a" } }).status, 400);
  assert.equal(submit("diagnostic", { answers: { ...answers(DIAGNOSTIC), injected: "b" } }).status, 400);
  assert.equal(submit("diagnostic", { answers: { ...answers(DIAGNOSTIC), d1: "not-an-option" } }).status, 400);
  assert.equal(submit("diagnostic", { answers: answers(DIAGNOSTIC), path: "start" }).status, 400);
  assert.equal(submit("anchor", { formIndex: "0", answers: answers(ANCHOR_FORMS[0]) }).status, 400);
  assert.equal(submit("anchor", { formIndex: 999, answers: answers(ANCHOR_FORMS[0]) }).status, 400);
  assert.equal(submit("anchor", { formIndex: 0, answers: answers(ANCHOR_FORMS[1]) }).status, 400);
  assert.equal(submit("practice", { path: "challenge", questionId: "s1", answers: { s1: "a" } }).status, 400);
});

test("Route is server only, no-store, same-origin scoped, bounded and never writes student progress", () => {
  const route = readFileSync(new URL("../app/api/pilot/haal/route.ts", import.meta.url), "utf8");
  const client = readFileSync(new URL("../app/pilot/haal/page.tsx", import.meta.url), "utf8");
  const service = readFileSync(new URL("../lib/adaptive-goal-paths/haal-service.mjs", import.meta.url), "utf8");
  const publicModule = readFileSync(new URL("../lib/adaptive-goal-paths/haal-public.mjs", import.meta.url), "utf8");
  assert.match(route, /import "server-only"/);
  assert.match(route, /no-store, private/);
  assert.match(route, /CROSS_ORIGIN_BLOCKED/);
  assert.match(route, /PAYLOAD_TOO_LARGE/);
  assert.doesNotMatch(route, /createClient|createAdminClient|supabase\.|INSERT INTO|service_role/);
  assert.doesNotMatch(client, /correctId|\\.why|\\/haal-pilot\.mjs|\\/haal-service\.mjs/);
  assert.doesNotMatch(publicModule, /correctId|\\.why|\\/haal-pilot\.mjs|\\/haal-service\.mjs/);
  assert.match(service, /NEVER import it from "use client" files/);
  assert.match(client, /fetch\("\/api\/pilot\/haal"/);
});
