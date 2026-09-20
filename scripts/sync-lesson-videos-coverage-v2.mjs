import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const COUNTRY = String(process.argv[2] || "BH").toUpperCase();
const FORCE = process.argv.includes("--force");

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase URL/service key in .env.local");
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const auditDir = path.resolve("diagnostics/video-search-v2");
fs.mkdirSync(auditDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const auditFile = path.join(auditDir, `coverage-${stamp}.jsonl`);
const summaryFile = path.join(auditDir, `coverage-${stamp}.summary.json`);

const AR_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const AR_PUNCT = /[“”"«»'`´،؛؟!.,:()[\]{}_\-–—/\\|+*=<>]/g;

function norm(v) {
  return String(v ?? "")
    .normalize("NFKC")
    .replace(AR_DIACRITICS, "")
    .replace(/\u0640/g, "")
    .replace(AR_PUNCT, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const STOP = new Set([
  "درس","الدرس","شرح","الصف","لغة","اللغة","العربية","عربي",
  "كتاب","الجزء","الوحدة","تعليم","التعليم","الاول","الأول",
  "الثاني","الثالث","القراءة","التدريبات"
]);

function tokens(v) {
  return norm(v).split(" ").filter(x => x.length > 1 && !STOP.has(x));
}

function tokenScore(a, b) {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const x of A) if (B.has(x)) hit++;
  return hit / A.size;
}

function containsAny(text, terms) {
  const n = norm(text);
  return terms.some(t => n.includes(norm(t)));
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

let workingYtDlp = null;

function ytdlpCandidates() {
  const out = [];
  if (process.env.DADYOOM_YTDLP_PYTHON) {
    out.push({ cmd: process.env.DADYOOM_YTDLP_PYTHON, prefix: ["-m","yt_dlp"] });
  }
  out.push({ cmd: "yt-dlp", prefix: [] });
  out.push({ cmd: "py", prefix: ["-m","yt_dlp"] });
  out.push({ cmd: "python", prefix: ["-m","yt_dlp"] });
  return out;
}

function runYtDlp(args) {
  const list = workingYtDlp ? [workingYtDlp] : ytdlpCandidates();
  let last = null;
  for (const c of list) {
    try {
      const s = execFileSync(c.cmd, [...c.prefix, ...args], {
        encoding: "utf8",
        maxBuffer: 48 * 1024 * 1024,
        windowsHide: true,
        stdio: ["ignore","pipe","pipe"],
      });
      workingYtDlp = c;
      return s;
    } catch (e) {
      last = e;
    }
  }
  throw last ?? new Error("yt-dlp unavailable");
}

function rejectBasic(e) {
  if (!e?.id || !e?.title) return true;
  const d = Number(e.duration ?? 0);
  if (d > 0 && d < 60) return true;
  if (d > 5400) return true;
  if (e.is_live) return true;
  if (["is_live","is_upcoming","post_live"].includes(String(e.live_status ?? ""))) return true;
  if (Number(e.age_limit ?? 0) > 0) return true;
  const t = norm(`${e.title ?? ""} ${e.channel ?? ""} ${e.uploader ?? ""}`);
  if (t.includes("shorts") || t.includes("tiktok") || t.includes("تيك توك")) return true;
  return false;
}

async function search(q, count = 10) {
  const raw = runYtDlp([
    "--dump-single-json",
    "--flat-playlist",
    "--skip-download",
    "--no-warnings",
    "--ignore-errors",
    `ytsearch${count}:${q}`,
  ]);
  const j = JSON.parse(raw || "{}");
  return Array.isArray(j.entries) ? j.entries.filter(Boolean) : [];
}

async function hydrate(id) {
  try {
    const raw = runYtDlp([
      "--dump-single-json",
      "--skip-download",
      "--no-warnings",
      "--ignore-errors",
      `https://www.youtube.com/watch?v=${id}`,
    ]);
    return JSON.parse(raw || "{}");
  } catch {
    return null;
  }
}

async function fetchAll(table, columns, configure) {
  const rows = [];
  let from = 0;
  const size = 1000;
  while (true) {
    let q = supabase.from(table).select(columns).range(from, from + size - 1);
    if (configure) q = configure(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < size) break;
    from += size;
  }
  return rows;
}

function cleanTitle(v) {
  return String(v ?? "")
    .replace(/\b\d+\s*[-–]\s*\d+\b/gu, " ")
    .replace(/\b\d+\b/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function typeTerms(type, title) {
  const t = norm(`${type ?? ""} ${title ?? ""}`);
  if (t.includes("grammar") || t.includes("قواعد") || t.includes("نحو") || t.includes("نحويه"))
    return "قواعد النحو";
  if (t.includes("writing") || t.includes("كتابي") || t.includes("تعبير") || t.includes("انتاج"))
    return "التعبير والكتابة";
  if (t.includes("املاء") || t.includes("إملاء"))
    return "الإملاء";
  if (t.includes("شعر") || t.includes("قصيده") || t.includes("قصيدة"))
    return "شرح النص الشعري";
  return "القراءة والفهم";
}

function gradeWords(n) {
  const m = {
    1:"الأول الابتدائي",2:"الثاني الابتدائي",3:"الثالث الابتدائي",
    4:"الرابع الابتدائي",5:"الخامس الابتدائي",6:"السادس الابتدائي",
    7:"الأول الإعدادي",8:"الثاني الإعدادي",9:"الثالث الإعدادي",
    10:"الأول الثانوي",11:"الثاني الثانوي",12:"الثالث الثانوي"
  };
  return m[Number(n)] ?? `الصف ${n}`;
}

function candidateScore(entry, ctx, mode) {
  if (rejectBasic(entry)) return -1;
  const text = `${entry.title ?? ""} ${entry.channel ?? ""} ${entry.uploader ?? ""}`;
  const sim = tokenScore(ctx.lesson.title, entry.title);
  const country = containsAny(text, ["البحرين","bahrain","عرب101","عرب201","عرب213","عرب301","عرب221"]);
  const cartoon = containsAny(text, ["كرتون","رسوم متحركة","للأطفال","تعليمي","animated","animation"]);
  const grade = containsAny(text, [gradeWords(ctx.grade.grade_number), `الصف ${ctx.grade.grade_number}`]);
  let s = 0;

  if (mode === "same_country") s = 0.48 + sim*0.34 + (country?0.12:0) + (grade?0.04:0);
  else if (mode === "exact_arabic") s = 0.38 + sim*0.48 + (grade?0.06:0);
  else if (mode === "cartoon") s = 0.34 + sim*0.40 + (cartoon?0.14:0) + (grade?0.04:0);
  else s = 0.44 + (grade?0.10:0) + (containsAny(text,[typeTerms(ctx.lesson.lesson_type, ctx.lesson.title)])?0.12:0) + sim*0.14;

  const d = Number(entry.duration ?? 0);
  if (d >= 120 && d <= 2700) s += 0.03;
  return Math.max(0, Math.min(0.99, s));
}

async function pick(ctx) {
  const title = cleanTitle(ctx.lesson.title);
  const grade = gradeWords(ctx.grade.grade_number);
  const skill = typeTerms(ctx.lesson.lesson_type, ctx.lesson.title);

  const stages = [
    {
      mode: "same_country",
      tier: "same_country",
      min: 0.62,
      q: `${title} ${grade} البحرين شرح اللغة العربية`,
      reason: "شرح مطابق أو قريب من نفس الدولة/المنهج.",
    },
    {
      mode: "exact_arabic",
      tier: "manual",
      min: 0.52,
      q: `${title} ${grade} شرح اللغة العربية`,
      reason: "شرح عربي مطابق لعنوان الدرس بعد عدم توفر تطابق محلي قوي.",
    },
    {
      mode: "cartoon",
      tier: "cartoon_fallback",
      min: 0.48,
      q: `${title} شرح مبسط كرتون تعليمي اللغة العربية`,
      reason: "شرح مبسط/كرتوني قريب من موضوع الدرس.",
    },
    {
      mode: "generic",
      tier: "manual",
      min: 0.42,
      q: `${skill} ${grade} شرح مبسط اللغة العربية`,
      reason: "فيديو تعليمي احتياطي مناسب لنوع الدرس والمرحلة.",
    },
  ];

  const considered = [];

  for (const stage of stages) {
    let entries = [];
    try {
      entries = await search(stage.q, 10);
    } catch (e) {
      considered.push({ mode: stage.mode, query: stage.q, error: String(e) });
      continue;
    }

    const scored = entries
      .map(e => ({ e, score: candidateScore(e, ctx, stage.mode) }))
      .filter(x => x.score >= 0)
      .sort((a,b) => b.score - a.score);

    considered.push(...scored.slice(0,5).map(x => ({
      mode: stage.mode,
      query: stage.q,
      id: x.e.id,
      title: x.e.title,
      channel: x.e.channel ?? x.e.uploader ?? null,
      score: x.score,
    })));

    const best = scored[0];
    if (!best || best.score < stage.min) {
      await sleep(120);
      continue;
    }

    const full = (await hydrate(best.e.id)) ?? best.e;
    if (rejectBasic(full)) continue;

    return {
      stage,
      best: { e: { ...best.e, ...full }, score: best.score },
      considered,
    };
  }

  // Last-resort coverage: choose the best safe Arabic educational result.
  const fallbackQuery = `${skill} ${grade} اللغة العربية`;
  let fallback = [];
  try {
    fallback = await search(fallbackQuery, 12);
  } catch {}

  const safe = fallback
    .filter(e => !rejectBasic(e))
    .map(e => ({ e, score: candidateScore(e, ctx, "generic") }))
    .sort((a,b) => b.score - a.score);

  if (safe[0]) {
    const full = (await hydrate(safe[0].e.id)) ?? safe[0].e;
    return {
      stage: {
        mode: "generic",
        tier: "manual",
        min: 0,
        q: fallbackQuery,
        reason: "فيديو تعليمي عام للمهارة والمرحلة لضمان وجود خيار مشاهدة للدرس.",
      },
      best: { e: { ...safe[0].e, ...full }, score: Math.max(0.40, safe[0].score) },
      considered,
    };
  }

  return null;
}

function rowFrom(ctx, sel) {
  const e = sel.best.e;
  const id = String(e.id);
  const confidence = Number(sel.best.score.toFixed(4));
  const thumbnail =
    e.thumbnail ??
    (Array.isArray(e.thumbnails) ? e.thumbnails.at(-1)?.url : null) ??
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  return {
    lesson_id: ctx.lesson.id,
    provider: "youtube",
    video_id: id,
    video_url: `https://www.youtube.com/watch?v=${id}`,
    embed_url: `https://www.youtube-nocookie.com/embed/${id}`,
    title: String(e.title ?? ctx.lesson.title),
    channel_name: e.channel ?? e.uploader ?? null,
    channel_url: e.channel_url ?? e.uploader_url ?? null,
    country_code: ctx.country.code,
    source_tier: sel.stage.tier,
    source_reason: sel.stage.reason,
    confidence,
    duration_seconds: Number(e.duration ?? 0) || null,
    thumbnail_url: thumbnail,
    language: e.language ?? null,
    search_query: sel.stage.q,
    is_official: false,
    is_cartoon: sel.stage.tier === "cartoon_fallback",
    status: "published",
    verified_at: new Date().toISOString(),
    last_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      grade: ctx.grade.grade_number,
      unitTitle: ctx.unit.title,
      lessonNumber: ctx.lesson.lesson_number,
      searchVersion: "DADYOOM_VIDEO_COVERAGE_V2",
      fallbackMode: sel.stage.mode,
      alternatives: sel.considered.slice(0,12),
    },
  };
}

function audit(obj) {
  fs.appendFileSync(auditFile, JSON.stringify(obj) + "\n", "utf8");
}

async function main() {
  console.log(`YT_DLP_VERSION=${runYtDlp(["--version"]).trim()}`);

  const [countries, curricula, grades, units, lessons, existing] = await Promise.all([
    fetchAll("countries","id,code,name_ar,name_en,is_active",q=>q.eq("is_active",true)),
    fetchAll("curricula","id,country_id,name_ar,academic_year,is_active",q=>q.eq("is_active",true)),
    fetchAll("grades","id,curriculum_id,grade_number,name_ar,is_active",q=>q.eq("is_active",true)),
    fetchAll("units","id,grade_id,title,unit_number,sort_order"),
    fetchAll("lessons","id,unit_id,title,lesson_number,status,lesson_type",q=>q.eq("status","published")),
    fetchAll("lesson_videos","id,lesson_id,status,video_id,source_tier,confidence"),
  ]);

  const cById = new Map(countries.map(x=>[x.id,x]));
  const cuById = new Map(curricula.map(x=>[x.id,x]));
  const gById = new Map(grades.map(x=>[x.id,x]));
  const uById = new Map(units.map(x=>[x.id,x]));
  const existingByLesson = new Map(existing.map(x=>[x.lesson_id,x]));

  const contexts = [];
  for (const lesson of lessons) {
    const unit = uById.get(lesson.unit_id); if (!unit) continue;
    const grade = gById.get(unit.grade_id); if (!grade) continue;
    const curriculum = cuById.get(grade.curriculum_id); if (!curriculum) continue;
    const country = cById.get(curriculum.country_id); if (!country) continue;
    if (String(country.code).toUpperCase() !== COUNTRY) continue;

    const old = existingByLesson.get(lesson.id);
    if (!FORCE && old?.status === "published") continue;

    contexts.push({ lesson, unit, grade, curriculum, country });
  }

  contexts.sort((a,b)=>
    Number(a.grade.grade_number)-Number(b.grade.grade_number) ||
    Number(a.unit.sort_order ?? 0)-Number(b.unit.sort_order ?? 0) ||
    Number(a.lesson.lesson_number ?? 0)-Number(b.lesson.lesson_number ?? 0)
  );

  console.log(`LESSONS_TO_PROCESS=${contexts.length}`);

  let ok = 0, failed = 0;

  for (let i=0; i<contexts.length; i++) {
    const ctx = contexts[i];
    const prefix = `[${i+1}/${contexts.length}] ${COUNTRY} G${ctx.grade.grade_number} #${ctx.lesson.lesson_number ?? "?"}`;

    try {
      const sel = await pick(ctx);
      if (!sel) {
        failed++;
        audit({status:"NO_MATCH",lessonId:ctx.lesson.id,lesson:ctx.lesson.title,grade:ctx.grade.grade_number});
        console.log(`${prefix} NO_MATCH | ${ctx.lesson.title}`);
        continue;
      }

      const row = rowFrom(ctx, sel);
      const { error } = await supabase.from("lesson_videos").upsert(row,{onConflict:"lesson_id"});
      if (error) throw new Error(error.message);

      ok++;
      audit({status:"published",lessonId:ctx.lesson.id,lesson:ctx.lesson.title,selected:row});
      console.log(`${prefix} PUBLISHED | ${row.source_tier} | ${(row.confidence*100).toFixed(1)}% | ${row.title}`);
    } catch (e) {
      failed++;
      const msg = e instanceof Error ? e.message : String(e);
      audit({status:"ERROR",lessonId:ctx.lesson.id,lesson:ctx.lesson.title,error:msg});
      console.error(`${prefix} ERROR | ${msg}`);
    }

    await sleep(150);
  }

  const { data: allLessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id,unit_id,status")
    .eq("status","published");
  if (lessonsError) throw lessonsError;

  const unitIds = [...new Set((allLessons ?? []).map(x=>x.unit_id))];
  const { data: units2, error: unitsError } = await supabase
    .from("units").select("id,grade_id").in("id",unitIds);
  if (unitsError) throw unitsError;

  const gradeIds = [...new Set((units2 ?? []).map(x=>x.grade_id))];
  const { data: grades2, error: gradesError } = await supabase
    .from("grades").select("id,curriculum_id,grade_number").in("id",gradeIds);
  if (gradesError) throw gradesError;

  const curriculumIds = [...new Set((grades2 ?? []).map(x=>x.curriculum_id))];
  const { data: curricula2, error: curriculaError } = await supabase
    .from("curricula").select("id,country_id").in("id",curriculumIds);
  if (curriculaError) throw curriculaError;

  const countryIds = [...new Set((curricula2 ?? []).map(x=>x.country_id))];
  const { data: countries2, error: countriesError } = await supabase
    .from("countries").select("id,code").in("id",countryIds);
  if (countriesError) throw countriesError;

  const countryId = (countries2 ?? []).find(x=>String(x.code).toUpperCase()===COUNTRY)?.id;
  const countryCurricula = new Set((curricula2 ?? []).filter(x=>x.country_id===countryId).map(x=>x.id));
  const countryGrades = new Set((grades2 ?? []).filter(x=>countryCurricula.has(x.curriculum_id)).map(x=>x.id));
  const countryUnits = new Set((units2 ?? []).filter(x=>countryGrades.has(x.grade_id)).map(x=>x.id));
  const lessonIds = (allLessons ?? []).filter(x=>countryUnits.has(x.unit_id)).map(x=>x.id);

  const { data: videos, error: videosError } = await supabase
    .from("lesson_videos")
    .select("lesson_id,status,source_tier,confidence")
    .in("lesson_id",lessonIds);
  if (videosError) throw videosError;

  const publishedSet = new Set((videos ?? []).filter(x=>x.status==="published").map(x=>x.lesson_id));
  const totalLessons = lessonIds.length;
  const publishedVideos = publishedSet.size;
  const missing = lessonIds.filter(id=>!publishedSet.has(id));

  const summary = {
    country: COUNTRY,
    publishedLessons: totalLessons,
    publishedVideos,
    missingVideos: missing.length,
    processedNow: contexts.length,
    selectedNow: ok,
    failedNow: failed,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(summaryFile, JSON.stringify(summary,null,2), "utf8");
  console.log(`SUMMARY=${JSON.stringify(summary)}`);
  console.log(`SUMMARY_FILE=${summaryFile}`);

  if (publishedVideos !== totalLessons) {
    throw new Error(`VIDEO_COVERAGE_INCOMPLETE ${publishedVideos}/${totalLessons}`);
  }

  console.log(`VIDEO_COVERAGE_OK=${publishedVideos}/${totalLessons}`);
}

main().catch(e=>{
  console.error(e);
  process.exit(1);
});