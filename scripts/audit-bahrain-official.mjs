import fs from "node:fs/promises";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const manifestPath =
  new URL("../public/data/bahrain/official-bahrain-2026-2027.json", import.meta.url);

const normalize = (value = "") =>
  String(value)
    .normalize("NFKC")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const grade1Pack = JSON.parse(
  await fs.readFile(
    new URL("../data/curriculum-packs/bh-2026-arabic-primary-g1-s1.json", import.meta.url),
    "utf8",
  ),
);

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error("SUPABASE_ENV_MISSING");
}

const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const { data, error } = await supabase
  .from("lessons")
  .select(
    "id,title,status,units!inner(grades!inner(grade_number,curricula!inner(academic_year,countries!inner(code))))",
  )
  .eq("units.grades.curricula.countries.code", "BH")
  .eq("units.grades.curricula.academic_year", "2026-2027");

if (error) throw error;

function publishablePlanRow(title = "") {
  const value = String(title).trim();
  if (value.length < 6) return false;

  return !(
    /(عنوان الدرس|اسم الكتاب|ورقمه)/iu.test(value) ||
    /^\s*القراءة\s*[-–]?[0-9٠-٩-]*\s*$/iu.test(value) ||
    /^\s*الدّرس\s*$/iu.test(value) ||
    /^\s*الدّرس\s+(الأوّل|الثّاني|الثّالث|الرّابع|الخامس|السّادس|السّابع|الثّامن|التّاسع|العاشر)\s*$/iu.test(value) ||
    /^\s*\)\(القراءة-/u.test(value) ||
    /^\s*\(الوحدة/u.test(value) ||
    /^\s*\)\(الوحدة/u.test(value)
  );
}

const officialByGrade = new Map();

const grade1Official = [];
for (const unit of grade1Pack.units ?? []) {
  for (const lesson of unit.lessons ?? []) {
    grade1Official.push({
      title: lesson.title,
      key: normalize(lesson.title),
      sourcePage: lesson.source?.pageStart ?? null,
    });
  }
}
officialByGrade.set(1, grade1Official);

for (const lesson of manifest.lessons ?? []) {
  const grade = Number(lesson.grade);
  if (!Number.isInteger(grade) || grade < 2 || grade > 9) continue;
  if (!publishablePlanRow(lesson.title)) continue;

  const list = officialByGrade.get(grade) ?? [];
  list.push({
    title: lesson.title,
    key: normalize(lesson.title),
    sourcePage: lesson.provenance?.source_page ?? null,
  });
  officialByGrade.set(grade, list);
}

const publishedByGrade = new Map();
for (const row of data ?? []) {
  if (row.status !== "published") continue;
  const unitRel = Array.isArray(row.units) ? row.units[0] : row.units;
  const gradeRel = Array.isArray(unitRel?.grades) ? unitRel.grades[0] : unitRel?.grades;
  const grade = Number(gradeRel?.grade_number);
  if (!Number.isInteger(grade)) continue;
  const list = publishedByGrade.get(grade) ?? [];
  list.push({
    id: row.id,
    title: row.title,
    key: normalize(row.title),
  });
  publishedByGrade.set(grade, list);
}

let failed = false;
console.log("=== BAHRAIN OFFICIAL CURRICULUM AUDIT 2026-2027 ===");

for (let grade = 1; grade <= 9; grade += 1) {
  const official = officialByGrade.get(grade) ?? [];
  const published = publishedByGrade.get(grade) ?? [];
  const publishedKeys = new Set(published.map((item) => item.key));
  const officialKeys = new Set(official.map((item) => item.key));

  const missing = official.filter((item) => !publishedKeys.has(item.key));
  const extra = published.filter((item) => !officialKeys.has(item.key));

  console.log(
    `G${grade}: official=${official.length} published=${published.length} exactMissing=${missing.length} extra=${extra.length}`,
  );

  if (missing.length > 0) {
    failed = true;
    for (const item of missing.slice(0, 12)) {
      console.log(`  MISSING: ${item.title} [page ${item.sourcePage ?? "?"}]`);
    }
  }
}

console.log(
  "Secondary G10-G12: official 2026-2027 unified-tracks plan is listed by Bahrain Edunet, but is not yet stored in this repository manifest; do not fabricate it.",
);

if (failed) {
  process.exitCode = 2;
} else {
  console.log("BASIC_CURRICULUM_AUDIT=PASS");
}
