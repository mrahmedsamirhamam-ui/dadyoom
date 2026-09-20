import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const clean = arg.replace(/^--/, "");
    const eq = clean.indexOf("=");
    if (eq === -1) return [clean, true];
    return [clean.slice(0, eq), clean.slice(eq + 1)];
  }),
);

const COUNTRY_FILTER = String(args.country ?? "BH").toUpperCase();
const LIMIT = Math.max(0, Number(args.limit ?? 0) || 0);
const FORCE = args.force === true || String(args.force).toLowerCase() === "true";
const DRY_RUN = args["dry-run"] === true || String(args["dry-run"]).toLowerCase() === "true";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY in .env.local",
  );
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const sourceConfigPath = path.resolve(
  process.cwd(),
  "data/video-sources/countries.json",
);

const sourceConfig = JSON.parse(
  fs.readFileSync(sourceConfigPath, "utf8"),
);

const auditDir = path.resolve(
  process.cwd(),
  "diagnostics/video-search",
);

fs.mkdirSync(auditDir, { recursive: true });

const nowStamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const jsonlPath = path.join(
  auditDir,
  `lesson-video-search-${nowStamp}.jsonl`,
);

const summaryPath = path.join(
  auditDir,
  `lesson-video-search-${nowStamp}.summary.json`,
);

const AR_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const AR_PUNCT = /[“”"«»'`´،؛؟!.,:()[\]{}_\-–—/\\|+*=<>]/g;

function norm(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(AR_DIACRITICS, "")
    .replace(/\u0640/g, "")
    .replace(AR_PUNCT, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const STOP = new Set([
  "درس",
  "الدرس",
  "شرح",
  "الصف",
  "لغة",
  "اللغة",
  "العربية",
  "عربي",
  "فيديو",
  "منهج",
  "كتاب",
  "الجزء",
  "الوحدة",
  "تعليم",
  "التعليم",
  "الاول",
  "الأول",
  "الثاني",
  "الثالث",
]);

function tokens(value) {
  return norm(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP.has(token));
}

function tokenScore(a, b) {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));

  if (ta.size === 0 || tb.size === 0) {
    return 0;
  }

  let hit = 0;
  for (const token of ta) {
    if (tb.has(token)) hit += 1;
  }

  return hit / ta.size;
}

function containsAny(text, terms = []) {
  const n = norm(text);
  return terms.some((term) => {
    const t = norm(term);
    return t && n.includes(t);
  });
}

function clamp(value, min = 0, max = 0.99) {
  return Math.min(max, Math.max(min, value));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ytdlpCommands() {
  const result = [];

  if (process.env.DADYOOM_YTDLP_PYTHON) {
    result.push({
      cmd: process.env.DADYOOM_YTDLP_PYTHON,
      prefix: ["-m", "yt_dlp"],
      label: "python-module-env",
    });
  }

  result.push({
    cmd: "yt-dlp",
    prefix: [],
    label: "yt-dlp",
  });

  result.push({
    cmd: "py",
    prefix: ["-m", "yt_dlp"],
    label: "py-module",
  });

  result.push({
    cmd: "python",
    prefix: ["-m", "yt_dlp"],
    label: "python-module",
  });

  return result;
}

let workingYtDlp = null;

function runYtDlp(argsList) {
  const candidates = workingYtDlp
    ? [workingYtDlp]
    : ytdlpCommands();

  let lastError = null;

  for (const candidate of candidates) {
    try {
      const output = execFileSync(
        candidate.cmd,
        [...candidate.prefix, ...argsList],
        {
          encoding: "utf8",
          maxBuffer: 32 * 1024 * 1024,
          windowsHide: true,
          stdio: ["ignore", "pipe", "pipe"],
        },
      );

      workingYtDlp = candidate;
      return output;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("yt-dlp unavailable");
}

function probeYtDlp() {
  const version = runYtDlp(["--version"]).trim();
  console.log(`YT_DLP_VERSION=${version}`);
  console.log(`YT_DLP_MODE=${workingYtDlp?.label ?? "unknown"}`);
}

async function fetchAll(table, columns, configure = null) {
  const pageSize = 1000;
  const rows = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from(table)
      .select(columns)
      .range(from, from + pageSize - 1);

    if (configure) {
      query = configure(query);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    const batch = data ?? [];
    rows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

function normalizeChannelUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname
      .replace(/\/(videos|featured|shorts|streams)\/?$/i, "")
      .replace(/\/+$/, "");
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return String(value).trim().replace(/\/+$/, "").toLowerCase();
  }
}

function channelKeys(entry) {
  return [
    entry.channel_url,
    entry.uploader_url,
    entry.channel_id
      ? `https://www.youtube.com/channel/${entry.channel_id}`
      : "",
    entry.uploader_id && String(entry.uploader_id).startsWith("@")
      ? `https://www.youtube.com/${entry.uploader_id}`
      : "",
  ]
    .filter(Boolean)
    .map(normalizeChannelUrl);
}

async function discoverOfficialChannels(config) {
  const urls = new Set(
    (config.officialChannels ?? [])
      .map(normalizeChannelUrl)
      .filter(Boolean),
  );

  for (const sourcePage of config.officialSourcePages ?? []) {
    try {
      const response = await fetch(sourcePage, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36",
          accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });

      if (!response.ok) continue;

      const html = await response.text();

      const matches = html.match(
        /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^"'<>\\\s&]+/gi,
      ) ?? [];

      for (const item of matches) {
        const decoded = item
          .replace(/&amp;/g, "&")
          .replace(/\\u0026/g, "&");

        if (
          /youtube\.com\/(?:channel\/|@|c\/|user\/)/i.test(decoded)
        ) {
          urls.add(normalizeChannelUrl(decoded));
        }
      }
    } catch {
      // Official-channel discovery is best-effort.
    }
  }

  return [...urls];
}

function officialMatch(entry, officialChannels) {
  if (officialChannels.length === 0) return false;

  const keys = channelKeys(entry);

  return keys.some((key) =>
    officialChannels.some(
      (official) =>
        key === official ||
        key.startsWith(`${official}/`) ||
        official.startsWith(`${key}/`),
    ),
  );
}

function courseCodeFromUnit(unitTitle) {
  const match = String(unitTitle ?? "").match(/عرب\s*\d{3}/u);
  return match ? match[0].replace(/\s+/g, " ") : "";
}

function searchableLessonTitle(title) {
  return String(title ?? "")
    .replace(/^(الدرس\s+)?\d+\s*[-–—:.]\s*/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildQueries(ctx) {
  const lesson = searchableLessonTitle(ctx.lesson.title);
  const courseCode = courseCodeFromUnit(ctx.unit.title);
  const coursePart = courseCode ? ` ${courseCode}` : "";
  const gradePart = ctx.grade.grade_number
    ? ` الصف ${ctx.grade.grade_number}`
    : "";

  return {
    official:
      `${lesson}${coursePart}${gradePart} ${ctx.country.name_ar} وزارة التربية والتعليم شرح`,
    country:
      `${lesson}${coursePart}${gradePart} ${ctx.country.name_ar} شرح اللغة العربية`,
    cartoon:
      `${lesson} شرح مبسط كرتون رسوم متحركة للأطفال اللغة العربية`,
  };
}

function rejectBasic(entry) {
  if (!entry || !entry.id || !entry.title) return true;

  const duration = Number(entry.duration ?? 0);

  if (duration > 0 && duration < 60) return true;
  if (duration > 5400) return true;

  if (
    entry.is_live ||
    ["is_live", "is_upcoming", "post_live"].includes(
      String(entry.live_status ?? ""),
    )
  ) {
    return true;
  }

  if (Number(entry.age_limit ?? 0) > 0) return true;

  const combined = norm(
    `${entry.title ?? ""} ${entry.channel ?? ""} ${entry.uploader ?? ""}`,
  );

  if (
    combined.includes("shorts") ||
    combined.includes("تيك توك") ||
    combined.includes("tiktok")
  ) {
    return true;
  }

  return false;
}

function candidateText(entry) {
  return [
    entry.title,
    entry.channel,
    entry.uploader,
    entry.description,
  ]
    .filter(Boolean)
    .join(" ");
}

function scoreCandidate(entry, tier, ctx, config, officialChannels) {
  if (rejectBasic(entry)) {
    return null;
  }

  const titleSimilarity = tokenScore(
    ctx.lesson.title,
    entry.title,
  );

  const unitSimilarity = tokenScore(
    ctx.unit.title,
    `${entry.title ?? ""} ${entry.channel ?? ""}`,
  );

  const text = candidateText(entry);
  const courseCode = courseCodeFromUnit(ctx.unit.title);

  const countryEvidence =
    containsAny(text, config.countryTerms ?? []) ||
    (courseCode && norm(text).includes(norm(courseCode))) ||
    containsAny(text, config.courseMarkers ?? []);

  const cartoonEvidence =
    containsAny(text, config.cartoonTerms ?? []);

  const isOfficial = officialMatch(
    entry,
    officialChannels,
  );

  if (tier === "official_country" && !isOfficial) {
    return null;
  }

  if (
    tier === "same_country" &&
    !countryEvidence &&
    !isOfficial
  ) {
    return null;
  }

  if (
    tier === "cartoon_fallback" &&
    !cartoonEvidence
  ) {
    return null;
  }

  let score = 0;

  if (tier === "official_country") {
    score =
      0.72 +
      titleSimilarity * 0.20 +
      unitSimilarity * 0.04 +
      (isOfficial ? 0.04 : 0);
  } else if (tier === "same_country") {
    score =
      0.50 +
      titleSimilarity * 0.27 +
      unitSimilarity * 0.08 +
      (countryEvidence ? 0.10 : 0) +
      (isOfficial ? 0.04 : 0);
  } else {
    score =
      0.44 +
      titleSimilarity * 0.32 +
      unitSimilarity * 0.05 +
      (cartoonEvidence ? 0.12 : 0);
  }

  const duration = Number(entry.duration ?? 0);
  if (duration >= 120 && duration <= 2700) {
    score += 0.03;
  }

  if (titleSimilarity < 0.15 && norm(ctx.lesson.title).length > 8) {
    score -= 0.12;
  }

  return {
    entry,
    score: clamp(score),
    titleSimilarity,
    unitSimilarity,
    countryEvidence: Boolean(countryEvidence),
    cartoonEvidence: Boolean(cartoonEvidence),
    isOfficial,
  };
}

async function searchYouTube(query) {
  const output = runYtDlp([
    "--dump-single-json",
    "--flat-playlist",
    "--skip-download",
    "--no-warnings",
    "--ignore-errors",
    `ytsearch8:${query}`,
  ]);

  const parsed = JSON.parse(output || "{}");

  return Array.isArray(parsed.entries)
    ? parsed.entries.filter(Boolean)
    : [];
}

async function hydrateVideo(videoId) {
  try {
    const output = runYtDlp([
      "--dump-single-json",
      "--skip-download",
      "--no-warnings",
      "--ignore-errors",
      `https://www.youtube.com/watch?v=${videoId}`,
    ]);

    return JSON.parse(output || "{}");
  } catch {
    return null;
  }
}

function thresholdFor(tier) {
  if (tier === "official_country") return 0.74;
  if (tier === "same_country") return 0.70;
  return 0.68;
}

function publishThresholdFor(tier) {
  if (tier === "official_country") return 0.76;
  if (tier === "same_country") return 0.76;
  return 0.74;
}

async function findBestVideo(ctx, config, officialChannels) {
  const queries = buildQueries(ctx);
  const stages = [
    ["official_country", queries.official],
    ["same_country", queries.country],
    ["cartoon_fallback", queries.cartoon],
  ];

  const allConsidered = [];

  for (const [tier, query] of stages) {
    let entries = [];

    try {
      entries = await searchYouTube(query);
    } catch (error) {
      allConsidered.push({
        tier,
        query,
        error: error instanceof Error
          ? error.message
          : String(error),
      });
      continue;
    }

    const scored = entries
      .map((entry) =>
        scoreCandidate(
          entry,
          tier,
          ctx,
          config,
          officialChannels,
        ),
      )
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    allConsidered.push(
      ...scored.slice(0, 5).map((item) => ({
        tier,
        query,
        videoId: item.entry.id,
        title: item.entry.title,
        channel:
          item.entry.channel ??
          item.entry.uploader ??
          null,
        channelUrl:
          item.entry.channel_url ??
          item.entry.uploader_url ??
          null,
        score: item.score,
        titleSimilarity: item.titleSimilarity,
        unitSimilarity: item.unitSimilarity,
        countryEvidence: item.countryEvidence,
        cartoonEvidence: item.cartoonEvidence,
        isOfficial: item.isOfficial,
      })),
    );

    const best = scored[0];

    if (
      best &&
      best.score >= thresholdFor(tier)
    ) {
      const full =
        (await hydrateVideo(best.entry.id)) ??
        best.entry;

      if (rejectBasic(full)) {
        continue;
      }

      return {
        tier,
        query,
        best: {
          ...best,
          entry: {
            ...best.entry,
            ...full,
          },
        },
        considered: allConsidered,
      };
    }

    await sleep(200);
  }

  return {
    tier: null,
    query: null,
    best: null,
    considered: allConsidered,
  };
}

function publicRowFromSelection(ctx, selection) {
  const { tier, query, best, considered } = selection;
  const entry = best.entry;

  const videoId = String(entry.id);
  const videoUrl =
    `https://www.youtube.com/watch?v=${videoId}`;

  const embedUrl =
    `https://www.youtube-nocookie.com/embed/${videoId}`;

  const confidence = Number(
    best.score.toFixed(4),
  );

  const published =
    confidence >= publishThresholdFor(tier);

  const thumbnail =
    entry.thumbnail ??
    (Array.isArray(entry.thumbnails)
      ? entry.thumbnails.at(-1)?.url
      : null) ??
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const reasonByTier = {
    official_country:
      "قناة رسمية مرتبطة بمصدر تعليمي حكومي للدولة.",
    same_country:
      "الفيديو يحمل دلائل واضحة على أنه من نفس الدولة/المنهج.",
    cartoon_fallback:
      "لم يُعثر على مصدر رسمي أو محلي موثوق بما يكفي؛ استُخدم شرح كرتوني/متحرك مناسب.",
  };

  return {
    lesson_id: ctx.lesson.id,
    provider: "youtube",
    video_id: videoId,
    video_url: videoUrl,
    embed_url: embedUrl,
    title: String(entry.title ?? ctx.lesson.title),
    channel_name:
      entry.channel ??
      entry.uploader ??
      null,
    channel_url:
      entry.channel_url ??
      entry.uploader_url ??
      null,
    country_code: ctx.country.code,
    source_tier: tier,
    source_reason: reasonByTier[tier],
    confidence,
    duration_seconds:
      Number(entry.duration ?? 0) || null,
    thumbnail_url: thumbnail,
    language:
      entry.language ??
      null,
    search_query: query,
    is_official:
      tier === "official_country",
    is_cartoon:
      tier === "cartoon_fallback",
    status:
      published
        ? "published"
        : "draft",
    verified_at:
      published
        ? new Date().toISOString()
        : null,
    last_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      grade: ctx.grade.grade_number,
      unitTitle: ctx.unit.title,
      lessonNumber: ctx.lesson.lesson_number,
      searchVersion: "DADYOOM_VIDEO_SEARCH_V1",
      publishThreshold: publishThresholdFor(tier),
      alternatives: considered.slice(0, 12),
    },
  };
}

function writeAudit(row) {
  fs.appendFileSync(
    jsonlPath,
    `${JSON.stringify(row)}\n`,
    "utf8",
  );
}

async function main() {
  probeYtDlp();

  const [
    countries,
    curricula,
    grades,
    units,
    lessons,
    existingVideos,
  ] = await Promise.all([
    fetchAll(
      "countries",
      "id,code,name_ar,name_en,is_active",
      (q) => q.eq("is_active", true),
    ),
    fetchAll(
      "curricula",
      "id,country_id,name_ar,academic_year,is_active",
      (q) => q.eq("is_active", true),
    ),
    fetchAll(
      "grades",
      "id,curriculum_id,grade_number,name_ar,is_active",
      (q) => q.eq("is_active", true),
    ),
    fetchAll(
      "units",
      "id,grade_id,title,unit_number,sort_order",
    ),
    fetchAll(
      "lessons",
      "id,unit_id,title,lesson_number,status,lesson_type",
      (q) => q.eq("status", "published"),
    ),
    fetchAll(
      "lesson_videos",
      "id,lesson_id,status,video_id,source_tier,confidence",
    ),
  ]);

  const countryById = new Map(
    countries.map((x) => [x.id, x]),
  );

  const curriculumById = new Map(
    curricula.map((x) => [x.id, x]),
  );

  const gradeById = new Map(
    grades.map((x) => [x.id, x]),
  );

  const unitById = new Map(
    units.map((x) => [x.id, x]),
  );

  const existingByLesson = new Map(
    existingVideos.map((x) => [x.lesson_id, x]),
  );

  const contexts = [];

  for (const lesson of lessons) {
    const unit = unitById.get(lesson.unit_id);
    if (!unit) continue;

    const grade = gradeById.get(unit.grade_id);
    if (!grade) continue;

    const curriculum =
      curriculumById.get(grade.curriculum_id);

    if (!curriculum) continue;

    const country =
      countryById.get(curriculum.country_id);

    if (!country) continue;

    if (
      COUNTRY_FILTER !== "ALL" &&
      String(country.code).toUpperCase() !==
        COUNTRY_FILTER
    ) {
      continue;
    }

    const existing =
      existingByLesson.get(lesson.id);

    if (
      !FORCE &&
      existing &&
      existing.status === "published"
    ) {
      continue;
    }

    contexts.push({
      lesson,
      unit,
      grade,
      curriculum,
      country,
    });
  }

  contexts.sort((a, b) =>
    String(a.country.code).localeCompare(
      String(b.country.code),
    ) ||
    Number(a.grade.grade_number ?? 0) -
      Number(b.grade.grade_number ?? 0) ||
    Number(a.unit.sort_order ?? 0) -
      Number(b.unit.sort_order ?? 0) ||
    Number(a.lesson.lesson_number ?? 0) -
      Number(b.lesson.lesson_number ?? 0),
  );

  const work =
    LIMIT > 0
      ? contexts.slice(0, LIMIT)
      : contexts;

  console.log(`LESSONS_TO_PROCESS=${work.length}`);

  const officialCache = new Map();

  let published = 0;
  let draft = 0;
  let missing = 0;
  let failed = 0;

  const tierCounts = {
    official_country: 0,
    same_country: 0,
    cartoon_fallback: 0,
  };

  for (let index = 0; index < work.length; index += 1) {
    const ctx = work[index];
    const code =
      String(ctx.country.code).toUpperCase();

    const config = {
      countryAr: ctx.country.name_ar,
      countryEn: ctx.country.name_en,
      officialSourcePages: [],
      officialChannels: [],
      officialChannelHints: [],
      countryTerms: [
        ctx.country.name_ar,
        ctx.country.name_en,
      ].filter(Boolean),
      courseMarkers: [],
      cartoonTerms: [
        "كرتون",
        "رسوم متحركة",
        "للأطفال",
        "تعليمي",
        "animation",
        "animated",
      ],
      ...(sourceConfig[code] ?? {}),
    };

    if (!officialCache.has(code)) {
      officialCache.set(
        code,
        await discoverOfficialChannels(config),
      );

      console.log(
        `OFFICIAL_CHANNELS ${code}=${officialCache.get(code).length}`,
      );
    }

    const officialChannels =
      officialCache.get(code);

    const prefix =
      `[${index + 1}/${work.length}] ${code} G${ctx.grade.grade_number ?? "?"} #${ctx.lesson.lesson_number ?? "?"}`;

    try {
      const selection =
        await findBestVideo(
          ctx,
          config,
          officialChannels,
        );

      if (!selection.best) {
        missing += 1;

        writeAudit({
          status: "NO_MATCH",
          country: code,
          grade: ctx.grade.grade_number,
          lessonId: ctx.lesson.id,
          lesson: ctx.lesson.title,
          unit: ctx.unit.title,
          considered:
            selection.considered,
        });

        console.log(
          `${prefix} NO_MATCH | ${ctx.lesson.title}`,
        );

        continue;
      }

      const row =
        publicRowFromSelection(
          ctx,
          selection,
        );

      tierCounts[row.source_tier] += 1;

      if (row.status === "published") {
        published += 1;
      } else {
        draft += 1;
      }

      writeAudit({
        status: row.status,
        country: code,
        grade: ctx.grade.grade_number,
        lessonId: ctx.lesson.id,
        lesson: ctx.lesson.title,
        selected: row,
      });

      console.log(
        `${prefix} ${row.status.toUpperCase()} | ${row.source_tier} | ${(row.confidence * 100).toFixed(1)}% | ${row.title}`,
      );

      if (!DRY_RUN) {
        const { error } = await supabase
          .from("lesson_videos")
          .upsert(row, {
            onConflict: "lesson_id",
          });

        if (error) {
          throw new Error(error.message);
        }
      }
    } catch (error) {
      failed += 1;

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      writeAudit({
        status: "ERROR",
        country: code,
        grade: ctx.grade.grade_number,
        lessonId: ctx.lesson.id,
        lesson: ctx.lesson.title,
        error: message,
      });

      console.error(
        `${prefix} ERROR | ${message}`,
      );
    }

    await sleep(250);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    countryFilter: COUNTRY_FILTER,
    limit: LIMIT,
    force: FORCE,
    dryRun: DRY_RUN,
    lessonsConsidered: work.length,
    published,
    draft,
    missing,
    failed,
    tiers: tierCounts,
    auditFile: jsonlPath,
  };

  fs.writeFileSync(
    summaryPath,
    JSON.stringify(summary, null, 2),
    "utf8",
  );

  console.log("");
  console.log("===== VIDEO SEARCH SUMMARY =====");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`SUMMARY_FILE=${summaryPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});