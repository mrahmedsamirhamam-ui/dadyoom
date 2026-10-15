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
  /^(full-current-official|verified-full-current|lesson-level-complete)$/iu;

// Claims and imported counts cannot certify a country's books. Require
// a separately reviewed, edition-specific source and 1:1 TOC evidence for
// every scope listed by the reviewer, including objectives and assessment.
function independentBookEvidenceValid(country) {
  const evidence = country?.independentOfficialBookEvidence;
  if (!evidence || evidence.academicYear !== registry.academicYear ||
      evidence.reviewState !== "approved" ||
      typeof evidence.reviewedBy !== "string" || !evidence.reviewedBy.trim() ||
      !Number.isInteger(evidence.expectedBookScopes) || evidence.expectedBookScopes < 1 ||
      !Array.isArray(evidence.books) ||
      evidence.books.length !== evidence.expectedBookScopes) return false;

  const scopeKeys = new Set();
  for (const book of evidence.books) {
    if (typeof book.scopeKey !== "string" || !book.scopeKey.trim() ||
        scopeKeys.has(book.scopeKey) ||
        !/^https:\/\//u.test(String(book.officialBookUrl ?? "")) ||
        !/^[0-9a-f]{64}$/iu.test(String(book.sourceSha256 ?? "")) ||
        typeof book.edition !== "string" || !book.edition.trim() ||
        typeof book.reviewedBy !== "string" || !book.reviewedBy.trim() ||
        !Array.isArray(book.items) || book.items.length === 0) return false;
    scopeKeys.add(book.scopeKey);
    const lessonIds = new Set();
    for (const item of book.items) {
      if (typeof item.title !== "string" || !item.title.trim() ||
          !Number.isInteger(item.page) || item.page < 1 ||
          !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/iu.test(String(item.lessonId ?? "")) ||
          lessonIds.has(item.lessonId) ||
          item.textReviewed !== true || item.objectivesReviewed !== true ||
          item.assessmentReviewed !== true ||
          typeof item.reviewedBy !== "string" || !item.reviewedBy.trim()) return false;
      lessonIds.add(item.lessonId);
    }
  }
  return true;
}

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

  const bookEvidenceValid = independentBookEvidenceValid(country);
  const isComplete =
    hasExplicitCompleteSignal &&
    !hasIncompleteSignal &&
    bookEvidenceValid;

  const row = {
    code,
    coverage,
    independentlyReviewedBooks: bookEvidenceValid,
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
