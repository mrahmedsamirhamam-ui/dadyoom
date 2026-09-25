import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.resolve(root, rel), "utf8"));
}

function gate(condition, message) {
  if (!condition) throw new Error(message);
}

const templates = readJson(
  "data/core-curriculum/dadyoom-core-templates-2026-2027.json",
);
const coverage = readJson(
  "data/curriculum-full20/closure-22/country-coverage.json",
);
const seedSource = fs.readFileSync(
  path.resolve(root, "scripts/seed-dadyoom-core-22.mjs"),
  "utf8",
);

gate(templates.schemaVersion === 1, "CORE_TEMPLATE_SCHEMA_INVALID");
gate(templates.academicYear === "2026-2027", "CORE_TEMPLATE_YEAR_INVALID");
gate(Array.isArray(templates.templates), "CORE_TEMPLATES_MISSING");
gate(templates.templates.length === 72, `CORE_TEMPLATES_EXPECTED_72_GOT_${templates.templates.length}`);

const keys = new Set();

for (const band of [1,2,3,4]) {
  const rows = templates.templates.filter((row) => Number(row.band) === band);
  gate(rows.length === 18, `CORE_BAND_${band}_EXPECTED_18_GOT_${rows.length}`);

  for (const unitNo of [1,2,3]) {
    const unitRows = rows.filter((row) => Number(row.unitNo) === unitNo);
    gate(unitRows.length === 6, `CORE_BAND_${band}_UNIT_${unitNo}_EXPECTED_6_GOT_${unitRows.length}`);
  }
}

for (const row of templates.templates) {
  const key = `${row.band}:${row.globalNo}`;
  gate(!keys.has(key), `CORE_TEMPLATE_DUPLICATE:${key}`);
  keys.add(key);

  for (const field of ["title","lessonType","concept","example"]) {
    gate(
      typeof row[field] === "string" && row[field].trim().length >= 3,
      `CORE_TEMPLATE_FIELD_INVALID:${key}:${field}`,
    );
  }

  gate(
    Array.isArray(row.vocabulary) && row.vocabulary.length === 3,
    `CORE_TEMPLATE_VOCAB_EXPECTED_3:${key}`,
  );

  for (const item of row.vocabulary) {
    gate(
      typeof item.word === "string" && item.word.trim() &&
      typeof item.meaning === "string" && item.meaning.trim(),
      `CORE_TEMPLATE_VOCAB_INVALID:${key}`,
    );
  }
}

gate(Array.isArray(coverage.countries) && coverage.countries.length === 22, "CORE_COVERAGE_NOT_22");
gate(
  coverage.countries.every((row) =>
    row.core?.status === "LIVE" &&
    Number(row.core?.grades) === 12 &&
    Number(row.core?.lessons) === 216
  ),
  "CORE_COVERAGE_PAYLOAD_INVALID",
);

for (const marker of [
  '"نشاط 1: اقرأ المثال بتركيز وحدد الكلمات أو التراكيب المهمة."',
  '"نشاط 2: اكتب أو قل مثالًا جديدًا من بيئتك ومدرستك، ثم راجعه مستخدمًا معيارًا واضحًا."',
  '"نشاط 3: ناقش إجابتك مع ضاد أو مع المعلم، وصحح ما يحتاج إلى تحسين."',
  "question_order:1",
  "question_order:2",
  "question_order:3",
  "question_order:4",
  "question_order:5",
  "correct_answer:\"a\"",
  "explanation:",
]) {
  gate(seedSource.includes(marker), `CORE_SEED_MARKER_MISSING:${marker}`);
}

const lessons = 22 * 12 * 18;
const questions = lessons * 5;
const vocabulary = lessons * 3;

console.log("CORE_TEMPLATE_BANK=72");
console.log("CORE_TEMPLATE_BANDS=4x18");
console.log("CORE_ACTIVITY_PROMPTS_PER_LESSON=3");
console.log("CORE_ASSESSMENT_QUESTIONS_PER_LESSON=5");
console.log(`CORE_EXPECTED_LESSONS=${lessons}`);
console.log(`CORE_EXPECTED_QUESTIONS=${questions}`);
console.log(`CORE_EXPECTED_VOCABULARY=${vocabulary}`);
console.log("CONTENT_VERIFIER=PASS");
