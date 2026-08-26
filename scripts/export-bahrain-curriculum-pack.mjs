
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { validateCurriculumPack } from "../lib/curriculum-packs/validate.mjs";

function loadEnv(file) {
  const text = fs.readFileSync(file, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnv(path.resolve(process.cwd(), ".env.local"));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) throw new Error("Supabase service credentials are missing.");
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: countries, error: countryError } = await supabase.from("countries").select("id,code,name_ar,name_en").eq("code", "BH").limit(1);
if (countryError) throw countryError;
const country = countries?.[0]; if (!country) throw new Error("Bahrain not found");
const { data: curricula, error: currError } = await supabase.from("curricula").select("*").eq("country_id", country.id).eq("name_ar", "اللغة العربية — الفصل الأول").limit(1);
if (currError) throw currError;
const curriculum = curricula?.[0]; if (!curriculum) throw new Error("Bahrain MVP curriculum not found");
const { data: grades, error: gradeError } = await supabase.from("grades").select("*").eq("curriculum_id", curriculum.id).eq("grade_number", 1).limit(1);
if (gradeError) throw gradeError;
const grade = grades?.[0]; if (!grade) throw new Error("Bahrain grade 1 not found");
const { data: units, error: unitError } = await supabase.from("units").select("*").eq("grade_id", grade.id).order("unit_number", { ascending: true });
if (unitError) throw unitError;

const packUnits = [];
for (const unit of units || []) {
  const { data: lessons, error: lessonError } = await supabase.from("lessons").select("*").eq("unit_id", unit.id).eq("status", "published").order("lesson_number", { ascending: true });
  if (lessonError) throw lessonError;
  const packLessons = [];
  for (const lesson of lessons || []) {
    const { data: questions, error: qError } = await supabase.from("questions").select("*").eq("lesson_id", lesson.id).order("question_order", { ascending: true });
    if (qError) throw qError;
    const { data: vocab, error: vError } = await supabase.from("lesson_vocabulary").select("*").eq("lesson_id", lesson.id).order("display_order", { ascending: true });
    if (vError) throw vError;
    packLessons.push({
      number: Number(lesson.lesson_number), title: lesson.title, type: lesson.lesson_type,
      estimatedMinutes: Number(lesson.estimated_minutes || 20), summary: lesson.summary || lesson.title,
      content: lesson.content || "", objectives: Array.isArray(lesson.learning_objectives) ? lesson.learning_objectives : [],
      vocabulary: (vocab || []).map((v) => ({ word: v.word, meaning: v.meaning, example: v.example })),
      questions: (questions || []).map((q) => ({ question: q.question, type: q.question_type, options: Array.isArray(q.options) ? q.options : [], correctAnswer: q.correct_answer, explanation: q.explanation, points: q.points })),
      source: { label: "مسار ضاديوم التعليمي للبحرين", url: null, pageStart: lesson.source_page_start, pageEnd: lesson.source_page_end },
    });
  }
  packUnits.push({ number: Number(unit.unit_number), title: unit.title, description: unit.description, lessons: packLessons });
}

const pack = {
  schemaVersion: 1,
  packKey: "BH:2026:arabic:primary:1:s1",
  country: { code: "BH", nameAr: "مملكة البحرين", nameEn: "Kingdom of Bahrain" },
  academicYear: curriculum.academic_year || "2026",
  subject: { code: "arabic", nameAr: "اللغة العربية" },
  stage: { code: "primary", nameAr: "المرحلة الابتدائية" },
  grade: { number: 1, nameAr: grade.name_ar, nameEn: grade.name_en },
  semester: 1,
  curriculum: { nameAr: "اللغة العربية", nameEn: "Arabic Language", description: curriculum.description },
  rights: { contentOwner: "dadyoom", sourceLabel: "ترتيب منهجي موثّق ومحتوى تعليمي أصلي لضاديوم", sourceUrl: null, verified: true },
  units: packUnits,
};
const validation = validateCurriculumPack(pack);
if (!validation.ok) { console.error(validation.errors.join("\n")); throw new Error(`EXPORT_PACK_INVALID:${validation.errors.length}`); }
const out = path.resolve(process.cwd(), "data/curriculum-packs/bh-2026-arabic-primary-g1-s1.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(pack, null, 2), "utf8");
console.log(`PACK_EXPORTED=${out}`);
console.log(`PACK_LESSONS=${pack.units.flatMap((u) => u.lessons).length}`);
console.log("PACK_EXPORT_GATE=PASS");
