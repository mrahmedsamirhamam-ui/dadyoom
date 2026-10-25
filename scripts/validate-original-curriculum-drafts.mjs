import fs from "node:fs";
import path from "node:path";

const forbiddenTitle = /(?:عنوان\\s+الدرس|اسم\\s+الكتاب|الدرس\\s+ورقمه|الصفحات|\\b(?:PAGE|PLACEHOLDER)\\b)/i;
const isText = (v) => typeof v === "string" && v.trim().length > 0;

export function validateOriginalCurriculumDrafts(input) {
  const errors = [];
  if (!input || input.schema !== "dadyoom.original-curriculum-draft.v1")
    errors.push("DRAFT_SCHEMA_INVALID");
  if (input?.publicationApproved !== false || input?.status !== "draft" ||
      input?.officialTocVerified !== false)
    errors.push("DRAFT_PUBLICATION_MUST_BE_BLOCKED");
  if (input?.contentLicense !== "Dadyoom original pedagogical content")
    errors.push("DRAFT_RIGHTS_NOT_DECLARED");
  if (input?.officialTextReproduced !== false)
    errors.push("DRAFT_CANNOT_COPY_OFFICIAL_TEXT");
  if (!/^[A-Z]{2}$/.test(input?.countryCode ?? "") ||
      !Number.isInteger(input?.grade) || input.grade < 1 || input.grade > 13 ||
      ![1, 2, 3].includes(input?.semester))
    errors.push("DRAFT_CLASSIFICATION_INVALID");
  const lessons = input?.lessons;
  if (!Array.isArray(lessons) || lessons.length === 0) {
    errors.push("DRAFT_NO_LESSONS");
    return { ok: false, errors, lessons: 0, questions: 0 };
  }
  const ids = new Set();
  let totalQuestions = 0;
  for (const lesson of lessons) {
    const prefix = isText(lesson?.id) ? lesson.id : "(missing-id)";
    if (!isText(lesson?.id) || ids.has(lesson.id)) errors.push(prefix + ":DUPLICATE_OR_MISSING_ID");
    ids.add(lesson?.id);
    if (!isText(lesson?.title) || forbiddenTitle.test(lesson.title))
      errors.push(prefix + ":PLACEHOLDER_TITLE");
    if (!isText(lesson?.content) || lesson.content.length < 900 ||
        !lesson.content.includes("## نصّ قرائي أصلي") ||
        !lesson.content.includes("## بعد القراءة"))
      errors.push(prefix + ":ORIGINAL_LESSON_CONTENT_INCOMPLETE");
    if (!Array.isArray(lesson?.objectives) || lesson.objectives.length < 3 ||
        !lesson.objectives.every(isText))
      errors.push(prefix + ":MEASURABLE_OBJECTIVES_MISSING");
    if (!Array.isArray(lesson?.vocabulary) || lesson.vocabulary.length < 3 ||
        !lesson.vocabulary.every((v) => isText(v?.word) && isText(v?.meaning)))
      errors.push(prefix + ":VOCABULARY_MISSING");
    if (lesson?.publicationApproved !== false || lesson?.alignment?.officialTocVerified !== false)
      errors.push(prefix + ":MUST_REMAIN_UNPUBLISHED_UNTIL_TOC_VERIFIED");
    const questions = lesson?.questions;
    if (!Array.isArray(questions) || questions.length < 4) {
      errors.push(prefix + ":QUESTIONS_MISSING");
      continue;
    }
    totalQuestions += questions.length;
    const qids = new Set();
    for (const question of questions) {
      const questionId = question?.id;
      if (!isText(questionId) || qids.has(questionId)) errors.push(prefix + ":QUESTION_IDS_INVALID");
      qids.add(questionId);
      const options = question?.options;
      if (question?.type !== "multiple_choice" || !isText(question?.question) ||
          !Array.isArray(options) || options.length < 3 || options.length > 6 ||
          !options.every((o) => isText(o?.id) && isText(o?.text)) ||
          new Set(options?.map((o) => o?.id)).size !== options?.length ||
          !options?.some((o) => o.id === question.correctAnswer) ||
          !isText(question?.explanation))
        errors.push(prefix + ":MCQ_NOT_SERVER_GRADABLE");
    }
  }
  return { ok: errors.length === 0, errors, lessons: lessons.length, questions: totalQuestions };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const file = path.resolve(process.cwd(), process.argv[2] ||
    "data/curriculum-drafts/bh-g2-s1-original-learning-drafts.json");
  if (process.argv.includes("--apply") || process.argv.includes("--publish")) {
    console.error("CURRICULUM_DRAFT_PUBLICATION_BLOCKED=YES");
    process.exit(1);
  }
  const source = JSON.parse(fs.readFileSync(file, "utf8"));
  const result = validateOriginalCurriculumDrafts(source);
  for (const err of result.errors) console.error("INVALID_DRAFT=" + err);
  console.log("ORIGINAL_DRAFT_LESSONS=" + result.lessons);
  console.log("ORIGINAL_DRAFT_QUESTIONS=" + result.questions);
  console.log("OFFICIAL_2026_TOC_MATCH=NOT_VERIFIED");
  console.log("DATABASE_WRITES=NONE");
  console.log("DRAFT_QUALITY_GATE=" + (result.ok ? "PASS" : "FAIL"));
  if (!result.ok) process.exitCode = 1;
}
