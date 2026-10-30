#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Fail closed: no Grades 4–6 curriculum work until all 66 country-grade cells pass. */
export function evaluateGrade123Audit(snapshot, qualitySnapshot) {
  const errors = [];
  const countries = snapshot?.countries ?? [];
  const expectedCodes = new Set(JSON.parse(readFileSync(
    new URL("../data/curriculum-packs/arab-countries.json", import.meta.url), "utf8"
  )).countries.map(country => country.code));
  const actualCodes = new Set(countries.map(c => c.country_code));
  if (countries.length !== 22 || actualCodes.size !== 22 || expectedCodes.size !== 22 ||
      [...expectedCodes].some(code => !actualCodes.has(code))) {
    errors.push("Expected the 22 registered Arab country codes, not arbitrary countries");
  }
  let lessons = 0, published = 0, sufficient = 0, drafts = 0;
  const cells = [];
  const count = (value) => Number.isSafeInteger(value) && value >= 0;
  const qualityCells = Array.isArray(qualitySnapshot?.cells) ? qualitySnapshot.cells : [];
  const qualityByCell = new Map(qualityCells.map(row => [row.country + "/G" + row.grade, row]));
  if (qualityCells.length !== 66 || qualityByCell.size !== 66 ||
      qualitySnapshot?.countries !== 22 || qualitySnapshot?.countryGradeCells !== 66) {
    errors.push("Independent live 66-cell question-quality audit missing or inconsistent");
  }
  const auditAgeDays = (Date.now() - Date.parse((qualitySnapshot?.auditDate ?? "") + "T00:00:00Z")) / 86400000;
  if (!Number.isFinite(auditAgeDays) || auditAgeDays > 7 || auditAgeDays < -1) {
    errors.push("Independent live quality audit missing or older than 7 days");
  }
  // These are evidence requirements, never auto-filled from presence of content.
  const evidenceFlags = ["sourceVerified", "teacherApproved", "audioBrowserVerified", "learnerE2eVerified"];
  for (const country of countries) {
    const grades = country.grades ?? [];
    if (grades.length !== 3 || grades.map(g => g.grade).sort().join(",") !== "1,2,3") {
      errors.push(country.country_code + ": grades 1, 2, 3 are mandatory");
    }
    for (const g of grades) {
      if (!g || ![1, 2, 3].includes(g.grade)) {
        errors.push(country.country_code + ": invalid grade record");
        continue;
      }
      const location = country.country_code + "/G" + g.grade;
      const quality = qualityByCell.get(location);
      if (!quality || ![quality.total, quality.published, quality.drafts,
        quality.genericScaffolds, quality.genericQuestionLessons].every(count) ||
        quality.total !== g.total || quality.published !== g.published || quality.drafts !== g.drafts) {
        errors.push(location + ": live question-quality snapshot missing or mismatched");
      } else {
        if (quality.genericScaffolds > 0) errors.push(location + ": generic lesson scaffold remains");
        if (quality.genericQuestionLessons > 0) errors.push(location + ": generic assessment questions remain");
      }
      const metrics = ["total", "published", "drafts", "two_assessments", "skills", "structural_candidates"];
      if (!metrics.every(key => count(g[key])) ||
          !count(g.after_four_6_to_10 ?? g.after_6_to_10)) {
        errors.push(location + ": absent or invalid numeric coverage");
        continue;
      }
      if (g.total === 0) errors.push(location + ": no real lessons");
      if (g.published > g.total || g.drafts !== g.total - g.published) {
        errors.push(location + ": invalid publication inventory");
      }
      for (const key of ["two_assessments", "skills", "structural_candidates"]) {
        if (g[key] > g.published) errors.push(location + ": " + key + " exceeds published lessons");
      }
      if ((g.after_four_6_to_10 ?? g.after_6_to_10) > g.published) {
        errors.push(location + ": exercise coverage exceeds published lessons");
      }
      const missing = {
        unpublished: g.total - g.published,
        exercises: g.published - (g.after_four_6_to_10 ?? g.after_6_to_10),
        assessments: g.published - g.two_assessments,
        skills: g.published - g.skills,
        structural: g.published - g.structural_candidates,
      };
      const verified = Object.fromEntries(evidenceFlags.map(key => [key, g[key] === true]));
      const sourceScope = g.sourceKind === "official" || g.sourceKind === "general";
      const hasSourceEvidence = typeof g.sourceEvidence === "string" && g.sourceEvidence.trim().length >= 8;
      for (const key of evidenceFlags) {
        if (!verified[key]) errors.push(location + ": " + key + " not verified");
      }
      if (!sourceScope || !hasSourceEvidence) {
        errors.push(location + ": official/general syllabus evidence missing");
      }
      cells.push({ country_code: country.country_code, grade: g.grade,
        total: g.total, published: g.published, missing, verified,
        sourceKind: sourceScope ? g.sourceKind : "unverified",
        sourceEvidencePresent: hasSourceEvidence,
        genericQuestionLessons: quality?.genericQuestionLessons ?? null,
        genericScaffolds: quality?.genericScaffolds ?? null,
        ready: Object.values(missing).every(n => n === 0) &&
          Object.values(verified).every(Boolean) && sourceScope && hasSourceEvidence });
      drafts += g.drafts;
      lessons += g.total || 0;
      published += g.published || 0;
      sufficient += g.after_four_6_to_10 ?? g.after_6_to_10 ?? 0;
      if (g.published !== g.total || g.drafts !== 0) errors.push(location + ": unpublished lessons");
      if ((g.after_four_6_to_10 ?? g.after_6_to_10) !== g.published) errors.push(location + ": incomplete exercises");
      if (g.two_assessments !== g.published) errors.push(location + ": missing assessments");
      if (g.skills !== g.published) errors.push(location + ": missing skill links");
      if (g.structural_candidates !== g.published) errors.push(location + ": structural checks fail");
    }
  }
  if (snapshot?.totals?.total !== lessons || snapshot?.totals?.published !== published ||
      snapshot?.totals?.drafts !== drafts ||
      (snapshot?.totals?.after_four_6_to_10 ?? snapshot?.totals?.after_6_to_10) !== sufficient) errors.push("Aggregate and country counts disagree");
  if (cells.length !== 66 || lessons === 0) errors.push("All 66 nonempty country-grade groups are required");
  if (qualitySnapshot?.total !== lessons || qualitySnapshot?.published !== published ||
      qualitySnapshot?.drafts !== drafts) errors.push("Independent live curriculum inventory disagrees with release audit");
  if (qualitySnapshot?.genericScaffolds !== 0 || qualitySnapshot?.genericQuestionLessons !== 0)
    errors.push("Generic instructional content or assessment questions still present");
  if (snapshot?.curriculumScopeVerified !== true) errors.push("Verified official-or-general syllabus mapping missing");
  if (snapshot?.audioEndToEndVerified !== true) errors.push("Arabic audio browser tests pending");
  if (snapshot?.roleEndToEndVerified !== true) errors.push("Authenticated student and school roles E2E pending");
  if (snapshot?.gradingSecurityVerified !== true) errors.push("Grading keys/security gate pending");
  return { ready: errors.length === 0, errors, lessons, published, drafts, sufficient,
    exerciseCoveragePercent: published ? Number((100 * sufficient / published).toFixed(2)) : 0,
    missing: cells.reduce((sum, c) => Object.fromEntries(
      Object.keys(sum).map(k => [k, sum[k] + c.missing[k]])),
      { unpublished: 0, exercises: 0, assessments: 0, skills: 0, structural: 0 }),
    qualityGaps: { genericQuestionLessons: qualitySnapshot?.genericQuestionLessons ?? null,
      genericScaffolds: qualitySnapshot?.genericScaffolds ?? null },
    cells };

}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf("--audit");
  const source = i >= 0 ? process.argv[i + 1] : "data/audits/grades123-22countries-after-27-bahrain-grade2-nine-prose-lessons-20261030.json";
  if (!source) throw Error("Missing --audit path");
  const qualityIndex = process.argv.indexOf("--quality-audit");
  const qualitySource = qualityIndex >= 0 ? process.argv[qualityIndex + 1] :
    "data/audits/grades123-22countries-after-390-real-mcq-repairs-20261029.json";
  if (!qualitySource || qualitySource.startsWith("--")) throw Error("Missing --quality-audit path");
  const result = evaluateGrade123Audit(
    JSON.parse(readFileSync(resolve(source), "utf8")),
    JSON.parse(readFileSync(resolve(qualitySource), "utf8")));
  const reportIndex = process.argv.indexOf("--report");
  if (reportIndex >= 0) {
    const target = process.argv[reportIndex + 1];
    if (!target || target.startsWith("--")) throw Error("Missing --report path");
    writeFileSync(resolve(target), JSON.stringify({
      generatedFrom: source, independentLiveQualitySource: qualitySource, snapshotDate: JSON.parse(readFileSync(resolve(source), "utf8")).generatedOn ?? null,
      ...result,
    }, null, 2) + "\n");
  }
  console.log(JSON.stringify({ ready: result.ready, errors: result.errors,
    lessons: result.lessons, published: result.published, drafts: result.drafts,
    sufficient: result.sufficient, exerciseCoveragePercent: result.exerciseCoveragePercent,
    missing: result.missing, qualityGaps: result.qualityGaps,
    cellsReviewed: result.cells.length }, null, 2));
  if (!result.ready) { console.error("GATE CLOSED: finish grades 1–3 before grades 4–6."); process.exitCode = 1; }
}
