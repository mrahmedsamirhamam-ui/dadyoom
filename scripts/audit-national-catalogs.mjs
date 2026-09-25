import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const catalogDir = path.resolve(root, "data/national-catalogs");
const sourceRegistryPath = path.resolve(
  root,
  "data/curriculum-packs/official-sources-2026.json",
);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function isHttps(value) {
  return typeof value === "string" && value.startsWith("https://");
}

const sourceRegistry = readJson(sourceRegistryPath);
const sourceByCountry = new Map(
  (sourceRegistry.countries ?? []).map((row) => [row.code, row]),
);

if (!fs.existsSync(catalogDir)) {
  console.log("NATIONAL_CATALOG_FILES=0");
  console.log("NATIONAL_CATALOG_AUDIT=PASS");
  process.exit(0);
}

const files = fs
  .readdirSync(catalogDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .map((entry) => entry.name)
  .sort();

let failed = false;
let totalGrades = 0;

for (const name of files) {
  const file = path.join(catalogDir, name);
  let catalog;

  try {
    catalog = readJson(file);
  } catch (error) {
    console.error(`NATIONAL_CATALOG_JSON_INVALID=${name}`);
    failed = true;
    continue;
  }

  const code = String(catalog?.country?.code ?? "").trim().toUpperCase();
  const grades = Array.isArray(catalog?.grades) ? catalog.grades : [];
  const authority = catalog?.authority ?? {};
  const registeredSource = sourceByCountry.get(code);

  const sourceVerified =
    ["source-verified", "verified"].includes(
      String(registeredSource?.verificationStatus ?? ""),
    );

  if (!/^[A-Z]{2}$/u.test(code) || !registeredSource || !sourceVerified) {
    console.error(`NATIONAL_CATALOG_COUNTRY_SOURCE_INVALID=${name}:${code || "?"}`);
    failed = true;
  }

  if (!isHttps(authority?.baseUrl)) {
    console.error(`NATIONAL_CATALOG_AUTHORITY_URL_INVALID=${name}`);
    failed = true;
  }

  const seenGrades = new Set();

  for (const row of grades) {
    const grade = Number(row?.grade);

    if (!Number.isInteger(grade) || grade < 1 || grade > 12) {
      console.error(`NATIONAL_CATALOG_GRADE_INVALID=${name}:${String(row?.grade)}`);
      failed = true;
      continue;
    }

    if (seenGrades.has(grade)) {
      console.error(`NATIONAL_CATALOG_GRADE_DUPLICATE=${name}:G${grade}`);
      failed = true;
    }

    seenGrades.add(grade);

    if (!isHttps(row?.catalogUrl)) {
      console.error(`NATIONAL_CATALOG_GRADE_URL_INVALID=${name}:G${grade}`);
      failed = true;
    }

    if (
      row?.arabicMaterialUrl != null &&
      !isHttps(row.arabicMaterialUrl)
    ) {
      console.error(`NATIONAL_CATALOG_ARABIC_URL_INVALID=${name}:G${grade}`);
      failed = true;
    }
  }

  totalGrades += seenGrades.size;

  console.log(
    `NATIONAL_CATALOG=${name} COUNTRY=${code} GRADES=${seenGrades.size}`,
  );
}

console.log(`NATIONAL_CATALOG_FILES=${files.length}`);
console.log(`NATIONAL_CATALOG_GRADES=${totalGrades}`);

if (failed) {
  console.error("NATIONAL_CATALOG_AUDIT=FAIL");
  process.exit(1);
}

console.log("NATIONAL_CATALOG_AUDIT=PASS");
