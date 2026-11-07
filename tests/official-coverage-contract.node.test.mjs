import test from "node:test";
import assert from "node:assert/strict";
import { evaluateOfficialTopicCoverage, summarizeOfficialCoverage } from "../lib/curriculum/official-coverage-contract.mjs";

const topic = { id: "bh-g1-t1" };
const evidence = {
  topicId: topic.id,
  lessonId: "lesson-1",
  lessonPublished: true,
  lessonContentReviewed: true,
  officialSourceUrl: "https://example.edu/official-index",
  officialSourceVersion: "2026-2027",
  reviewStatus: "approved",
  reviewedBy: "editor-1",
  reviewedAt: "2026-11-07T00:00:00Z",
};

test("a missing official topic is not covered", () => {
  assert.equal(evaluateOfficialTopicCoverage(topic).status, "missing");
});

test("published lessons alone do not prove ministry alignment", () => {
  assert.equal(evaluateOfficialTopicCoverage(topic, [{ topicId: topic.id, lessonId: "lesson-1", lessonPublished: true }]).status, "unverified");
});

test("verified coverage requires official source, editorial review and published lesson", () => {
  assert.equal(evaluateOfficialTopicCoverage(topic, [evidence]).status, "verified");
  assert.equal(evaluateOfficialTopicCoverage(topic, [{ ...evidence, officialSourceUrl: "" }]).status, "unverified");
  assert.equal(evaluateOfficialTopicCoverage(topic, [{ ...evidence, lessonContentReviewed: false }]).status, "unverified");
});

test("unknown official topic inventory must not be represented as 100%", () => {
  assert.equal(summarizeOfficialCoverage([]).verifiedPercent, null);
});

test("coverage counts distinct official topics, not number of lessons", () => {
  const report = summarizeOfficialCoverage([topic, { id: "bh-g1-t2" }], [evidence, { ...evidence, lessonId: "lesson-2" }]);
  assert.equal(report.totalOfficialTopics, 2);
  assert.equal(report.verified, 1);
  assert.equal(report.missing, 1);
  assert.equal(report.verifiedPercent, 50);
});
