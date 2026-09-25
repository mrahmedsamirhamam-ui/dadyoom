import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const expected = [
  "AE","BH","DJ","DZ","EG","IQ","JO","KM","KW","LB",
  "LY","MA","MR","OM","PS","QA","SA","SD","SO","SY","TN","YE",
];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.resolve(root, rel), "utf8"));
}

function gate(condition, message) {
  if (!condition) throw new Error(message);
}

function exactCodes(rows, label) {
  const codes = rows.map((row) => String(row.code || "").toUpperCase()).sort();
  gate(codes.length === 22, `${label}_EXPECTED_22_GOT_${codes.length}`);
  gate(new Set(codes).size === 22, `${label}_DUPLICATE_CODES`);
  gate(
    JSON.stringify(codes) === JSON.stringify([...expected].sort()),
    `${label}_COUNTRY_SET_MISMATCH`,
  );
}

const coverage = readJson("data/curriculum-full20/closure-22/country-coverage.json");
const registry = readJson("data/curriculum-packs/arab-countries.json");
const sourceCatalog = readJson("data/curriculum-packs/official-sources-2026.json");

gate(Array.isArray(coverage.countries), "COVERAGE_COUNTRIES_MISSING");
gate(Array.isArray(registry.countries), "REGISTRY_COUNTRIES_MISSING");
gate(Array.isArray(sourceCatalog.countries), "SOURCE_COUNTRIES_MISSING");

exactCodes(coverage.countries, "COVERAGE");
exactCodes(registry.countries, "REGISTRY");
exactCodes(sourceCatalog.countries, "SOURCES");

const registryBy = new Map(registry.countries.map((row) => [row.code, row]));
const sourcesBy = new Map(sourceCatalog.countries.map((row) => [row.code, row]));

let coreLive = 0;
let nationalComplete = 0;

for (const row of coverage.countries) {
  const code = row.code;
  const reg = registryBy.get(code);
  const source = sourcesBy.get(code);

  gate(reg, `REGISTRY_ROW_MISSING:${code}`);
  gate(source, `SOURCE_ROW_MISSING:${code}`);

  gate(
    row.core?.status === "LIVE" &&
      row.core?.academicYear === "2026-2027" &&
      Number(row.core?.grades) === 12 &&
      Number(row.core?.lessons) === 216 &&
      row.core?.originalDadyoomContent === true,
    `CORE_COVERAGE_INVALID:${code}`,
  );

  gate(
    reg.coreStatus === "published" &&
      reg.coreAcademicYear === "2026-2027" &&
      Number(reg.coreGrades) === 12 &&
      Number(reg.coreLessons) === 216,
    `CORE_REGISTRY_INVALID:${code}`,
  );

  coreLive += 1;

  gate(
    Array.isArray(row.national?.evidenceSources) &&
      row.national.evidenceSources.length >= 1,
    `NATIONAL_SOURCE_MISSING:${code}`,
  );

  gate(
    Array.isArray(source.sources) && source.sources.length >= 1,
    `SOURCE_CATALOG_EMPTY:${code}`,
  );

  if (row.national?.complete === true) {
    nationalComplete += 1;

    gate(
      row.national.matchingStatus === "complete",
      `FALSE_NATIONAL_COMPLETE_STATUS:${code}`,
    );
    gate(
      row.national.verificationStatus === "verified",
      `FALSE_NATIONAL_COMPLETE_VERIFICATION:${code}`,
    );
    gate(
      Array.isArray(row.national.missingEvidence) &&
        row.national.missingEvidence.length === 0,
      `FALSE_NATIONAL_COMPLETE_GAPS:${code}`,
    );
  } else {
    gate(
      row.publicationReadiness === "CORE_LIVE_NATIONAL_MATCH_PENDING",
      `PARTIAL_PUBLICATION_STATUS_INVALID:${code}`,
    );
    gate(
      Array.isArray(row.national?.missingEvidence) &&
        row.national.missingEvidence.length > 0,
      `FAIL_CLOSED_GAPS_NOT_RECORDED:${code}`,
    );
  }
}

gate(coreLive === 22, `CORE_22_GATE_FAILED:${coreLive}`);

console.log("CURRICULUM_COUNTRY_SET=22");
console.log(`CORE_COUNTRIES_LIVE=${coreLive}/22`);
console.log(`NATIONAL_OFFICIAL_COMPLETE=${nationalComplete}/22`);
console.log("CURRICULUM_FALSE_COMPLETE_CLAIMS=0");
console.log("CURRICULUM_VERIFIER=PASS");
console.log(
  nationalComplete === 22
    ? "NATIONAL_OFFICIAL_22_GATE=PASS"
    : "NATIONAL_OFFICIAL_22_GATE=NOT_CLOSED_FAIL_CLOSED",
);
