#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Fail closed: no Grades 4–6 curriculum work until all 66 country-grade cells pass. */
export function evaluateGrade123Audit(snapshot) {
  const errors = [];
  const countries = snapshot?.countries ?? [];
  if (countries.length !== 22 || new Set(countries.map(c => c.country_code)).size !== 22) {
    errors.push("Expected exactly 22 distinct countries");
  }
  let lessons = 0, published = 0, sufficient = 0;
  for (const country of countries) {
    const grades = country.grades ?? [];
    if (grades.length !== 3 || grades.map(g => g.grade).sort().join(",") !== "1,2,3") {
      errors.push(country.country_code + ": grades 1, 2, 3 are mandatory");
    }
    for (const g of grades) {
      lessons += g.total || 0;
      published += g.published || 0;
      sufficient += g.after_6_to_10 || 0;
      const location = country.country_code + "/G" + g.grade;
      if (g.published !== g.total || g.drafts !== 0) errors.push(location + ": unpublished lessons");
      if (g.after_6_to_10 !== g.published) errors.push(location + ": incomplete exercises");
      if (g.two_assessments !== g.published) errors.push(location + ": missing assessments");
      if (g.skills !== g.published) errors.push(location + ": missing skill links");
      if (g.structural_candidates !== g.published) errors.push(location + ": structural checks fail");
    }
  }
  if (snapshot?.totals?.total !== lessons || snapshot?.totals?.published !== published ||
      snapshot?.totals?.after_6_to_10 !== sufficient) errors.push("Aggregate and country counts disagree");
  if (snapshot?.officialCurriculumVerified !== true) errors.push("Official or transparently general syllabus mapping not verified");
  if (snapshot?.audioEndToEndVerified !== true) errors.push("Arabic audio browser tests pending");
  if (snapshot?.roleEndToEndVerified !== true) errors.push("Authenticated student and school roles E2E pending");
  if (snapshot?.gradingSecurityVerified !== true) errors.push("Grading keys/security gate pending");
  return { ready: errors.length === 0, errors, lessons, published, sufficient,
    exerciseCoveragePercent: published ? Number((100 * sufficient / published).toFixed(2)) : 0 };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf("--audit");
  const source = i >= 0 ? process.argv[i + 1] : "data/audits/grades123-22countries-after-two-batches-20261029.json";
  if (!source) throw Error("Missing --audit path");
  const result = evaluateGrade123Audit(JSON.parse(readFileSync(resolve(source), "utf8")));
  console.log(JSON.stringify(result, null, 2));
  if (!result.ready) { console.error("GATE CLOSED: finish grades 1–3 before grades 4–6."); process.exitCode = 1; }
}
