import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const registryPath = path.join(
  root,
  "data/secondary-tracks/arab-22-secondary-tracks-2026-2027.json",
);

const registry = JSON.parse(
  fs.readFileSync(registryPath, "utf8"),
);

const countries = Array.isArray(registry.countries)
  ? registry.countries
  : [];

if (countries.length !== 22) {
  throw new Error(
    "STRICT_FULL_COVERAGE_EXPECTED_22_GOT_" + countries.length,
  );
}

const incompletePattern =
  /(partial|generic|awaiting|book-level|semester-1|mixed|national-exam|legacy)/iu;

const explicitCompletePattern =
  /(full-current-official|detailed-current-s1-plus-current-book-s2|verified-full-current|lesson-level-complete)/iu;

const incomplete = [];
const complete = [];

console.log("=== DADYOOM STRICT FULL CURRICULUM COVERAGE AUDIT ===");
console.log(
  "STRICT_MEANING=LESSON_LEVEL_CURRENT_OFFICIAL_COVERAGE_NOT_MINIMUM_SCOPE",
);

for (const country of countries) {
  const code = String(country?.code ?? "").trim();
  const coverage = String(
    country?.lessonCoverage ?? "missing",
  ).trim();

  const hasIncompleteSignal =
    !coverage ||
    coverage === "missing" ||
    incompletePattern.test(coverage);

  const hasExplicitCompleteSignal =
    explicitCompletePattern.test(coverage);

  const isComplete =
    hasExplicitCompleteSignal &&
    !hasIncompleteSignal;

  const row = {
    code,
    coverage,
  };

  if (isComplete) {
    complete.push(row);
  } else {
    incomplete.push(row);
  }

  console.log(
    [
      "COUNTRY=" + code,
      "LESSON_COVERAGE=" + coverage,
      "STRICT_READY=" + (isComplete ? "YES" : "NO"),
    ].join(" "),
  );
}

console.log(
  "STRICT_FULL_COUNTRIES=" + complete.length + "/22",
);

if (incomplete.length > 0) {
  console.error(
    "STRICT_FULL_COVERAGE_GATE=FAIL PENDING=" +
      incomplete.map((row) => row.code).join(","),
  );
  console.error(
    "STRICT_FULL_COVERAGE_NOTE=Do not market pending countries as full lesson-level coverage.",
  );
  process.exit(1);
}

console.log("STRICT_FULL_COVERAGE_GATE=PASS");
