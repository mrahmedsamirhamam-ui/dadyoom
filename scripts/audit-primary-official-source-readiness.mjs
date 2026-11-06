import fs from "node:fs";
import path from "node:path";
import { validateCurriculumPack } from "../lib/curriculum-packs/validate.mjs";

// Repository-only diagnostic. NEVER equate rows or published lessons with
// confirmed ministry curriculum coverage, and never write to Supabase.
const root = path.resolve(process.cwd(), "data/curriculum-packs");
const countriesFile = path.join(root, "arab-countries.json");
const registry = JSON.parse(fs.readFileSync(countriesFile, "utf8"));
const countries = registry.countries;

if (!Array.isArray(countries) || countries.length !== 22 ||
    new Set(countries.map(c => c.code)).size !== 22) {
  throw new Error("Expected 22 distinct registered countries.");
}

const ignore = new Set(["arab-countries.json", "official-sources-2026.json"]);
const packNames = fs.readdirSync(root)
  .filter(name => name.endsWith(".json") && !ignore.has(name)).sort();
const countrySet = new Set(countries.map(c => c.code));
const sourceIndex = new Map();
const sourcesFile = path.resolve(process.cwd(), "data/bahrain-arabic/sources-sem1.json");

if (fs.existsSync(sourcesFile)) {
  const entries = JSON.parse(fs.readFileSync(sourcesFile, "utf8").replace(/^\uFEFF/, ""));
  for (const e of entries) {
    if (!Number.isInteger(e.grade) || !Number.isInteger(e.semester) ||
        typeof e.url !== "string" || !/^https:\/\//i.test(e.url)) continue;
    const key = "BH:" + e.grade + ":" + e.semester;
    if (!sourceIndex.has(key)) sourceIndex.set(key, []);
    sourceIndex.get(key).push({ type: e.type || "unspecified", url: e.url });
  }
}

const inScope = new Map();
const outOfScope = [];
let totalPackLessons = 0;
let lessonsWithoutSource = 0;
let sourceLinkedLessons = 0;

for (const name of packNames) {
  const pack = JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
  const check = validateCurriculumPack(pack);
  if (!check.ok) throw new Error("Invalid curriculum pack " + name + ": " + check.errors.join("; "));
  if (!countrySet.has(pack.country.code)) throw new Error("Unknown pack country " + pack.country.code);
  const lessons = pack.units.flatMap(unit => unit.lessons);
  totalPackLessons += lessons.length;
  const linked = lessons.filter(lesson => typeof lesson.source?.url === "string" &&
    /^https:\/\//i.test(lesson.source.url)).length;
  sourceLinkedLessons += linked;
  lessonsWithoutSource += lessons.length - linked;
  const slot = pack.country.code + ":" + pack.grade.number + ":" + pack.semester;
  const record = {
    file: name, packKey: pack.packKey,
    lessonRows: lessons.length, lessonSourceLinks: linked,
    unlinkedLessonRows: lessons.length - linked,
    topLevelSourceLink: /^https:\/\//i.test(pack.rights?.sourceUrl || ""),
    titleExamples: lessons.slice(0, 4).map(l => l.title),
  };
  if (pack.grade.number >= 1 && pack.grade.number <= 3 &&
      (pack.semester === 1 || pack.semester === 2)) {
    if (!inScope.has(slot)) inScope.set(slot, []);
    inScope.get(slot).push(record);
  } else {
    outOfScope.push(record);
  }
}

const slots = [];
for (const country of countries) {
  for (const grade of [1, 2, 3]) {
    for (const semester of [1, 2]) {
      const key = country.code + ":" + grade + ":" + semester;
      const packs = inScope.get(key) || [];
      const localLessonRows = packs.reduce((sum, p) => sum + p.lessonRows, 0);
      const localLinkedLessonRows = packs.reduce((sum, p) => sum + p.lessonSourceLinks, 0);
      const linkCount = packs.filter(p => p.topLevelSourceLink).length;
      const status = packs.length === 0
        ? "NO_LOCAL_PACK"
        : linkCount === 0 && localLinkedLessonRows === 0
          ? "PACK_WITHOUT_OFFICIAL_EVIDENCE_LINKS"
          : "SOURCE_LINKS_PRESENT_NOT_TOC_VERIFIED";
      slots.push({
        countryCode: country.code, countryNameAr: country.nameAr,
        grade, semester, status, localPackCount: packs.length,
        localLessonRows, localLessonRowsWithSourceUrl: localLinkedLessonRows,
        sourceCandidates: sourceIndex.get(key) || [],
        packs,
        // The program does not read a verified ministry TOC for this slot,
        // therefore it must NEVER manufacture an official match percentage.
        officialLessonsExpected: null,
        officialLessonsMatched: null,
        officialCoveragePercent: null,
      });
    }
  }
}
const withPack = slots.filter(x => x.localPackCount > 0).length;
const report = {
  schemaVersion: 1,
  auditType: "REPOSITORY_PACK_SOURCE_READINESS_ONLY",
  claims: {
    liveWebsite: "NOT_CHECKED",
    productionDatabase: "NOT_CHECKED",
    officialTextbookTocMatch: "NOT_VERIFIED",
  },
  scope: {
    registeredCountries: countries.length,
    grades: [1, 2, 3], semesters: [1, 2],
    planningSlots: slots.length,
    note: "Two semesters per grade are planning slots, not a sourced assertion about every country's education calendar.",
  },
  summary: {
    totalPackFiles: packNames.length, totalPackLessonRows: totalPackLessons,
    localPlanningSlotsWithPack: withPack,
    localPlanningSlotsWithoutPack: slots.length - withPack,
    localPackLessonRowsWithSourceUrl: sourceLinkedLessons,
    localPackLessonRowsWithoutSourceUrl: lessonsWithoutSource,
    officialLessonCoveragePercent: null,
  },
  officialGuidesForBahrain: [
    "https://www.edunet.bh/Econtent/BooksGuide",
    "https://www.edunet.bh/Econtent/LessonsGuide",
  ],
  outOfScopePacks: outOfScope,
  slots,
};

if (process.argv.includes("--json")) {
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
} else {
  console.log("AUDIT_TYPE=" + report.auditType);
  console.log("REGISTERED_COUNTRIES=" + countries.length);
  console.log("PRIMARY_PLANNING_SLOTS=" + slots.length);
  console.log("SLOTS_WITH_LOCAL_PACK=" + withPack);
  console.log("SLOTS_WITHOUT_LOCAL_PACK=" + (slots.length - withPack));
  console.log("TOTAL_PACK_LESSON_ROWS=" + totalPackLessons);
  console.log("LESSON_ROWS_WITH_SOURCE_URL=" + sourceLinkedLessons);
  console.log("LESSON_ROWS_WITHOUT_SOURCE_URL=" + lessonsWithoutSource);
  console.log("OFFICIAL_TOC_MATCH=NOT_VERIFIED");
  console.log("PRODUCTION_COVERAGE=NOT_CHECKED");
  for (const s of slots.filter(s => s.countryCode === "BH")) {
    console.log("BAHRAIN_G" + s.grade + "_S" + s.semester + "=" + s.status +
      " LESSON_ROWS=" + s.localLessonRows + " CANDIDATE_BOOK_LINKS=" + s.sourceCandidates.length);
  }
}
