import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const run = () => JSON.parse(execFileSync(process.execPath, [
  "scripts/audit-primary-official-source-readiness.mjs", "--json",
], { encoding: "utf8" }));

test("The 22-country primary audit has 132 planning slots with NO fabricated official coverage", () => {
  const report = run();
  assert.equal(report.scope.registeredCountries, 22);
  assert.deepEqual(report.scope.grades, [1, 2, 3]);
  assert.deepEqual(report.scope.semesters, [1, 2]);
  assert.equal(report.scope.planningSlots, 132);
  assert.equal(report.slots.length, 132);
  assert.equal(new Set(report.slots.map(s => s.countryCode + ":" + s.grade + ":" + s.semester)).size, 132);
  assert.equal(report.claims.officialTextbookTocMatch, "NOT_VERIFIED");
  assert.equal(report.claims.productionDatabase, "NOT_CHECKED");
  assert.equal(report.summary.officialLessonCoveragePercent, null);
  assert.ok(report.slots.every(s => s.officialLessonsExpected === null &&
    s.officialLessonsMatched === null && s.officialCoveragePercent === null));
});

test("Never treat rights.verified, registered country or a local pack as a verified ministry book match", () => {
  const report = run();
  const registry = JSON.parse(readFileSync("data/curriculum-packs/arab-countries.json", "utf8"));
  const bahrainRegistry = registry.countries.find(c => c.code === "BH");
  assert.equal(bahrainRegistry.contentStatus, "published");
  const first = report.slots.find(s => s.countryCode === "BH" && s.grade === 1 && s.semester === 1);
  assert.ok(first);
  assert.ok(first.localPackCount >= 1);
  assert.ok(first.localLessonRows >= 18);
  const pack = JSON.parse(readFileSync("data/curriculum-packs/bh-2026-arabic-primary-g1-s1.json", "utf8"));
  assert.equal(pack.rights.verified, true);
  // Present baseline: there are unlinked lessons, so status cannot imply
  // actual official-topic verification or 100% textbook coverage.
  if (!first.localLessonRowsWithSourceUrl && !first.packs.some(p => p.topLevelSourceLink)) {
    assert.equal(first.status, "PACK_WITHOUT_OFFICIAL_EVIDENCE_LINKS");
  }
  assert.equal(first.officialCoveragePercent, null);
  assert.ok(report.officialGuidesForBahrain.every(s => s.includes("edunet.bh")));
});

test("Audit separates book-link candidates from per-lesson official references", () => {
  const report = run();
  const slotsWithSources = report.slots.filter(s => s.sourceCandidates.length > 0);
  assert.ok(slotsWithSources.some(s => s.countryCode === "BH" && s.grade === 1 && s.semester === 1));
  assert.ok(slotsWithSources.some(s => s.countryCode === "BH" && s.grade === 2 && s.semester === 1));
  assert.ok(slotsWithSources.some(s => s.countryCode === "BH" && s.grade === 3 && s.semester === 1));
  assert.equal(report.summary.totalPackLessonRows,
    report.summary.localPackLessonRowsWithSourceUrl + report.summary.localPackLessonRowsWithoutSourceUrl);
  assert.equal(report.summary.localPlanningSlotsWithPack + report.summary.localPlanningSlotsWithoutPack,
    report.scope.planningSlots);
  assert.ok(report.slots.every(s => !/VERIFIED_100_PERCENT|OFFICIAL_COMPLETE/.test(s.status)));
});

test("Human-oriented console summary states that production and official source match were NOT checked", () => {
  const output = execFileSync(process.execPath, [
    "scripts/audit-primary-official-source-readiness.mjs",
  ], { encoding: "utf8" });
  assert.match(output, /REGISTERED_COUNTRIES=22/);
  assert.match(output, /OFFICIAL_TOC_MATCH=NOT_VERIFIED/);
  assert.match(output, /PRODUCTION_COVERAGE=NOT_CHECKED/);
  assert.match(output, /BAHRAIN_G1_S1=/);
});
