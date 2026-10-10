#!/usr/bin/env node
// Read-only, reproducible product-closure evidence. No external network,
// credentials, student data, migrations or publication mutations.
import { readFileSync } from "node:fs";
import { independentTocValidation } from "./lib/independent-toc-evidence.mjs";

const readJson = (name) =>
  JSON.parse(readFileSync(new URL(`../data/curriculum-completeness/${name}`, import.meta.url), "utf8"));

const books = readJson("bahrain-book-completeness-2026-2027.json");
const grade1 = readJson("bahrain-grade1-sem2-objective-drafts-20261010.json");
const reading = readJson("bahrain-grade2-3-sem2-original-objective-drafts-20261010.json");

const scopes = books.books ?? [];
const complete = scopes.filter((item) => item.status === "COMPLETE_BOOK" && item.bookTotalTOCItems !== null
  && item.missingItems === 0 && item.sourceVerified === true
  && independentTocValidation(item, books.academicYear).valid).length;
const unreviewed = scopes.length - complete;
const missingOrUnverified = scopes.filter((item) => item.status !== "COMPLETE_BOOK").length;
const draftRows = [...grade1.items, ...reading.items];
const uniqueIds = new Set(draftRows.map((item) => item.lessonId)).size;
const invalidDrafts = draftRows.filter((row) =>
  !row.lessonId || !row.prompt || !Array.isArray(row.options)
  || row.options.length !== 4 || new Set(row.options).size !== 4
  || row.options.filter((option) => option === row.correct).length !== 1
  || !row.explanation).length;

const report = {
  scope: "Bahrain book/assessment evidence only; not a live Cloudflare or all-country audit",
  sourceYear: books.academicYear,
  bahrainBooks: {
    auditedScopes: scopes.length,
    independentlyVerifiedComplete: complete,
    pendingIndependentTOCVerification: unreviewed,
    notMarkedComplete: missingOrUnverified,
    summaryClaim: books.summary?.completeBooks ?? null,
    certifiedComplete: complete === scopes.length && scopes.length > 0
  },
  assessmentDrafts: {
    grade1: grade1.items.length,
    grade2: reading.items.filter((r) => r.grade === 2).length,
    grade3: reading.items.filter((r) => r.grade === 3).length,
    total: draftRows.length,
    uniqueLessonIds: uniqueIds,
    invalidStructuralRows: invalidDrafts,
    editorialApproval: "NOT_VERIFIED",
    publishedStatus: "NOT_ASSERTED_FROM_STATIC_FILES — verify in live database"
  },
  finalCertification: "NOT_CERTIFIED — separate stable CI, Worker 1102 analysis and official 1:1 textbook validation required"
};

if (scopes.length !== Number(books.summary?.auditRows) ||
    complete !== Number(books.summary?.completeBooks) ||
    invalidDrafts !== 0 || uniqueIds !== draftRows.length) {
  console.error("DADYOOM_EVIDENCE_INTEGRITY_FAILED");
  process.exitCode = 2;
}
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes("--strict") && !report.bahrainBooks.certifiedComplete) {
  console.error("DADYOOM_BOOK_COMPLETENESS=BLOCKED — no independently verified 1:1 book TOCs");
  process.exitCode = 1;
}
