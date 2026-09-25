import fs from "node:fs";
import path from "node:path";
import { validateCurriculumPack } from "../lib/curriculum-packs/validate.mjs";

const root = process.cwd();
const dir = path.resolve(root, "data/curriculum-packs");
const sourcePath = path.join(dir, "official-sources-2026.json");
const registryPath = path.join(dir, "arab-countries.json");

const sources = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

const expectedCodes = new Set(
  (registry.countries ?? []).map((country) => String(country.code ?? "").trim()),
);

if (expectedCodes.size !== 22) {
  throw new Error(`NATIONAL_OFFICIAL_REGISTRY_EXPECTED_22_GOT_${expectedCodes.size}`);
}

const sourceRows = Array.isArray(sources.countries) ? sources.countries : [];
const sourceByCode = new Map(sourceRows.map((row) => [row.code, row]));

if (
  sourceRows.length !== 22 ||
  sourceRows.some((row) => !expectedCodes.has(row.code))
) {
  throw new Error("NATIONAL_OFFICIAL_SOURCE_REGISTRY_MISMATCH");
}

const excluded = new Set(["arab-countries.json", "official-sources-2026.json"]);
const packFiles = [];

function collect(current, prefix = "") {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const abs = path.join(current, entry.name);

    if (entry.isDirectory()) {
      collect(abs, rel);
      continue;
    }

    if (entry.name.endsWith(".json") && !excluded.has(entry.name)) {
      packFiles.push(rel);
    }
  }
}

collect(dir);
packFiles.sort();

const byCountry = new Map();

function countryState(code) {
  if (!byCountry.has(code)) {
    byCountry.set(code, {
      packs: 0,
      verifiedPacks: 0,
      lessons: 0,
      grades: new Set(),
      semestersByGrade: new Map(),
      invalid: [],
    });
  }
  return byCountry.get(code);
}

for (const rel of packFiles) {
  let pack;
  try {
    pack = JSON.parse(fs.readFileSync(path.join(dir, rel), "utf8"));
  } catch (error) {
    console.error(`OFFICIAL_PACK_JSON_INVALID=${rel}`);
    process.exitCode = 1;
    continue;
  }

  const code = String(pack?.country?.code ?? "").trim();
  if (!expectedCodes.has(code)) continue;

  const state = countryState(code);
  state.packs += 1;

  const validation = validateCurriculumPack(pack);
  if (!validation.ok) {
    state.invalid.push(rel);
    continue;
  }

  if (pack?.rights?.verified !== true) {
    continue;
  }

  state.verifiedPacks += 1;

  const grade = Number(pack?.grade?.number);
  if (Number.isInteger(grade) && grade >= 1 && grade <= 12) {
    state.grades.add(grade);

    if (!state.semestersByGrade.has(grade)) {
      state.semestersByGrade.set(grade, new Set());
    }

    const semester =
      pack.semester === null || pack.semester === undefined
        ? "all"
        : String(pack.semester);

    state.semestersByGrade.get(grade).add(semester);
  }

  for (const unit of pack.units ?? []) {
    state.lessons += Array.isArray(unit?.lessons) ? unit.lessons.length : 0;
  }
}

let completeCountries = 0;
let sourceVerifiedCountries = 0;

console.log("=== NATIONAL OFFICIAL MATCH AUDIT ===");

for (const country of registry.countries ?? []) {
  const code = country.code;
  const source = sourceByCode.get(code) ?? {};
  const state = countryState(code);

  const matchingStatus = String(source.matchingStatus ?? "not-closed");
  const verificationStatus = String(source.verificationStatus ?? "candidate");

  if (verificationStatus === "source-verified" || verificationStatus === "verified") {
    sourceVerifiedCountries += 1;
  }

  const gradeCount = state.grades.size;
  const explicitComplete = matchingStatus === "complete";
  const explicitVerified = verificationStatus === "verified";

  /*
   * Dadyoom's national layer targets grades 1-12. A country cannot be marked
   * complete merely because one or several official packs exist.
   */
  const coverageComplete =
    gradeCount === 12 &&
    [...Array(12)].every((_, index) => state.grades.has(index + 1));

  const ready =
    explicitComplete &&
    explicitVerified &&
    coverageComplete &&
    state.verifiedPacks > 0 &&
    state.invalid.length === 0;

  if (explicitComplete && !ready) {
    console.error(
      `NATIONAL_OFFICIAL_FALSE_COMPLETE=${code} STATUS=${matchingStatus} VERIFY=${verificationStatus} GRADES=${gradeCount} VERIFIED_PACKS=${state.verifiedPacks} INVALID=${state.invalid.length}`,
    );
    process.exitCode = 1;
  }

  if (ready) completeCountries += 1;

  console.log(
    [
      `COUNTRY=${code}`,
      `MATCH=${matchingStatus}`,
      `SOURCE=${verificationStatus}`,
      `PACKS=${state.packs}`,
      `VERIFIED_PACKS=${state.verifiedPacks}`,
      `GRADES=${gradeCount}/12`,
      `LESSONS=${state.lessons}`,
      `READY=${ready ? "YES" : "NO"}`,
    ].join(" "),
  );
}

console.log(`NATIONAL_OFFICIAL_SOURCE_VERIFIED=${sourceVerifiedCountries}/22`);
console.log(`NATIONAL_OFFICIAL_COMPLETE=${completeCountries}/22`);

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("NATIONAL_OFFICIAL_MATCH_AUDIT=PASS");
