import fs from "node:fs";
import path from "node:path";
import { independentTocValidation } from "./lib/independent-toc-evidence.mjs";

const file = path.resolve(
  process.cwd(),
  "data/curriculum-completeness/bahrain-book-completeness-2026-2027.json",
);
const report = JSON.parse(fs.readFileSync(file, "utf8"));
const rows = Array.isArray(report.books) ? report.books : [];

const allowed = new Set([
  "COMPLETE_BOOK",
  "PARTIAL_BOOK",
  "BOOK_FOUND_PENDING_TOC",
  "OFFICIAL_BOOK_NOT_FOUND",
]);

const failures = [];

if (report?.country?.code !== "BH") {
  failures.push("COUNTRY_MUST_BE_BH");
}
if (report?.academicYear !== "2026-2027") {
  failures.push("ACADEMIC_YEAR_MUST_BE_2026_2027");
}
if (rows.length === 0) {
  failures.push("BOOK_ROWS_EMPTY");
}

const keys = new Set();

for (const [index, row] of rows.entries()) {
  const status = String(row.status ?? "");
  if (!allowed.has(status)) {
    failures.push(`ROW_${index}_INVALID_STATUS_${status}`);
  }

  const term = Number(row.semesterOrBookPart);
  if (![1, 2, 3].includes(term)) {
    failures.push(`ROW_${index}_INVALID_TERM`);
  }

  for (const field of [
    "scheduledItems",
    "unscheduledOfficialBookItems",
    "importedItems",
  ]) {
    const value = Number(row[field]);
    if (!Number.isInteger(value) || value < 0) {
      failures.push(`ROW_${index}_INVALID_${field}`);
    }
  }

  if (row.currentPlanPublished === false && Number(row.scheduledItems) !== 0) {
    failures.push(`ROW_${index}_UNPUBLISHED_TERM_HAS_SCHEDULED_ITEMS`);
  }

  const key = [
    row.program ?? "",
    row.track ?? "",
    row.grade ?? "",
    row.level ?? "",
    row.semesterOrBookPart ?? "",
  ].join("|");

  if (keys.has(key)) {
    failures.push(`DUPLICATE_SCOPE_${key}`);
  }
  keys.add(key);

  const total = row.bookTotalTOCItems;
  const imported = Number(row.importedItems);
  const missing = row.missingItems;

  if (total !== null && total !== undefined) {
    if (!Number.isInteger(Number(total)) || Number(total) < 0) {
      failures.push(`ROW_${index}_INVALID_BOOK_TOTAL`);
    } else {
      // Match count, NOT raw imported lessons, determines TOC coverage.
      // One book entry can map to a differently subdivided lesson tree.
      const matched = row.matchedTOCItems;
      if (!Number.isInteger(matched) || matched < 0 || matched > Number(total)) {
        failures.push(`ROW_${index}_INVALID_MATCHED_TOC_COUNT`);
      } else if (missing !== Number(total) - matched) {
        failures.push(`ROW_${index}_MISSING_COUNT_MISMATCH`);
      }
    }
  } else if (missing !== null || row.matchedTOCItems !== undefined) {
    failures.push(`ROW_${index}_MISSING_MUST_BE_NULL_WITHOUT_TOC`);
  }

  if (status === "COMPLETE_BOOK") {
    if (
      row.sourceVerified !== true ||
      !Number.isInteger(Number(total)) ||
      Number(total) !== row.matchedTOCItems ||
      missing !== 0 ||
      !independentTocValidation(row, report.academicYear).valid
    ) {
      failures.push(`ROW_${index}_FALSE_COMPLETE_BOOK`);
    }
  }
}

function requireScope(predicate, label) {
  if (!rows.some(predicate)) failures.push("MISSING_SCOPE_" + label);
}

for (let grade = 1; grade <= 9; grade += 1) {
  for (const term of [1, 2]) {
    requireScope(
      row =>
        row.program === "التعليم الأساسي" &&
        Number(row.grade) === grade &&
        Number(row.semesterOrBookPart) === term,
      `BASIC_G${grade}_S${term}`,
    );
  }
}

for (const term of [1, 2]) {
  requireScope(
    row =>
      row.program === "برنامج السنوات المتوسطة MYP" &&
      Number(row.grade) === 8 &&
      Number(row.semesterOrBookPart) === term,
    `MYP_G8_S${term}`,
  );
}

const tracks = [
  "توحيد المسارات",
  "التعليم الفني والمهني",
  "التعليم الديني",
  "المسار الإداري والتكنولوجي - الهندسي",
];

for (const track of tracks) {
  for (const grade of [10, 11, 12]) {
    for (const term of [1, 2]) {
      requireScope(
        row =>
          row.program === "الثانوي العام/النوعي" &&
          row.track === track &&
          Number(row.grade) === grade &&
          Number(row.semesterOrBookPart) === term,
        `${track}_G${grade}_S${term}`,
      );
    }
  }
}

for (const level of [
  "الأول محو الأمية",
  "الثاني محو الأمية",
  "الأول متابعة",
  "الثاني متابعة",
  "الأول تقوية",
  "الثاني تقوية",
]) {
  for (const term of [1, 2]) {
    requireScope(
      row =>
        row.program === "التعليم المستمر" &&
        row.track === "التعليم المستمر" &&
        row.level === level &&
        row.grade === null &&
        Number(row.semesterOrBookPart) === term,
      `CONTINUING_${level}_S${term}`,
    );
  }
}

const counts = Object.fromEntries(
  [...allowed].map(status => [
    status,
    rows.filter(row => row.status === status).length,
  ]),
);
const calculatedComplete =
  rows.length > 0 && rows.every(row => row.status === "COMPLETE_BOOK");

if (Number(report?.summary?.auditRows) !== rows.length) {
  failures.push("SUMMARY_AUDIT_ROWS_MISMATCH");
}
if (Number(report?.summary?.completeBooks) !== counts.COMPLETE_BOOK) {
  failures.push("SUMMARY_COMPLETE_MISMATCH");
}
if (Number(report?.summary?.partialBooks) !== counts.PARTIAL_BOOK) {
  failures.push("SUMMARY_PARTIAL_MISMATCH");
}
if (
  Number(report?.summary?.bookFoundPendingToc) !==
  counts.BOOK_FOUND_PENDING_TOC
) {
  failures.push("SUMMARY_PENDING_TOC_MISMATCH");
}
if (
  Number(report?.summary?.officialBookNotFound) !==
  counts.OFFICIAL_BOOK_NOT_FOUND
) {
  failures.push("SUMMARY_NOT_FOUND_MISMATCH");
}
if (Boolean(report?.summary?.bahrainComplete) !== calculatedComplete) {
  failures.push("SUMMARY_BAHRAIN_COMPLETE_MISMATCH");
}

console.log("=== BAHRAIN BOOK COMPLETENESS TRUTH GATE ===");
console.log("ROWS=" + rows.length);
for (const status of allowed) {
  console.log(status + "=" + counts[status]);
}
console.log(
  "BAHRAIN_BOOKS_COMPLETE=" + (calculatedComplete ? "YES" : "NO"),
);
console.log(
  "NOTE=PASS means the audit is internally truthful; it does not mean every book is complete.",
);

if (failures.length > 0) {
  console.error(
    "BAHRAIN_BOOK_AUDIT=FAIL " + failures.join(","),
  );
  process.exit(1);
}

console.log("BAHRAIN_BOOK_AUDIT=PASS");
