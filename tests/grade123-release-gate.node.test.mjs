import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateGrade123Audit } from "../scripts/grade123-release-gate.mjs";

const existingSnapshot = JSON.parse(readFileSync(
  new URL("../data/audits/grades123-22countries-after-four-batches-20261029.json", import.meta.url), "utf8"));

const liveQuality = JSON.parse(readFileSync(
  new URL("../data/audits/grades123-22countries-live-quality-snapshot-20261029.json", import.meta.url), "utf8"));

const registeredCodes = JSON.parse(readFileSync(
  new URL("../data/curriculum-packs/arab-countries.json", import.meta.url), "utf8"
)).countries.map(country => country.code);

const fixture = () => {
  const countries = registeredCodes.map(code => ({
    country_code: code,
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

const qualityFixture = () => ({
  auditDate: new Date().toISOString().slice(0, 10), countries: 22, countryGradeCells: 66,
  total: 66, published: 66, drafts: 0, genericScaffolds: 0, genericQuestionLessons: 0,
  cells: fixture().countries.flatMap(c => c.grades.map(g => ({
    country: c.country_code, grade: g.grade, total: 1, published: 1, drafts: 0,
    genericScaffolds: 0, genericQuestionLessons: 0,
  }))),
});

test("real audit stays blocked and lists all 66 country-grade gaps", () => {
  const result = evaluateGrade123Audit(existingSnapshot, liveQuality);
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
  const result = evaluateGrade123Audit(fixture(), qualityFixture());
  assert.equal(result.ready, true, result.errors.join("\n"));
  assert.deepEqual(result.missing, {
    unpublished: 0, exercises: 0, assessments: 0, skills: 0, structural: 0,
  });
});

test("fake 100 percent by missing review or zero lesson count never passes", () => {
  const missingReview = fixture();
  delete missingReview.countries[0].grades[0].sourceEvidence;
  missingReview.countries[0].grades[0].teacherApproved = false;
  assert.equal(evaluateGrade123Audit(missingReview, qualityFixture()).ready, false);

  const empty = fixture();
  for (const country of empty.countries) {
    for (const grade of country.grades) {
      grade.total = grade.published = grade.after_four_6_to_10 = 0;
      grade.two_assessments = grade.skills = grade.structural_candidates = 0;
    }
  }
  empty.totals = { total: 0, published: 0, drafts: 0, after_four_6_to_10: 0 };
  assert.equal(evaluateGrade123Audit(empty, qualityFixture()).ready, false);
});

test("missing country, inconsistent totals and negative counts fail closed", () => {
  const duplicateCountry = fixture();
  duplicateCountry.countries[1].country_code = duplicateCountry.countries[0].country_code;
  assert.equal(evaluateGrade123Audit(duplicateCountry, qualityFixture()).ready, false);
  const negative = fixture();
  negative.countries[0].grades[0].after_four_6_to_10 = -1;
  assert.equal(evaluateGrade123Audit(negative, qualityFixture()).ready, false);
  const mismatch = fixture();
  mismatch.totals.published = 65;
  assert.equal(evaluateGrade123Audit(mismatch, qualityFixture()).ready, false);
});

test("generic questions, generic scaffolds and stale live checks block false 100%", () => {
  const generic = qualityFixture();
  generic.genericQuestionLessons = 1;
  generic.cells[0].genericQuestionLessons = 1;
  assert.equal(evaluateGrade123Audit(fixture(), generic).ready, false);

  const scaffold = qualityFixture();
  scaffold.genericScaffolds = 1;
  scaffold.cells[0].genericScaffolds = 1;
  assert.equal(evaluateGrade123Audit(fixture(), scaffold).ready, false);

  const stale = qualityFixture();
  stale.auditDate = "2025-01-01";
  assert.equal(evaluateGrade123Audit(fixture(), stale).ready, false);
  assert.equal(evaluateGrade123Audit(fixture()).ready, false);
});

test("invented country codes are never accepted as 22-country coverage", () => {
  const forged = fixture();
  forged.countries[0].country_code = "ZZ";
  const q = qualityFixture();
  q.cells.filter(c => c.country === registeredCodes[0]).forEach(c => { c.country = "ZZ"; });
  assert.equal(evaluateGrade123Audit(forged, q).ready, false);
});

test("every live generic-question and unpublished lesson has a unique review target", () => {
  const queue = JSON.parse(readFileSync(
    new URL("../data/review-queue/grades123-live-specific-lesson-gaps-20261029.json", import.meta.url), "utf8"));
  assert.equal(queue.genericQuestionLessons.length, 196);
  assert.equal(queue.draftLessons.length, 57);
  assert.equal(queue.counts.genericQuestionLessonCount, liveQuality.genericQuestionLessons);
  assert.equal(queue.counts.draftLessonCount, liveQuality.drafts);
  for (const name of ["genericQuestionLessons", "draftLessons"]) {
    const rows = queue[name];
    assert.equal(new Set(rows.map(row => row.lessonId)).size, rows.length);
    for (const row of rows) {
      assert.match(row.lessonId, /^[0-9a-f-]{36}$/i);
      assert.ok(registeredCodes.includes(row.country));
      assert.ok([1, 2, 3].includes(row.grade));
      assert.equal(typeof row.title, "string");
      assert.ok(row.title.trim().length > 1);
      assert.deepEqual(Object.keys(row).filter(k =>
        /answer|student|attempt|token|secret/i.test(k)), []);
    }
  }
  assert.ok(queue.draftLessons.every(row => row.country === "BH"));
});
