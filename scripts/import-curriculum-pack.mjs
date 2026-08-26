
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { validateCurriculumPack } from "../lib/curriculum-packs/validate.mjs";

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const packArg = arg("--pack") || process.argv.find((item, index) => index > 1 && !item.startsWith("--"));
if (!packArg) throw new Error("Usage: node scripts/import-curriculum-pack.mjs --pack <file.json> [--apply]");
const apply = process.argv.includes("--apply");
const packFile = path.resolve(process.cwd(), packArg);
const pack = JSON.parse(fs.readFileSync(packFile, "utf8"));
const validation = validateCurriculumPack(pack);
if (!validation.ok) {
  console.error(validation.errors.join("\n"));
  throw new Error(`CURRICULUM_PACK_INVALID:${validation.errors.length}`);
}

console.log("PACK_VALID=YES");
console.log(`PACK_KEY=${pack.packKey}`);
console.log(`COUNTRY=${pack.country.code}`);
console.log(`UNITS=${pack.units.length}`);
console.log(`LESSONS=${pack.units.flatMap((u) => u.lessons).length}`);
if (!apply) {
  console.log("MODE=DRY_RUN");
  console.log("DATABASE_WRITES=NONE");
  process.exit(0);
}

loadEnv(path.resolve(process.cwd(), ".env.local"));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) throw new Error("Supabase service credentials are missing.");
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function one(table, configure) {
  const query = configure(supabase.from(table).select("*"));
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

for (const [table, columns] of [
  ["countries", "id,code,name_ar,name_en,is_active"],
  ["curricula", "id,country_id,name_ar,name_en,academic_year,is_active"],
  ["grades", "id,curriculum_id,grade_number,name_ar,name_en,sort_order,is_active"],
  ["units", "id,grade_id,title,unit_number,sort_order,description"],
  ["lessons", "id,unit_id,title,lesson_number,lesson_type,content,summary,learning_objectives,status"],
  ["questions", "id,lesson_id,question_order,question,question_type,options,correct_answer,explanation,points"],
  ["lesson_vocabulary", "id,lesson_id,word,meaning,example,display_order"],
]) {
  const { error } = await supabase.from(table).select(columns).limit(1);
  if (error) throw new Error(`PACK_SCHEMA_PREFLIGHT_FAILED:${table}:${error.message}`);
}
console.log("PACK_SCHEMA_PREFLIGHT=PASS");

fs.mkdirSync(path.resolve(process.cwd(), "_backups"), { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupFile = path.resolve(process.cwd(), "_backups", `curriculum-pack-before-${pack.country.code}-${stamp}.json`);
const snapshot = {};
for (const table of ["countries", "curricula", "grades", "units", "lessons", "questions", "lesson_vocabulary"]) {
  const { data, error } = await supabase.from(table).select("*");
  snapshot[table] = error ? { error: error.message } : data;
}
fs.writeFileSync(backupFile, JSON.stringify(snapshot, null, 2), "utf8");
console.log(`DB_BACKUP=${backupFile}`);

let country = await one("countries", (q) => q.eq("code", pack.country.code));
if (!country) {
  const { data, error } = await supabase.from("countries").insert({
    code: pack.country.code, name_ar: pack.country.nameAr, name_en: pack.country.nameEn ?? null, is_active: true,
  }).select("*").single();
  if (error) throw error;
  country = data;
}

const semesterLabel = pack.semester ? ` — الفصل ${pack.semester === 1 ? "الأول" : pack.semester === 2 ? "الثاني" : "الثالث"}` : "";
const curriculumName = `${pack.curriculum.nameAr}${semesterLabel}`;
let curriculum = await one("curricula", (q) => q.eq("country_id", country.id).eq("name_ar", curriculumName).eq("academic_year", pack.academicYear));
if (!curriculum) {
  const { data, error } = await supabase.from("curricula").insert({
    country_id: country.id,
    name_ar: curriculumName,
    name_en: pack.curriculum.nameEn ?? null,
    academic_year: pack.academicYear,
    description: [
      pack.curriculum.description ?? "",
      `المادة: ${pack.subject.nameAr}.`,
      `المرحلة: ${pack.stage.nameAr}.`,
      `مصدر الترتيب: ${pack.rights.sourceLabel}.`,
      `حقوق المحتوى التعليمي: ${pack.rights.contentOwner}.`,
    ].filter(Boolean).join(" "),
    is_active: true,
  }).select("*").single();
  if (error) throw error;
  curriculum = data;
}

let grade = await one("grades", (q) => q.eq("curriculum_id", curriculum.id).eq("grade_number", pack.grade.number));
if (!grade) {
  const { data, error } = await supabase.from("grades").insert({
    curriculum_id: curriculum.id,
    grade_number: pack.grade.number,
    name_ar: pack.grade.nameAr,
    name_en: pack.grade.nameEn ?? null,
    sort_order: pack.grade.number,
    is_active: true,
  }).select("*").single();
  if (error) throw error;
  grade = data;
}

const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1);
const ownerId = admins?.[0]?.id ?? null;
const resolvedLessonIds = [];
let insertedLessons = 0;
let enrichedLessons = 0;
let insertedQuestions = 0;
let insertedVocabulary = 0;

for (const unitPack of pack.units) {
  let unit = await one("units", (q) => q.eq("grade_id", grade.id).eq("unit_number", unitPack.number));
  if (!unit) {
    const { data, error } = await supabase.from("units").insert({
      grade_id: grade.id,
      title: unitPack.title,
      description: unitPack.description ?? `وحدة من حزمة ${pack.packKey}.`,
      unit_number: unitPack.number,
      sort_order: unitPack.number,
    }).select("*").single();
    if (error) throw error;
    unit = data;
  }

  for (const lessonPack of unitPack.lessons) {
    let lesson = await one("lessons", (q) => q.eq("unit_id", unit.id).eq("lesson_number", lessonPack.number));
    const payload = {
      unit_id: unit.id,
      title: lessonPack.title,
      slug: `${pack.packKey.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${String(lessonPack.number).padStart(2, "0")}`,
      lesson_number: lessonPack.number,
      sort_order: lessonPack.number,
      lesson_type: lessonPack.type,
      estimated_minutes: lessonPack.estimatedMinutes ?? 20,
      summary: lessonPack.summary,
      content: lessonPack.content,
      learning_objectives: lessonPack.objectives,
      instructions: ["تعلم من المحتوى أولًا.", "نفّذ الأنشطة والأسئلة بالتدرج.", "استخدم ضاد للفهم والتلميح لا لنسخ الإجابة."],
      vocabulary: lessonPack.vocabulary,
      source_page_start: lessonPack.source?.pageStart ?? null,
      source_page_end: lessonPack.source?.pageEnd ?? null,
      source_pdf_url: null,
      is_free: true,
      status: "published",
    };

    if (!lesson) {
      const { data, error } = await supabase.from("lessons").insert(ownerId ? { ...payload, created_by: ownerId } : payload).select("*").single();
      if (error) throw error;
      lesson = data;
      insertedLessons++;
    } else {
      const rich = String(lesson.content || "").trim().length >= 120 && lesson.status === "published";
      if (!rich) {
        const { data, error } = await supabase.from("lessons").update(payload).eq("id", lesson.id).select("*").single();
        if (error) throw error;
        lesson = data;
        enrichedLessons++;
      }
    }

    resolvedLessonIds.push(lesson.id);

    const { data: qRows, error: qError } = await supabase.from("questions").select("id,question,question_order").eq("lesson_id", lesson.id).order("question_order", { ascending: true });
    if (qError) throw qError;
    const existingQ = qRows || [];
    const texts = new Set(existingQ.map((q) => String(q.question || "").trim()));
    let nextOrder = existingQ.reduce((max, q) => Math.max(max, Number(q.question_order) || 0), 0) + 1;
    const needed = Math.max(0, 3 - existingQ.length);
    const rows = lessonPack.questions.filter((q) => !texts.has(q.question)).slice(0, needed).map((q) => ({
      lesson_id: lesson.id,
      question_order: nextOrder++,
      question: q.question,
      question_type: q.type,
      options: q.options,
      correct_answer: q.correctAnswer,
      explanation: q.explanation ?? null,
      points: q.points ?? 1,
    }));
    if (rows.length) {
      const { error } = await supabase.from("questions").insert(rows);
      if (error) throw error;
      insertedQuestions += rows.length;
    }

    const { data: vRows, error: vError } = await supabase.from("lesson_vocabulary").select("id,word").eq("lesson_id", lesson.id);
    if (vError) throw vError;
    const words = new Set((vRows || []).map((v) => String(v.word || "").trim()));
    const vocabularyRows = lessonPack.vocabulary.filter((v) => !words.has(v.word)).map((v, index) => ({
      lesson_id: lesson.id,
      word: v.word,
      meaning: v.meaning,
      example: v.example ?? null,
      display_order: (vRows?.length || 0) + index + 1,
    }));
    if (vocabularyRows.length) {
      const { error } = await supabase.from("lesson_vocabulary").insert(vocabularyRows);
      if (error) throw error;
      insertedVocabulary += vocabularyRows.length;
    }
  }
}

const expectedLessons = pack.units.flatMap((u) => u.lessons).length;
if (resolvedLessonIds.length !== expectedLessons) throw new Error(`PACK_GATE_FAILED: resolved ${resolvedLessonIds.length}, expected ${expectedLessons}`);
const { data: finalLessons, error: finalError } = await supabase.from("lessons").select("id,title,status,content").in("id", resolvedLessonIds).eq("status", "published");
if (finalError) throw finalError;
if ((finalLessons || []).length !== expectedLessons) throw new Error("PACK_GATE_FAILED: not all lessons published");
for (const lesson of finalLessons || []) {
  if (String(lesson.content || "").trim().length < 120) throw new Error(`PACK_GATE_FAILED: short content ${lesson.title}`);
  const { count, error } = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("lesson_id", lesson.id);
  if (error) throw error;
  if ((count || 0) < 3) throw new Error(`PACK_GATE_FAILED: <3 questions ${lesson.title}`);
}

console.log("MODE=APPLY");
console.log(`LESSONS_INSERTED=${insertedLessons}`);
console.log(`LESSONS_ENRICHED=${enrichedLessons}`);
console.log(`QUESTIONS_INSERTED=${insertedQuestions}`);
console.log(`VOCABULARY_INSERTED=${insertedVocabulary}`);
console.log(`PUBLISHED_PACK_LESSONS=${expectedLessons}`);
console.log("CURRICULUM_PACK_GATE=PASS");
