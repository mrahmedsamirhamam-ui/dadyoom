import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ministryFile = path.resolve(root, "data/curriculum-audits/bh-2026-2027-g1-g3-s1-official-topic-index.json");
const snapshotFile = path.resolve(root, "data/curriculum-audits/bh-2026-2027-g1-g3-s1-production-topic-snapshot.json");
const ministry = JSON.parse(fs.readFileSync(ministryFile, "utf8"));
const snapshot = JSON.parse(fs.readFileSync(snapshotFile, "utf8"));

if (ministry.country !== "BH" || ministry.semester !== 1 ||
    ministry.year !== "2026-2027" || ministry.officialFullCoverageCertified !== false)
  throw new Error("Invalid or misleading ministry topic index provenance");
if (!Array.isArray(ministry.items) || !Array.isArray(snapshot.lessonRows))
  throw new Error("Ministry topic index and read-only lesson snapshot required");
if (new Set(ministry.items.map(x => x.id)).size !== ministry.items.length)
  throw new Error("Duplicate ministry topic identifier");

const norm = value => String(value ?? "")
  .normalize("NFKC")
  .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
  .replace(/ـ/g, "")
  .replace(/[إأآٱ]/g, "ا")
  .replace(/ى/g, "ي")
  .replace(/ؤ/g, "و")
  .replace(/ئ/g, "ي")
  .replace(/ة/g, "ه")
  .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660))
  .replace(/[^ء-ي0-9]+/g, " ")
  .trim().replace(/\s+/g, " ");

const officialRows = ministry.items;
const dbRows = snapshot.lessonRows;
const numberOfWorksheet = title => {
  const m = norm(title).match(/ورقه عمل (\d{1,2})(?: |$)/);
  return m ? Number(m[1]) : null;
};
const ordinalInEntry = entry => entry.category === "core" && entry.grade === 1 &&
  Array.isArray(entry.aliases) && entry.aliases.length > 0
    ? norm(entry.aliases[0]) : null;
const reviewFamily = title => {
  const label = norm(title);
  for (const family of ["القراءه","الحروف","التراكيب","الاملاء والتعبير"]) {
    if (label.includes(family)) return family;
  }
  return null;
};
const reviewIndex = title => {
  const m = norm(title).match(/(?:^| )([1-4])(?: |$)/);
  return m ? Number(m[1]) : null;
};

function titleCandidate(entry, row) {
  const label = norm(row.title);
  const topic = norm(entry.title);
  if (entry.category === "preparation_worksheet") {
    return numberOfWorksheet(row.title) === entry.sequence;
  }
  if (entry.category === "review") {
    const family = reviewFamily(entry.title);
    // A review slot must map to a review lesson, not to an unrelated reading
    // lesson that happens to include the same numbered parenthesis.
    return Boolean(family && /^(?:مراجعه|اراجع) /.test(label) &&
      label.includes(family) &&
      reviewIndex(row.title) === reviewIndex(entry.title));
  }
  if (entry.category === "speaking") {
    const unitName = norm(entry.title).replace(/^تحدث الوحده \d /, "");
    return label.includes("التحدث") && label.includes(unitName);
  }
  if (entry.category === "song") {
    return label.includes("انشوده") && label.includes(topic);
  }
  if (entry.category === "core" && entry.grade === 1) {
    const ordinal = ordinalInEntry(entry);
    return label.includes(topic) && (!ordinal || label.includes(ordinal));
  }
  if (label.includes(topic)) return true;
  // Publication titles sometimes contain a split OCR word "ب ن" instead
  // of "بن"; an alternative must be explicitly reviewed and recorded.
  return (entry.aliases ?? []).some(alias => label.includes(norm(alias)));
}

const comparisons = officialRows.map(entry => {
  const gradeRows = dbRows.filter(r => r.grade_number === entry.grade && r.semester === 1);
  const candidates = gradeRows.filter(r => titleCandidate(entry, r));
  const published = candidates.filter(r => r.status === "published");
  const drafts = candidates.filter(r => r.status !== "published");
  const fullLabel = norm(entry.title);
  const exactName = published.filter(row => norm(row.title).includes(fullLabel));
  const editorialWarnings = published.filter(row => row.explicit_non_ministry_substitution_notice);
  const worksheetEnrichmentWarnings = published.filter(row => row.explicit_original_enrichment_notice);
  let status;
  if (published.length === 0)
    status = drafts.length ? "DRAFT_TITLE_CANDIDATE_NO_PUBLISHED_TITLE" : "NO_PUBLISHED_TITLE_MATCH";
  else if (editorialWarnings.length)
    status = "PUBLISHED_TITLE_WITH_EXPLICIT_NON_MINISTRY_TEXT";
  else if (entry.category === "preparation_worksheet" && worksheetEnrichmentWarnings.length)
    status = "PUBLISHED_WORKSHEET_ENRICHMENT_NOT_BOOK_CONTENT";
  else if (entry.category === "review" && exactName.length === 0)
    status = "REVIEW_SKILL_NUMBER_FOUND_SPECIFIC_TOPIC_NOT_IN_TITLE";
  else if (entry.category === "preparation_worksheet" && exactName.length === 0)
    status = "WORKSHEET_NUMBER_FOUND_TITLE_REVIEW";
  else
    status = "PUBLISHED_TITLE_FOUND_BODY_NOT_VERIFIED";
  return {
    officialId: entry.id, grade: entry.grade, semester: 1,
    category: entry.category, officialTitle: entry.title, officialBookPages: entry.bookPage,
    officialPlanUrl: ministry.officialPlanUrl,
    status,
    publishedTitleCandidates: published.map(r => r.title),
    otherTitleCandidates: drafts.map(r => r.title),
    multiplePublishedCandidates: published.length > 1,
    originalTextSubstitutionNotices: editorialWarnings.length,
    originalWorksheetEnrichmentNotices: worksheetEnrichmentWarnings.length,
    sourceContentAlignment: "NOT_HUMAN_REVIEWED",
    certifiedComplete: false,
  };
});

const counts = Object.fromEntries([...new Set(comparisons.map(x => x.status))]
  .sort().map(status => [status, comparisons.filter(x => x.status === status).length]));
const groups = [1,2,3].map(grade => {
  const rows = comparisons.filter(x => x.grade === grade);
  return {grade, expectedTopicChecks: rows.length, statuses: Object.fromEntries([...new Set(rows.map(x => x.status))]
    .sort().map(s => [s,rows.filter(x => x.status === s).length]))};
});
const draftTitleAnomalies = dbRows.filter(x => x.status !== "published" &&
  (norm(x.title).length < 24 || x.content_characters < 300)).map(x => ({
    grade:x.grade_number,title:x.title,chars:x.content_characters
  }));
const result = {
  schemaVersion:1,
  audit:"TITLE_AND_EXPLICIT_NONMINISTRY_DISCLAIMER_GAP_TRIAGE",
  sourcePlanUrl:ministry.officialPlanUrl,
  inputProductionSnapshot:snapshotFile.replace(root + path.sep, ""),
  productionSnapshotAt:snapshot.snapshotAt,
  limitations:[
    "Historical read-only snapshot; current production may change.",
    "A TITLE match cannot certify that the official textbook lesson is covered; full-book text is not reproduced.",
    "Actual official lesson content, pedagogy, assessment and licensing need human review.",
    "Worksheet numbered matches must be cross-checked against topic title before release.",
    "This is a selected topic index, not every curricular microtask in the 2026/27 PDF.",
  ],
  summary:{
    officialTopicChecks:comparisons.length,localPublishedRows:dbRows.filter(x=>x.status==="published").length,
    titleMatchesWithoutContentCertification:comparisons.filter(x=>x.publishedTitleCandidates.length>0).length,
    noPublishedTitle:comparisons.filter(x=>x.publishedTitleCandidates.length===0).length,
    explicitNonMinistrySubstitutionTopics:comparisons.filter(x=>x.originalTextSubstitutionNotices>0).length,
    explicitOriginalWorksheetEnrichmentTopics:comparisons.filter(x=>x.originalWorksheetEnrichmentNotices>0).length,
    explicitOriginalEnrichmentPublishedRows:dbRows.filter(x=>x.status==="published" && x.explicit_original_enrichment_notice).length,
    explicitEnrichmentSupportingRowsNotSelectedAsMainWorksheets:
      dbRows.filter(x=>x.status==="published" && x.explicit_original_enrichment_notice).length -
      comparisons.filter(x=>x.category==="preparation_worksheet" && x.originalWorksheetEnrichmentNotices>0).length,
    shortOrGarbleDraftCandidates:draftTitleAnomalies.length,
    certifiedOfficialCoveragePercent:null,
    contentReviewedTopics:0,
    statusCounts:counts,
  },groups,comparisons,draftTitleAnomalies,
};
if (process.argv.includes("--json")) console.log(JSON.stringify(result,null,2));
else {
  console.log("MINISTRY_TOPIC_CHECKS="+result.summary.officialTopicChecks);
  console.log("TITLE_MATCHES_ONLY="+result.summary.titleMatchesWithoutContentCertification);
  console.log("NO_PUBLISHED_TITLE_MATCH="+result.summary.noPublishedTitle);
  console.log("EXPLICIT_DIFFERENT_TEXT_TOPICS="+result.summary.explicitNonMinistrySubstitutionTopics);
  console.log("EXPLICIT_ENRICHMENT_WORKSHEETS="+result.summary.explicitOriginalWorksheetEnrichmentTopics);
  console.log("EXPLICIT_ENRICHMENT_SUPPORTING_ROWS="+result.summary.explicitEnrichmentSupportingRowsNotSelectedAsMainWorksheets);
  console.log("DRAFT_GARBLED_OR_SHORT_CANDIDATES="+result.summary.shortOrGarbleDraftCandidates);
  console.log("CERTIFIED_OFFICIAL_COVERAGE=NOT_VERIFIED");
  for(const g of groups) console.log("GRADE_"+g.grade+"="+JSON.stringify(g.statuses));
  for(const row of comparisons.filter(x => x.status !== "PUBLISHED_TITLE_FOUND_BODY_NOT_VERIFIED")) {
    console.log("REVIEW G"+row.grade+" "+row.officialId+" "+row.status+" "+row.officialTitle);
  }
}
