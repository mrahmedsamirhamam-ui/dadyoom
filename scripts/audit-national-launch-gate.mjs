import fs from "node:fs";
import path from "node:path";
import { validateCurriculumPack } from "../lib/curriculum-packs/validate.mjs";

const root = process.cwd();
const packDir = path.resolve(root, "data/curriculum-packs");
const mappingDir = path.resolve(root, "data/curriculum-mappings");
const registry = JSON.parse(
  fs.readFileSync(path.join(packDir, "arab-countries.json"), "utf8"),
);
const sources = JSON.parse(
  fs.readFileSync(path.join(packDir, "official-sources-2026.json"), "utf8"),
);

const expected = new Set(
  (registry.countries ?? []).map((row) => String(row.code ?? "").trim()),
);

if (expected.size !== 22) {
  throw new Error(`OFFICIAL_22_GATE_REGISTRY_EXPECTED_22_GOT_${expected.size}`);
}

const sourceByCode = new Map(
  (sources.countries ?? []).map((row) => [String(row.code ?? "").trim(), row]),
);

const packState = new Map();
for (const code of expected) {
  packState.set(code, {
    grades: new Set(),
    verifiedPacks: 0,
    invalidPacks: 0,
  });
}

function walk(dir, prefix = "") {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walk(abs, rel));
    else if (
      entry.name.endsWith(".json") &&
      !["arab-countries.json", "official-sources-2026.json"].includes(entry.name)
    ) out.push({ abs, rel });
  }
  return out;
}

for (const file of walk(packDir)) {
  let pack;
  try {
    pack = JSON.parse(fs.readFileSync(file.abs, "utf8"));
  } catch {
    continue;
  }

  const code = String(pack?.country?.code ?? "").trim();
  if (!packState.has(code)) continue;

  const validation = validateCurriculumPack(pack);
  const state = packState.get(code);

  if (!validation.ok) {
    state.invalidPacks += 1;
    continue;
  }

  if (pack?.rights?.verified !== true) continue;

  const grade = Number(pack?.grade?.number);
  if (Number.isInteger(grade) && grade >= 1 && grade <= 12) {
    state.grades.add(grade);
  }
  state.verifiedPacks += 1;
}

const mappingState = new Map();
for (const code of expected) {
  mappingState.set(code, {
    verifiedGrades: new Set(),
    officialLessons: 0,
    mappedLessons: 0,
    verifiedLessons: 0,
  });
}

if (fs.existsSync(mappingDir)) {
  for (const entry of fs.readdirSync(mappingDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    let mapping;
    try {
      mapping = JSON.parse(
        fs.readFileSync(path.join(mappingDir, entry.name), "utf8"),
      );
    } catch {
      continue;
    }

    const code = String(mapping?.country?.code ?? "").trim();
    if (!mappingState.has(code)) continue;

    const grade = Number(mapping?.grade);
    const officialLessons = Number(mapping?.officialLessons ?? 0);
    const mappedLessons = Number(mapping?.mappedLessons ?? 0);
    const verifiedLessons = Number(mapping?.verifiedLessons ?? 0);
    const status = String(mapping?.status ?? "candidate");

    const state = mappingState.get(code);
    state.officialLessons += officialLessons;
    state.mappedLessons += mappedLessons;
    state.verifiedLessons += verifiedLessons;

    if (
      Number.isInteger(grade) &&
      grade >= 1 &&
      grade <= 12 &&
      status === "verified" &&
      officialLessons > 0 &&
      mappedLessons === officialLessons &&
      verifiedLessons === officialLessons
    ) {
      state.verifiedGrades.add(grade);
    }
  }
}

let readyCountries = 0;
const failures = [];

console.log("=== DADYOOM NATIONAL OFFICIAL 22 LAUNCH GATE ===");

for (const country of registry.countries ?? []) {
  const code = String(country.code ?? "").trim();
  const source = sourceByCode.get(code) ?? {};
  const packs = packState.get(code);
  const mappings = mappingState.get(code);

  const sourceVerified = source.verificationStatus === "verified";
  const matchClosed = ["complete", "current-scope-complete"].includes(
    String(source.matchingStatus ?? ""),
  );
  // National Official Match is closed against the official published
  // and verifiable scope. Legacy curriculum-pack grade coverage is useful
  // diagnostic information, but it is not the source of truth for this gate.
  // The verified mapping layer is the canonical 1-12 coverage signal.
  const twelveMappingGrades =
    mappings.verifiedGrades.size === 12 &&
    [...Array(12)].every((_, i) => mappings.verifiedGrades.has(i + 1));
  const mappingCountsClosed =
    mappings.officialLessons > 0 &&
    mappings.mappedLessons === mappings.officialLessons &&
    mappings.verifiedLessons === mappings.officialLessons;

  const ready =
    sourceVerified &&
    matchClosed &&
    twelveMappingGrades &&
    mappingCountsClosed;

  if (ready) readyCountries += 1;
  else failures.push(code);

  console.log(
    [
      `COUNTRY=${code}`,
      `SOURCE=${source.verificationStatus ?? "missing"}`,
      `MATCH=${source.matchingStatus ?? "missing"}`,
      `PACK_GRADES=${packs.grades.size}/12`,
      `VERIFIED_MAPPING_GRADES=${mappings.verifiedGrades.size}/12`,
      `MAPPED=${mappings.mappedLessons}/${mappings.officialLessons}`,
      `READY=${ready ? "YES" : "NO"}`,
    ].join(" "),
  );
}

console.log(`OFFICIAL_22_READY=${readyCountries}/22`);

if (readyCountries !== 22) {
  console.error(`OFFICIAL_22_GATE=FAIL PENDING=${failures.join(",")}`);
  process.exit(1);
}

console.log("OFFICIAL_22_GATE=PASS");
