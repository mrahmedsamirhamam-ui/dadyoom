import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const registryPath = path.join(
  root,
  "data/secondary-tracks/arab-22-secondary-tracks-2026-2027.json",
);
const countriesPath = path.join(
  root,
  "data/curriculum-packs/arab-countries.json",
);

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const countries = JSON.parse(fs.readFileSync(countriesPath, "utf8"));

const expected = new Map(
  (countries.countries ?? []).map((country) => [
    String(country.code ?? "").trim(),
    String(country.nameAr ?? "").trim(),
  ]),
);

const rows = Array.isArray(registry.countries)
  ? registry.countries
  : [];

const seen = new Set();
const failures = [];
let trackCount = 0;
let gradeScopedTrackCount = 0;
let nonStandardScopedTrackCount = 0;

for (const row of rows) {
  const code = String(row?.code ?? "").trim();
  const systems = Array.isArray(row?.systems) ? row.systems : [];
  const sources = Array.isArray(row?.sources) ? row.sources : [];

  if (!expected.has(code)) {
    failures.push(`UNKNOWN_COUNTRY=${code || "EMPTY"}`);
    continue;
  }

  if (seen.has(code)) {
    failures.push(`DUPLICATE_COUNTRY=${code}`);
    continue;
  }

  seen.add(code);

  if (systems.length === 0) {
    failures.push(`NO_SECONDARY_SYSTEM=${code}`);
  }

  if (sources.length === 0) {
    failures.push(`NO_SOURCE=${code}`);
  }

  let countryTracks = 0;

  for (const system of systems) {
    const tracks = Array.isArray(system?.tracks) ? system.tracks : [];

    if (tracks.length === 0) {
      failures.push(
        `NO_TRACKS=${code}:${String(system?.nameAr ?? "UNNAMED")}`,
      );
      continue;
    }

    for (const track of tracks) {
      const nameAr = String(track?.nameAr ?? "").trim();

      if (!nameAr) {
        failures.push(`EMPTY_TRACK_NAME=${code}`);
        continue;
      }

      const grades =
        Array.isArray(track?.grades)
          ? track.grades.map(Number)
          : [];

      const nonStandardLevels =
        Array.isArray(track?.nonStandardLevels)
          ? track.nonStandardLevels
              .map((level) => String(level ?? "").trim())
              .filter(Boolean)
          : [];

      if (grades.length === 0) {
        if (
          nonStandardLevels.length > 0 &&
          String(track?.detailStatus ?? "").trim() ===
            "current-detailed-source-nonstandard-levels"
        ) {
          nonStandardScopedTrackCount += 1;
          console.log(
            `NONSTANDARD_LEVEL_SCOPE=${code}:${nameAr}:${nonStandardLevels.join("|")}`,
          );
        } else {
          failures.push(
            `NO_GRADE_SCOPE=${code}:${nameAr}`,
          );
        }
      } else if (
        grades.some(
          (grade) =>
            !Number.isInteger(grade) ||
            grade < 9 ||
            grade > 13,
        )
      ) {
        failures.push(
          `INVALID_GRADE_SCOPE=${code}:${nameAr}:${JSON.stringify(grades)}`,
        );
      } else {
        gradeScopedTrackCount += 1;
      }

      countryTracks += 1;
      trackCount += 1;
    }
  }

  console.log(
    `SECONDARY_TRACK_COUNTRY=${code} SYSTEMS=${systems.length} TRACKS=${countryTracks} LESSON_COVERAGE=${row.lessonCoverage ?? "unknown"}`,
  );
}

for (const code of expected.keys()) {
  if (!seen.has(code)) {
    failures.push(`MISSING_COUNTRY=${code}`);
  }
}

console.log(`SECONDARY_TRACK_COUNTRIES=${seen.size}/${expected.size}`);
console.log(`SECONDARY_TRACKS_REGISTERED=${trackCount}`);
console.log(
  `SECONDARY_TRACKS_GRADE_SCOPED=${gradeScopedTrackCount}/${trackCount}`,
);
console.log(
  `SECONDARY_TRACKS_NONSTANDARD_SCOPED=${nonStandardScopedTrackCount}/${trackCount}`,
);

if (
  seen.size !== expected.size ||
  gradeScopedTrackCount + nonStandardScopedTrackCount !== trackCount ||
  failures.length > 0
) {
  for (const failure of failures) {
    console.error(failure);
  }
  console.error("SECONDARY_TRACK_REGISTRY_GATE=FAIL");
  process.exit(1);
}

console.log("SECONDARY_TRACK_REGISTRY_GATE=PASS");
console.log("SECONDARY_TRACK_GRADE_SCOPE_GATE=PASS");
console.log(
  "SECONDARY_TRACK_LESSON_COMPLETENESS=SEPARATE_GATE_REQUIRED",
);
