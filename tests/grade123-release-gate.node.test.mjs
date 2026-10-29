import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateGrade123Audit } from "../scripts/grade123-release-gate.mjs";

const existingSnapshot = JSON.parse(readFileSync(
  new URL("../data/audits/grades123-22countries-after-four-batches-20261029.json", import.meta.url), "utf8"));

const fixture = () => {
  const countries = Array.from({ length: 22 }, (_, index) => ({
    country_code: String.fromCharCode(65 + Math.floor(index / 26), 65 + index % 26),
    grades: [1, 2, 3].map(grade => ({
      grade, total: 1, published: 1, drafts: 0, after_four_6_to_10: 1,
      two_assessments: 1, skills: 1, structural_candidates: 1,
      sourceVerified: true, teacherApproved: true,
      audioBrowserVerified: true, learnerE2eVerified: true,
      sourceKind: "general", sourceEvidence: "fixture-only-evidence",
    })),
  }));
  return { generatedOn: "test-fixture", countries,
    totals: { total: 66, published: 66, drafts: 0, after_four_6_to_10: 66 },
    curriculumScopeVerified: true, audioEndToEndVerified: true,
    roleEndToEndVerified: true, gradingSecurityVerified: true };
};

test("real audit stays blocked and lists all 66 country-grade gaps", () => {
  const result = evaluateGrade123Audit(existingSnapshot);
  assert.equal(result.ready, false);
  assert.equal(result.cells.length, 66);
  assert.equal(result.lessons, 1803);
  assert.equal(result.published, 1746);
  assert.equal(result.drafts, 57);
  assert.equal(result.missing.exercises, 1374);
  assert.equal(result.missing.unpublished, 57);
  assert.ok(result.errors.some(e => e.includes("sourceVerified")));
});

test("a complete, independently evidenced 66-cell fixture is eligible", () => {
  const result = evaluateGrade123Audit(fixture());
  assert.equal(result.ready, true, result.errors.join("\n"));
  assert.deepEqual(result.missing, {
    unpublished: 0, exercises: 0, assessments: 0, skills: 0, structural: 0,
  });
});

test("fake 100 percent by missing review or zero lesson count never passes", () => {
  const missingReview = fixture();
  delete missingReview.countries[0].grades[0].sourceEvidence;
  missingReview.countries[0].grades[0].teacherApproved = false;
  assert.equal(evaluateGrade123Audit(missingReview).ready, false);

  const empty = fixture();
  for (const country of empty.countries) {
    for (const grade of country.grades) {
      grade.total = grade.published = grade.after_four_6_to_10 = 0;
      grade.two_assessments = grade.skills = grade.structural_candidates = 0;
    }
  }
  empty.totals = { total: 0, published: 0, drafts: 0, after_four_6_to_10: 0 };
  assert.equal(evaluateGrade123Audit(empty).ready, false);
});

test("missing country, inconsistent totals and negative counts fail closed", () => {
  const duplicateCountry = fixture();
  duplicateCountry.countries[1].country_code = duplicateCountry.countries[0].country_code;
  assert.equal(evaluateGrade123Audit(duplicateCountry).ready, false);
  const negative = fixture();
  negative.countries[0].grades[0].after_four_6_to_10 = -1;
  assert.equal(evaluateGrade123Audit(negative).ready, false);
  const mismatch = fixture();
  mismatch.totals.published = 65;
  assert.equal(evaluateGrade123Audit(mismatch).ready, false);
});
