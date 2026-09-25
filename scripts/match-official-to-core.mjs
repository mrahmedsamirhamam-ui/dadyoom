import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const args = Object.fromEntries(
  process.argv.slice(2).map((raw) => {
    const clean = raw.replace(/^--/u, "");
    const i = clean.indexOf("=");
    return i === -1
      ? [clean, true]
      : [clean.slice(0, i), clean.slice(i + 1)];
  }),
);

const countryCode = String(args.country ?? "BH").trim().toUpperCase();
const academicYear = String(args.year ?? "2026-2027").trim();
const outputDir = path.resolve(
  process.cwd(),
  String(args.output ?? "diagnostics/official-match"),
);

const writeMappings =
  args["write-mappings"] === true ||
  String(args["write-mappings"] ?? "").toLowerCase() === "true";

const mappingOutputDir = path.resolve(
  process.cwd(),
  String(args["mapping-output"] ?? "data/curriculum-mappings"),
);

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const serverKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serverKey) {
  throw new Error("SUPABASE_SERVER_ENV_MISSING");
}

const supabase = createClient(
  supabaseUrl,
  serverKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);

const ARABIC_DIACRITICS =
  /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/gu;

const ORDINAL_WORDS =
  /\b(?:الاول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|الحادي عشر|الثاني عشر|الثالث عشر|الرابع عشر|الخامس عشر)\b/gu;

const GENERIC_WORDS = new Set([
  "الدرس",
  "الوحده",
  "الوحدة",
  "العربيه",
  "العربية",
  "اللغه",
  "اللغة",
  "براعم",
  "التدريبات",
  "تدريبات",
  "صفحه",
  "صفحة",
  "دراسه",
  "دراسة",
  "كامله",
  "كاملة",
]);

function normalizeArabic(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(ARABIC_DIACRITICS, "")
    .replace(/ـ/gu, "")
    .replace(/[إأآٱ]/gu, "ا")
    .replace(/ى/gu, "ي")
    .replace(/ة/gu, "ه")
    .replace(/ؤ/gu, "و")
    .replace(/ئ/gu, "ي")
    .replace(ORDINAL_WORDS, " ")
    .replace(/\b(?:الدرس|درس)\b/gu, " ")
    .replace(/[“”"'«»()\[\]{}:؛،,.!?؟/\\|+_=*—–-]/gu, " ")
    .replace(/\d+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .toLowerCase();
}

function tokens(value) {
  return normalizeArabic(value)
    .split(" ")
    .filter(
      (token) =>
        token.length > 1 &&
        !GENERIC_WORDS.has(token),
    );
}

function dice(a, b) {
  const aa = new Set(tokens(a));
  const bb = new Set(tokens(b));

  if (!aa.size || !bb.size) return 0;

  let common = 0;
  for (const token of aa) {
    if (bb.has(token)) common += 1;
  }

  return (2 * common) / (aa.size + bb.size);
}

function trigrams(value) {
  const s = `  ${normalizeArabic(value)}  `;
  const out = new Set();
  for (let i = 0; i <= s.length - 3; i += 1) {
    out.add(s.slice(i, i + 3));
  }
  return out;
}

function trigramSimilarity(a, b) {
  const aa = trigrams(a);
  const bb = trigrams(b);

  if (!aa.size || !bb.size) return 0;

  let common = 0;
  for (const item of aa) {
    if (bb.has(item)) common += 1;
  }

  return (2 * common) / (aa.size + bb.size);
}

const TAG_RULES = [
  ["letters", /(?:^|\s)(?:حرف|حروف|اصوات|الصوت|الحركات|السكون|الشده|التنوين|المد)(?:\s|$)/u],
  ["reading", /(?:القراءه|نص|قصيده|شعر|سيره|روايه|قصه|فهم المقروء|فكره رئيس)/u],
  ["writing", /(?:انتاج كتابي|كتابه|التعبير|السرد|تلخيص|مقاله|تقرير|قصه قصيره|بحث|توثيق)/u],
  ["grammar", /(?:نحو|نحوي|الجمله|مبتدا|الخبر|الفعل|الفاعل|مفعول|نواسخ|المثني|الجمع|استفهام|شرط|نفي|امر|نهي|توابع|حال|تمييز|اسم|حرف جر)/u],
  ["rhetoric", /(?:بلاغه|الصوره الفنيه|تشبيه|استعاره|كنايه|ايجاز|اطناب)/u],
  ["listening", /(?:استماع|المسموع)/u],
  ["speaking", /(?:تحدث|شفهي|محادثه|عرض ومناقشه)/u],
  ["review", /(?:اراجع|مراجعه|اعزز|مكتسباتي|تقويم)/u],
];

function tags(value) {
  const normalized = normalizeArabic(value);
  return new Set(
    TAG_RULES
      .filter(([, rule]) => rule.test(normalized))
      .map(([tag]) => tag),
  );
}

function tagSimilarity(a, b) {
  const aa = tags(a);
  const bb = tags(b);

  if (!aa.size || !bb.size) return 0;

  let common = 0;
  for (const tag of aa) {
    if (bb.has(tag)) common += 1;
  }

  return common / Math.max(aa.size, bb.size);
}

function ruleBoost(officialTitle, coreTitle) {
  const official = normalizeArabic(officialTitle);
  const core = normalizeArabic(coreTitle);
  let boost = 0;

  if (
    /(?:^|\s)حرف(?:\s|$)/u.test(official) &&
    /(?:اصوات والحروف|اشكال الحرف)/u.test(core)
  ) {
    boost += 0.42;
  }

  if (
    /(?:اراجع|مراجعه|اعزز|مكتسباتي)/u.test(official) &&
    /مراجعه/u.test(core)
  ) {
    boost += 0.42;
  }

  if (
    /(?:القراءه|قصيده|نص|شعر|قصه)/u.test(official) &&
    /(?:قراءه|تحليل الشعر|تحليل النثر|فكره رئيس|استنتاج)/u.test(core)
  ) {
    boost += 0.18;
  }

  if (
    /(?:انتاج كتابي|كتابه|التعبير)/u.test(official) &&
    /(?:كتابه|سرد|مقال|تلخيص|بحث|تقرير)/u.test(core)
  ) {
    boost += 0.26;
  }

  return Math.min(boost, 0.5);
}

function lessonText(lesson) {
  return [
    lesson?.title,
    lesson?.summary,
    ...(Array.isArray(lesson?.learningObjectives)
      ? lesson.learningObjectives
      : []),
  ]
    .filter(Boolean)
    .join(" ");
}

function typeSimilarity(a, b) {
  const aa = String(a ?? "").trim();
  const bb = String(b ?? "").trim();

  if (!aa || !bb) return 0;
  if (aa === bb) return 1;

  const families = {
    reading: new Set(["reading", "vocabulary"]),
    writing: new Set(["writing", "spelling"]),
    language: new Set(["grammar", "spelling", "vocabulary"]),
    oral: new Set(["listening", "speaking"]),
  };

  for (const family of Object.values(families)) {
    if (family.has(aa) && family.has(bb)) {
      return 0.45;
    }
  }

  return 0;
}

function scorePair(official, core) {
  const nOfficial = normalizeArabic(official.title);
  const nCore = normalizeArabic(core.title);

  if (nOfficial && nOfficial === nCore) {
    return 1;
  }

  const officialText = lessonText(official);
  const coreText = lessonText(core);

  const score =
    (0.22 * dice(official.title, core.title)) +
    (0.13 * trigramSimilarity(official.title, core.title)) +
    (0.22 * dice(officialText, coreText)) +
    (0.12 * trigramSimilarity(officialText, coreText)) +
    (0.11 * tagSimilarity(officialText, coreText)) +
    (0.10 * typeSimilarity(official.lessonType, core.lessonType)) +
    ruleBoost(officialText, coreText);

  return Math.max(0, Math.min(0.99, score));
}

function confidence(score) {
  if (score >= 0.80) return "high";
  if (score >= 0.55) return "medium";
  if (score >= 0.35) return "low";
  return "very-low";
}

function isTextSpecific(lesson) {
  const value = normalizeArabic(
    [
      lesson?.title,
      lesson?.summary,
    ]
      .filter(Boolean)
      .join(" "),
  );

  return (
    lesson?.lessonType === "reading" &&
    (
      /[«»]/u.test(String(lesson?.title ?? "")) ||
      /(?:قصيده|شعر|سيره|روايه|قصه|النص المقرر|كتاب الطالب)/u.test(value)
    )
  );
}

function coverageStatus(lesson, score) {
  if (!Number.isFinite(score) || score <= 0) {
    return "gap";
  }

  if (isTextSpecific(lesson)) {
    return score >= 0.35
      ? "partial-text-specific"
      : "gap-text-specific";
  }

  if (score >= 0.80) {
    return "covered";
  }

  if (score >= 0.55) {
    return "partial";
  }

  return "gap";
}

function relationHint(lesson, score) {
  const status =
    coverageStatus(
      lesson,
      score,
    );

  if (status === "covered") {
    return "direct-skill";
  }

  if (status === "partial") {
    return "supporting-skill";
  }

  if (
    status === "partial-text-specific" ||
    status === "gap-text-specific"
  ) {
    return "text-specific";
  }

  return "unmapped";
}

function coreSkillBundle(officialLesson, gradeCore) {
  const officialText = lessonText(officialLesson);
  const officialTags = tags(officialText);
  const officialType = String(officialLesson.lessonType ?? "").trim();

  const scored = gradeCore
    .map((coreLesson) => {
      const semanticScore = scorePair(officialLesson, coreLesson);
      const sameType = typeSimilarity(officialType, coreLesson.lessonType);
      const tagScore = tagSimilarity(officialText, lessonText(coreLesson));

      let bundleScore =
        (0.62 * semanticScore) +
        (0.23 * sameType) +
        (0.15 * tagScore);

      if (
        officialType === "assessment" &&
        coreLesson.lessonType === "assessment"
      ) {
        bundleScore += 0.35;
      }

      if (
        officialType === "reading" &&
        coreLesson.lessonType === "reading"
      ) {
        bundleScore += 0.12;
      }

      if (
        officialType === "writing" &&
        coreLesson.lessonType === "writing"
      ) {
        bundleScore += 0.18;
      }

      if (
        officialType === "grammar" &&
        coreLesson.lessonType === "grammar"
      ) {
        bundleScore += 0.18;
      }

      if (
        officialType === "spelling" &&
        ["spelling", "writing"].includes(coreLesson.lessonType)
      ) {
        bundleScore += 0.16;
      }

      if (
        officialType === "listening" &&
        ["listening", "speaking"].includes(coreLesson.lessonType)
      ) {
        bundleScore += 0.16;
      }

      if (
        officialType === "speaking" &&
        ["speaking", "listening"].includes(coreLesson.lessonType)
      ) {
        bundleScore += 0.16;
      }

      return {
        coreLessonId: coreLesson.id,
        coreSlug: coreLesson.slug,
        coreTitle: coreLesson.title,
        coreLessonType: coreLesson.lessonType,
        score: Number(Math.min(0.99, bundleScore).toFixed(4)),
      };
    })
    .sort((a, b) => b.score - a.score);

  const sameFamily = scored.filter((item) => {
    if (officialType === "assessment") {
      return item.coreLessonType === "assessment";
    }

    if (officialType === "spelling") {
      return ["spelling", "writing"].includes(item.coreLessonType);
    }

    if (officialType === "listening") {
      return ["listening", "speaking"].includes(item.coreLessonType);
    }

    if (officialType === "speaking") {
      return ["speaking", "listening"].includes(item.coreLessonType);
    }

    return (
      item.coreLessonType === officialType ||
      typeSimilarity(officialType, item.coreLessonType) > 0
    );
  });

  const chosen = [];
  const seen = new Set();

  for (const item of [...sameFamily, ...scored]) {
    if (seen.has(item.coreLessonId)) continue;

    const acceptable =
      item.score >= 0.34 ||
      (
        chosen.length === 0 &&
        sameFamily.some(
          (candidate) =>
            candidate.coreLessonId === item.coreLessonId,
        )
      );

    if (!acceptable) continue;

    seen.add(item.coreLessonId);
    chosen.push(item);

    if (chosen.length >= 4) break;
  }

  const textSpecific = isTextSpecific(officialLesson);

  if (textSpecific && chosen.length > 0) {
    return {
      status: "partial-text-specific",
      relation: "text-specific",
      covered: true,
      items: chosen,
    };
  }

  if (chosen.length >= 2) {
    return {
      status: "bundle-covered-candidate",
      relation: "coverage-bundle",
      covered: true,
      items: chosen,
    };
  }

  if (
    chosen.length === 1 &&
    chosen[0].score >= 0.55
  ) {
    return {
      status: "partial",
      relation: "supporting-skill",
      covered: true,
      items: chosen,
    };
  }

  return {
    status: "gap",
    relation: "unmapped",
    covered: false,
    items: chosen,
  };
}

const { data: curricula, error: curriculaError } =
  await supabase
    .from("curricula")
    .select("id,name_ar,academic_year,countries!inner(code)")
    .eq("countries.code", countryCode)
    .eq("academic_year", academicYear);

if (curriculaError) throw curriculaError;

const coreCurriculumIds = new Set(
  (curricula ?? [])
    .filter(
      (row) =>
        String(row.name_ar ?? "").trim() ===
        "المسار العربي الأساسي لضاديوم",
    )
    .map((row) => row.id),
);

const officialCurriculumIds = new Set(
  (curricula ?? [])
    .filter((row) => !coreCurriculumIds.has(row.id))
    .map((row) => row.id),
);

if (!coreCurriculumIds.size) {
  throw new Error(`CORE_CURRICULUM_NOT_FOUND:${countryCode}`);
}

if (!officialCurriculumIds.size) {
  console.log(`OFFICIAL_LAYER_NOT_IMPORTED:${countryCode}`);
}

const { data: rows, error: rowsError } =
  await supabase
    .from("lessons")
    .select(
      "id,title,slug,lesson_number,lesson_type,summary,learning_objectives,source_pdf_url,source_page_start,source_page_end,units!inner(id,title,unit_number,grades!inner(id,grade_number,curriculum_id))",
    )
    .eq("status", "published")
    .in(
      "units.grades.curriculum_id",
      [...coreCurriculumIds, ...officialCurriculumIds],
    );

if (rowsError) throw rowsError;

function relation(value) {
  return Array.isArray(value) ? value[0] : value;
}

const core = [];
const official = [];

for (const lesson of rows ?? []) {
  const unit = relation(lesson.units);
  const grade = relation(unit?.grades);
  const curriculumId = grade?.curriculum_id;

  const item = {
    id: lesson.id,
    title: lesson.title,
    slug: lesson.slug,
    lessonNumber: lesson.lesson_number,
    lessonType: lesson.lesson_type ?? null,
    summary: lesson.summary ?? null,
    learningObjectives: Array.isArray(lesson.learning_objectives)
      ? lesson.learning_objectives
      : [],
    unitId: unit?.id ?? null,
    unitNumber: unit?.unit_number ?? null,
    unitTitle: unit?.title ?? null,
    gradeNumber: Number(grade?.grade_number ?? 0),
    source: {
      url: lesson.source_pdf_url ?? null,
      pageStart: lesson.source_page_start ?? null,
      pageEnd: lesson.source_page_end ?? null,
    },
  };

  if (coreCurriculumIds.has(curriculumId)) {
    core.push(item);
  } else if (officialCurriculumIds.has(curriculumId)) {
    official.push(item);
  }
}

const coreByGrade = new Map();

for (const lesson of core) {
  if (!coreByGrade.has(lesson.gradeNumber)) {
    coreByGrade.set(lesson.gradeNumber, []);
  }
  coreByGrade.get(lesson.gradeNumber).push(lesson);
}

const mappings = official.map((lesson) => {
  const candidates =
    (coreByGrade.get(lesson.gradeNumber) ?? [])
      .map((coreLesson) => ({
        coreLessonId: coreLesson.id,
        coreSlug: coreLesson.slug,
        coreTitle: coreLesson.title,
        coreLessonType: coreLesson.lessonType,
        score: Number(scorePair(lesson, coreLesson).toFixed(4)),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

  const best = candidates[0] ?? null;
  const bundle =
    coreSkillBundle(
      lesson,
      coreByGrade.get(
        lesson.gradeNumber,
      ) ?? [],
    );

  const effectiveCoverage =
    bundle.covered
      ? bundle.status
      : coverageStatus(
          lesson,
          best?.score ?? 0,
        );

  const effectiveRelation =
    bundle.covered
      ? bundle.relation
      : relationHint(
          lesson,
          best?.score ?? 0,
        );

  return {
    officialLessonId: lesson.id,
    officialSlug: lesson.slug,
    officialTitle: lesson.title,
    officialLessonType: lesson.lessonType,
    officialSummary: lesson.summary,
    officialLearningObjectives: lesson.learningObjectives,
    gradeNumber: lesson.gradeNumber,
    unitNumber: lesson.unitNumber,
    unitTitle: lesson.unitTitle,
    source: lesson.source,
    suggestedCoreLessonId: best?.coreLessonId ?? null,
    suggestedCoreSlug: best?.coreSlug ?? null,
    suggestedCoreTitle: best?.coreTitle ?? null,
    score: best?.score ?? 0,
    confidence: confidence(best?.score ?? 0),
    coverageStatus:
      effectiveCoverage,
    relationHint:
      effectiveRelation,
    skillBundle:
      bundle.items,
    needsNationalExtension:
      !bundle.covered &&
      effectiveCoverage.startsWith("gap"),
    reviewStatus: "pending",
    candidates,
  };
});

const counts = mappings.reduce(
  (acc, row) => {
    acc[row.confidence] =
      (acc[row.confidence] ?? 0) + 1;
    return acc;
  },
  {},
);

const coverageCounts =
  mappings.reduce(
    (acc, row) => {
      acc[row.coverageStatus] =
        (acc[row.coverageStatus] ?? 0) + 1;
      return acc;
    },
    {},
  );

const gapLessons =
  mappings
    .filter(
      (row) =>
        row.needsNationalExtension,
    )
    .map((row) => ({
      officialLessonId:
        row.officialLessonId,
      officialSlug:
        row.officialSlug,
      officialTitle:
        row.officialTitle,
      officialLessonType:
        row.officialLessonType,
      gradeNumber:
        row.gradeNumber,
      unitNumber:
        row.unitNumber,
      unitTitle:
        row.unitTitle,
      source:
        row.source,
      bestCandidate: {
        coreLessonId:
          row.suggestedCoreLessonId,
        coreSlug:
          row.suggestedCoreSlug,
        coreTitle:
          row.suggestedCoreTitle,
        score:
          row.score,
      },
      action:
        "create-or-review-national-extension",
      reviewStatus:
        "pending",
    }));

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  countryCode,
  academicYear,
  policy:
    "Candidate matching only. No national mapping becomes verified without human/source review. Dadyoom Core content remains original and separate from ministry textbook prose.",
  coreLessons: core.length,
  officialLessons: official.length,
  confidenceCounts: counts,
  coverageCounts,
  nationalExtensionCandidates:
    gapLessons.length,
  gapLessons,
  mappings,
};

if (writeMappings) {
  fs.mkdirSync(mappingOutputDir, { recursive: true });

  const countryName =
    countryCode === "BH"
      ? "مملكة البحرين"
      : countryCode;

  const existingGrades = new Set();

  for (const entry of fs.readdirSync(mappingOutputDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;

    try {
      const existing = JSON.parse(
        fs.readFileSync(path.join(mappingOutputDir, entry.name), "utf8"),
      );

      if (
        String(existing?.country?.code ?? "").trim().toUpperCase() === countryCode &&
        String(existing?.academicYear ?? "").trim() === academicYear &&
        Number.isInteger(Number(existing?.grade))
      ) {
        existingGrades.add(Number(existing.grade));
      }
    } catch {
      // Invalid files are reported by the national audit; do not overwrite them here.
    }
  }

  const byGrade = new Map();

  for (const row of mappings) {
    if (!byGrade.has(row.gradeNumber)) {
      byGrade.set(row.gradeNumber, []);
    }
    byGrade.get(row.gradeNumber).push(row);
  }

  for (const [gradeNumber, gradeMappings] of [...byGrade.entries()].sort(
    (a, b) => a[0] - b[0],
  )) {
    if (existingGrades.has(gradeNumber)) {
      console.log(
        `OFFICIAL_MAPPING_SKELETON_SKIPPED_EXISTING=${countryCode}:G${gradeNumber}`,
      );
      continue;
    }

    const normalizedMappings =
      gradeMappings
        .sort((a, b) => {
          const unitDelta =
            Number(a.unitNumber ?? 0) - Number(b.unitNumber ?? 0);
          if (unitDelta !== 0) return unitDelta;
          return String(a.officialTitle ?? "").localeCompare(
            String(b.officialTitle ?? ""),
            "ar",
          );
        })
        .map((row) => ({
          officialLessonId: row.officialLessonId,
          officialSlug: row.officialSlug,
          officialTitle: row.officialTitle,
          officialLessonType: row.officialLessonType,
          unitNumber: row.unitNumber,
          unitTitle: row.unitTitle,
          source: row.source,
          relationType: row.relationHint,
          reviewStatus: "candidate",
          verificationStatus: "needs-source-review",
          coverageStatus: row.coverageStatus,
          confidence: row.confidence,
          score: row.score,
          needsNationalExtension: row.needsNationalExtension,
          rationale:
            "مطابقة آلية مرشحة بالعنوان والأهداف ونوع المهارة. تتطلب مراجعة المصدر والهدف قبل التحويل إلى verified.",
          coreCoverage:
            Array.isArray(row.skillBundle) &&
            row.skillBundle.length > 0
              ? row.skillBundle.map(
                  (item) => ({
                    slug: item.coreSlug,
                    relation: row.relationHint,
                    title: item.coreTitle,
                    score: item.score,
                  }),
                )
              : row.suggestedCoreSlug
                ? [
                    {
                      slug: row.suggestedCoreSlug,
                      relation: row.relationHint,
                      title: row.suggestedCoreTitle,
                      score: row.score,
                    },
                  ]
                : [],
          candidates: row.candidates,
        }));

    const mappingFile = {
      schemaVersion: 1,
      country: {
        code: countryCode,
        nameAr: countryName,
      },
      academicYear,
      grade: gradeNumber,
      semester: null,
      subject: "اللغة العربية",
      status: "candidate",
      officialLessons: normalizedMappings.length,
      mappedLessons: normalizedMappings.length,
      verifiedLessons: 0,
      policy:
        "ملف عمل قابل للتدقيق. تم توليد المرشحات من الطبقة الوطنية الموجودة في قاعدة ضاديوم وربطها بمهارات Dadyoom Core. لا يصبح أي درس verified دون مراجعة المصدر والأهداف يدويًا/تربويًا، ولا يُعاد نشر نص الكتاب الوزاري.",
      generatedBy: "scripts/match-official-to-core.mjs",
      mappings: normalizedMappings,
    };

    const mappingTarget = path.join(
      mappingOutputDir,
      `${countryCode.toLowerCase()}-${academicYear}-g${gradeNumber}-candidate.json`,
    );

    fs.writeFileSync(
      mappingTarget,
      JSON.stringify(mappingFile, null, 2) + "\n",
      "utf8",
    );

    console.log(
      `OFFICIAL_MAPPING_SKELETON=${path.relative(process.cwd(), mappingTarget)} LESSONS=${normalizedMappings.length}`,
    );
  }
}

fs.mkdirSync(outputDir, { recursive: true });

const target = path.join(
  outputDir,
  `${countryCode.toLowerCase()}-${academicYear}-candidates.json`,
);

fs.writeFileSync(
  target,
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

console.log(`OFFICIAL_MATCH_COUNTRY=${countryCode}`);
console.log(`OFFICIAL_MATCH_CORE_LESSONS=${core.length}`);
console.log(`OFFICIAL_MATCH_OFFICIAL_LESSONS=${official.length}`);
console.log(`OFFICIAL_MATCH_REPORT=${path.relative(process.cwd(), target)}`);
console.log(`OFFICIAL_MATCH_CONFIDENCE=${JSON.stringify(counts)}`);
console.log(`OFFICIAL_MATCH_COVERAGE=${JSON.stringify(coverageCounts)}`);
console.log(`OFFICIAL_MATCH_NATIONAL_EXTENSION_CANDIDATES=${gapLessons.length}`);
console.log("OFFICIAL_MATCH_CANDIDATES=PASS");
