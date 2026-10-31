// Ministerial source/lesson comparator. READ-ONLY. No AI generation, no publication.
// Source absence is UNKNOWN, never a successful match.
const MARKS = /[\u064b-\u065f\u0670\u0640]/g;
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EAST_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
export function normalizeArabic(value) {
  return String(value ?? "").normalize("NFKC")
    .replace(MARKS, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي")
    .replace(/[“”„«»"'.,،؛:!?؟()[\]{}\-–—_]/g, " ")
    .replace(/[٠-٩۰-۹]/g, (c) => String((ARABIC_DIGITS + EAST_DIGITS).indexOf(c) % 10))
    .replace(/\s+/g, " ").trim().toLowerCase();
}
// Exact titles keep hamza and alif-maqsura distinct: a one-letter difference is NOT a proven match.
export function normalizeStrictTitle(value) {
  return String(value ?? "").normalize("NFKC").replace(MARKS, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ").trim().toLowerCase();
}
export function scopeKey(country, grade, semester, track = "general") {
  return [country, Number(grade), Number(semester), track || "general"].join(":");
}
function isHexSha(value) { return /^[a-f\d]{64}$/i.test(String(value ?? "")); }
function safeUrl(value, domains) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password &&
      !u.port && domains.some((d) => u.hostname === d || u.hostname.endsWith("." + d));
  } catch { return false; }
}
export function checkOfficialManifest(manifest, registry, year) {
  const errors = [];
  const entry = registry.find((s) => s.country === manifest.country);
  if (!entry) errors.push("UNRECOGNIZED_COUNTRY");
  if (!Number.isInteger(manifest.grade) || manifest.grade < 1 || manifest.grade > 13) errors.push("INVALID_GRADE");
  if (![1, 2].includes(manifest.semester)) errors.push("INVALID_SEMESTER");
  if (manifest.subject !== "arabic") errors.push("WRONG_SUBJECT");
  if (manifest.academicYear !== year) errors.push("EDITION_YEAR_MISMATCH");
  if (!manifest.source || !safeUrl(manifest.source.url, entry?.approvedDomains ?? [])) errors.push("UNTRUSTED_OFFICIAL_URL");
  if (!isHexSha(manifest.source?.sha256)) errors.push("SOURCE_HASH_UNVERIFIED");
  if (manifest.source?.extractionStatus !== "reviewed") errors.push("EXTRACTION_NOT_REVIEWED");
  if (!["textbook","official_toc","official_lesson_schedule"].includes(manifest.source?.documentType)) errors.push("UNCLASSIFIED_OFFICIAL_DOCUMENT");
  if (manifest.source?.edition !== year) errors.push("DOCUMENT_EDITION_NOT_VERIFIED");
  if (!manifest.source?.retrievedAt || !manifest.source?.reviewedAt || !manifest.source?.reviewedBy) errors.push("MISSING_EVIDENCE_CHAIN");
  if (!Array.isArray(manifest.units) || !manifest.units.length) errors.push("EMPTY_OFFICIAL_TOC");
  else for (const unit of manifest.units) {
    if (!unit.title || !Array.isArray(unit.lessons) || !unit.lessons.length) errors.push("INVALID_OFFICIAL_UNIT");
    for (const lesson of unit.lessons ?? []) {
      if (!lesson.title || !(Number.isInteger(lesson.page) && lesson.page >= 1 || typeof lesson.anchor === "string" && lesson.anchor.length > 3))
        errors.push("MISSING_PER_LESSON_PAGE_OR_ANCHOR");
    }
  }
  return Array.from(new Set(errors));
}
function dist(a, b) {
  if (Math.abs(a.length - b.length) > 18) return Math.max(a.length, b.length);
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]; row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j-1] + 1, prev + Number(a[i-1] !== b[j-1]));
      prev = tmp;
    }
  }
  return row[b.length];
}
function similarity(a, b) {
  const x = normalizeArabic(a), y = normalizeArabic(b);
  if (!x || !y) return 0;
  return 1 - dist(x, y) / Math.max(x.length, y.length);
}
function qualityFindings(lesson, academicYear) {
  const out = [];
  const text = String(lesson.content ?? "");
  if (lesson.academicYear !== academicYear) out.push("PLATFORM_EDITION_UNVERIFIED");
  const objectives = Array.isArray(lesson.objectives) ? lesson.objectives : [];
  const types = new Set(Array.isArray(lesson.activityTypes) ? lesson.activityTypes.filter(Boolean) : []);
  if (text.trim().length < 120) out.push("MISSING_OR_SHORT_TEACHING_BODY");
  if (/\ufffd|[\u0000-\u0008\u000b\u000e-\u001f]/.test(text)) out.push("INVALID_TEXT_CHARACTERS");
  if (/نص هنا|ضع النص|lorem ipsum|\[اكتب|\{lesson\}|TODO\b|undefined\b/i.test(text)) out.push("PLACEHOLDER_TEXT");
  if (/(.)\1{6,}/u.test(text)) out.push("SUSPICIOUS_REPEAT_CHARACTERS");
  if (objectives.length < 2) out.push("INSUFFICIENT_OBSERVABLE_OBJECTIVES");
  if ((lesson.questionCount ?? 0) < 3) out.push("UNDER_THREE_QUESTIONS");
  if ((lesson.questionsWithExplanation ?? 0) < 3) out.push("UNEXPLAINED_QUESTIONS");
  if ((lesson.publishedActivities ?? 0) < 6) out.push("UNDER_SIX_ACTIVITIES");
  if (!Number.isInteger(lesson.gamesCount)) out.push("PLAYABLE_GAMES_NOT_AUDITED");
  else if (lesson.gamesCount < 5) out.push("UNDER_FIVE_PLAYABLE_GAMES");
  if (lesson.gamesReview?.status !== "approved") out.push("GAMES_QUALITY_NOT_APPROVED");
  if (lesson.answerKeyReview?.status !== "approved") out.push("ANSWER_KEYS_NOT_VERIFIED");
  if (lesson.browserE2E?.status !== "passed") out.push("STUDENT_BROWSER_E2E_NOT_PASSED");
  if (lesson.audioReview?.status !== "approved") out.push("AUDIO_AND_ACCESSIBILITY_NOT_VERIFIED");
  for (const skill of ["reading","writing","listening","speaking"]) if (!types.has(skill)) out.push("MISSING_SKILL_" + skill.toUpperCase());
  if (lesson.isBookTextUnverified === true || /ليس نص الكتاب|مطابقة.*غير مثبتة|مراجعة.*الوزارة/.test(text)) out.push("OFFICIAL_BOOK_TEXT_NOT_VERIFIED");
  if (lesson.linguisticReview?.status !== "approved") out.push("LINGUISTIC_REVIEW_MISSING");
  if (lesson.pedagogicalReview?.status !== "approved") out.push("PEDAGOGICAL_REVIEW_MISSING");
  if (lesson.officialTextReview?.status !== "approved" || !isHexSha(lesson.officialTextReview?.sourceSha256)) out.push("OFFICIAL_TEXT_COMPARISON_MISSING");
  return out;
}
function itemRef(x) { return { id: x.id ?? null, title: x.title, unit: x.unitTitle, status: x.status ?? "unknown" }; }
const error = (code, severity, details) => ({ code, severity, ...details });
export function auditCurriculum({ countries, registry, manifests = [], platformLessons = [], academicYear = "2026-2027", includeGrade13 = false }) {
  if (!Array.isArray(countries) || countries.length !== 22 || new Set(countries.map(x => x.code)).size !== 22)
    throw new Error("MUST_HAVE_22_UNIQUE_COUNTRIES");
  if (!Array.isArray(registry) || !Array.isArray(manifests) || !Array.isArray(platformLessons))
    throw new Error("INVALID_INPUTS");
  const allCountries = new Set(countries.map(x => x.code));
  const findings = [];
  const summaries = [];
  const maxGrade = includeGrade13 ? 13 : 12;
  const indices = new Map();
  for (const m of manifests) {
    const key = scopeKey(m.country,m.grade,m.semester,m.track);
    if (!indices.has(key)) indices.set(key, []);
    indices.get(key).push(m);
  }
  for (const p of platformLessons) {
    if (!allCountries.has(p.country) || !(p.grade >= 1 && p.grade <= 13))
      findings.push(error("INVALID_PLATFORM_SCOPE","critical",{country:p.country,grade:p.grade,lesson:itemRef(p)}));
    if (![1,2].includes(p.semester)) findings.push(error("PLATFORM_SEMESTER_UNASSIGNED","critical",{country:p.country,grade:p.grade,lesson:itemRef(p)}));
    if (p.grade === 13 && !includeGrade13) findings.push(error("UNMAPPED_GRADE13_REQUIRES_EDUCATION_STAGE_PROOF","critical",{country:p.country,grade:p.grade,lesson:itemRef(p)}));
  }
  for (const country of countries) for (let grade = 1; grade <= maxGrade; grade++) for (const semester of [1,2]) {
    const tracks=new Set(["general"]);
    for (const m of manifests) if(m.country===country.code&&m.grade===grade&&m.semester===semester) tracks.add(m.track||"general");
    for (const p of platformLessons) if(p.country===country.code&&p.grade===grade&&p.semester===semester) tracks.add(p.track||"general");
    for(const track of tracks){
    const key = scopeKey(country.code,grade,semester,track);
    const scoped = platformLessons.filter(p => scopeKey(p.country,p.grade,p.semester,p.track) === key);
    const approved = scoped.filter(p => p.status === "published");
    const drafts = scoped.filter(p => p.status !== "published");
    const candidates = indices.get(key) ?? [];
    const summary = { country:country.code,grade,semester,platformLessons:scoped.length,published:approved.length,drafts:drafts.length,officialUnits:null,officialLessons:null,exactTitleMatches:0,approvedContentMatches:0,status:"SOURCE_UNVERIFIED" };
    const seen = new Map();
    for (const p of scoped) {
      const titleKey = [normalizeArabic(p.unitTitle),normalizeArabic(p.title)].join("::");
      const prev = seen.get(titleKey);
      if (prev) findings.push(error("DUPLICATE_PLATFORM_LESSON","high",{scope:key,first:itemRef(prev),second:itemRef(p)}));
      else seen.set(titleKey,p);
      for (const q of qualityFindings(p,academicYear)) findings.push(error(q,"review",{scope:key,lesson:itemRef(p)}));
      if (p.status !== "published") findings.push(error("UNPUBLISHED_OR_DRAFT","high",{scope:key,lesson:itemRef(p)}));
    }
    if (candidates.length !== 1) {
      findings.push(error(candidates.length ? "DUPLICATE_OFFICIAL_MANIFEST":"OFFICIAL_MANIFEST_REQUIRED","critical",{scope:key,officialCandidates:candidates.length}));
      summaries.push(summary); continue;
    }
    const m = candidates[0];
    const problems = checkOfficialManifest(m,registry,academicYear);
    if (problems.length) {
      findings.push(error("OFFICIAL_MANIFEST_INVALID","critical",{scope:key,reasons:problems}));
      summaries.push(summary); continue;
    }
    const official = m.units.flatMap((u) => u.lessons.map((l) => ({...l,unitTitle:u.title})));
    summary.officialUnits=m.units.length; summary.officialLessons=official.length;
    const used = new Set();
    const officialSeen = new Set();
    for (const o of official) {
      const ok = [normalizeStrictTitle(o.unitTitle),normalizeStrictTitle(o.title)].join("::");
      if (officialSeen.has(ok)) findings.push(error("DUPLICATE_OFFICIAL_TOC_LESSON","critical",{scope:key,official:o}));
      officialSeen.add(ok);
      const matches = scoped.filter(p => normalizeStrictTitle(p.unitTitle) === normalizeStrictTitle(o.unitTitle) && normalizeStrictTitle(p.title) === normalizeStrictTitle(o.title));
      if (matches.length !== 1) {
        const near = scoped.filter(p => !used.has(p.id) && similarity(p.title,o.title) >= 0.76 && similarity(p.unitTitle,o.unitTitle) >= 0.72)
          .map(p => ({...itemRef(p),similarity:+similarity(p.title,o.title).toFixed(3)}));
        findings.push(error(matches.length ? "DUPLICATE_EXACT_MATCH":"OFFICIAL_LESSON_MISSING_OR_RENAMED","high",{scope:key,official:o,candidates:near.slice(0,5)}));
        continue;
      }
      const p = matches[0];
      used.add(p.id);
      summary.exactTitleMatches += 1;
      const issues = qualityFindings(p,academicYear);
      if(p.officialTextReview?.sourceSha256 !== m.source.sha256) issues.push("OFFICIAL_SOURCE_HASH_DISAGREEMENT");
      if (p.status === "published" && issues.length === 0) summary.approvedContentMatches += 1;
      else findings.push(error("TITLE_MATCH_CONTENT_NOT_CERTIFIED","high",{scope:key,official:o,lesson:itemRef(p),qualityChecks:issues}));
    }
    for (const p of scoped) if (!used.has(p.id)) findings.push(error("PLATFORM_LESSON_NOT_IN_OFFICIAL_TOC","review",{scope:key,lesson:itemRef(p)}));
    summary.status = summary.approvedContentMatches === official.length &&
      !official.some(o => official.filter(x => normalizeStrictTitle(x.unitTitle) === normalizeStrictTitle(o.unitTitle) && normalizeStrictTitle(x.title) === normalizeStrictTitle(o.title)).length !== 1) &&
      scoped.length === official.length ? "CONTENT_VERIFIED" : "REVIEW_REQUIRED";
    summaries.push(summary);
  }
  }
  const countByCode = {};
  for (const finding of findings) countByCode[finding.code] = (countByCode[finding.code] ?? 0) + 1;
  const verifiedScopes=summaries.filter(s=>s.status==="CONTENT_VERIFIED").length;
  return { schemaVersion:1,academicYear,countries:countries.length,gradeMax:maxGrade,scopes:summaries.length,verifiedScopes,releaseReady:verifiedScopes===summaries.length&&findings.length===0,
    summary:summaries,counts:countByCode,findings };
}
