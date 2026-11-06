import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseTrustedAnswerInput } from "../../lib/security/answer-payload.mjs";

const qid = "7a9724ea-1b30-4b59-bb19-48c02d1d2bd4";
const read = path => readFileSync(new URL("../../" + path, import.meta.url), "utf8");

test("Only an authenticated user's question ID and chosen option may cross the API boundary", () => {
  assert.deepEqual(parseTrustedAnswerInput({ questionId: qid, selectedAnswer: "a" }),
    { ok: true, questionId: qid, selectedAnswer: "a" });
});

test("Untrusted identity, grade, XP and keys are rejected rather than silently ignored", () => {
  for (const field of ["user_id", "userId", "studentId", "student_email", "is_correct",
    "isCorrect", "best_score", "score", "xp", "points", "correctAnswer",
    "correct_answer", "modelAnswer", "lessonId", "role"]) {
    assert.equal(parseTrustedAnswerInput({ questionId: qid, selectedAnswer: "a", [field]: 100 }).ok, false, field);
  }
});

test("Invalid request shapes fail closed", () => {
  for (const data of [null, [], {}, {questionId: qid}, {selectedAnswer: "a"},
    {questionId: "123", selectedAnswer: "a"},
    {questionId: qid, selectedAnswer: 1},
    {questionId: qid, selectedAnswer: ""}, {questionId: qid, selectedAnswer: "x".repeat(257)}]) {
    assert.equal(parseTrustedAnswerInput(data).ok, false, JSON.stringify(data)?.slice(0,100));
  }
});

test("Server verifies user, reads its own answer key and writes its OWN correctness", () => {
  const route = read("app/api/questions/answer/route.ts");
  assert.match(route, /auth\.getUser\(\)/);
  assert.match(route, /parseTrustedAnswerInput/);
  assert.match(route, /createAdminClient\(\)/);
  assert.match(route, /question\.correct_answer/);
  assert.match(route, /gradeStoredMcq\(/);
  assert.match(route, /is_correct: grade\.isCorrect/);
  assert.match(route, /user_id: user\.id/);
  assert.match(route, /lesson\.status !== "published"/);
  assert.match(route, /selected_answer: parsed\.selectedAnswer/);
  assert.doesNotMatch(route, /raw\?\.isCorrect|raw\?\.score|raw\?\.userId/);
});

test("Direct PostgREST access remains a separate stop-ship blocker until staging RLS tests", () => {
  const source = read("docs/security/STAGING_ONLY_PROFILE_ROLE_GUARD_ISSUE_117.sql");
  assert.match(source, /STAGING CANDIDATE ONLY/);
});
