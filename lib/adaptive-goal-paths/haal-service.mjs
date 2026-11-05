/**
 * SERVER ONLY for the ungraded educational preview.
 * This file imports answer keys. Never import it from "use client" files.
 * All responses are ephemeral; real grades require authenticated server sessions,
 * per-learner access checks, persistence, and replay protection.
 */
import { DIAGNOSTIC, ANCHOR_FORMS, PRACTICE_BANK, assessQuestions, assessAnchor } from "./haal-pilot.mjs";
import { PATHS, HALL_GOAL } from "./haal-public.mjs";

const sanitized = question => ({
  id: question.id,
  stem: question.stem,
  choices: question.choices.map(({ id, label }) => ({ id, label })),
});
const safe = form => form.map(sanitized);

export function getPublicHaalPilotQuestions() {
  return {
    goalId: HALL_GOAL.id,
    diagnostic: safe(DIAGNOSTIC),
    anchorForms: ANCHOR_FORMS.map(safe),
    practice: Object.fromEntries(PATHS.map(path => [path, safe(PRACTICE_BANK[path])])),
    gradedOnServer: true,
    certifiedMasteryAvailable: false,
    storage: "none",
  };
}

const invalid = message => ({ ok: false, status: 400, error: message });
const good = data => ({ ok: true, status: 200, ...data });

function validateAnswers(questions, answers) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return false;
  const expectedIds = new Set(questions.map(q => q.id));
  const keys = Object.keys(answers);
  if (keys.length !== expectedIds.size || !keys.every(id => expectedIds.has(id))) return false;
  return questions.every(q => q.choices.some(choice => choice.id === answers[q.id]));
}

export function gradeHaalPilotRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return invalid("INVALID_BODY");
  if (body.goalId !== HALL_GOAL.id) return invalid("UNKNOWN_LEARNING_GOAL");
  if (!["diagnostic", "practice", "anchor"].includes(body.kind)) return invalid("INVALID_CHECK_KIND");
  const { kind, answers } = body;
  let questions;
  if (kind === "diagnostic") {
    if (body.path !== undefined || body.formIndex !== undefined || body.questionId !== undefined) return invalid("UNEXPECTED_OPTIONS");
    questions = DIAGNOSTIC;
  } else if (kind === "practice") {
    if (!PATHS.includes(body.path) || typeof body.questionId !== "string" || body.formIndex !== undefined) return invalid("INVALID_PATH_OR_QUESTION");
    const question = PRACTICE_BANK[body.path].find(q => q.id === body.questionId);
    if (!question) return invalid("UNKNOWN_PRACTICE_QUESTION");
    questions = [question];
  } else {
    if (!Number.isInteger(body.formIndex) || body.formIndex < 0 || body.formIndex >= ANCHOR_FORMS.length ||
        body.path !== undefined || body.questionId !== undefined) return invalid("INVALID_FORM_INDEX");
    questions = ANCHOR_FORMS[body.formIndex];
  }
  if (!validateAnswers(questions, answers)) return invalid("INCOMPLETE_OR_INVALID_CHOICES");
  const result = assessQuestions(questions, answers);

  if (kind === "diagnostic") {
    return good({
      kind, correct: result.correct, total: result.total,
      errorKinds: result.rows.filter(row => !row.correct && row.errorKind !== null).map(row => row.errorKind),
      // The learner can freely override the recommendation.
      recommendationIsBinding: false,
      certifiedMastery: false,
    });
  }
  if (kind === "practice") {
    const question = questions[0];
    return good({
      kind,
      correct: result.correct === 1,
      explanation: result.correct === 1 ? question.why : null,
      certifiedMastery: false,
    });
  }
  const check = assessAnchor(answers, questions);
  return good({
    kind,
    correct: result.correct, total: result.total,
    passedThisCheck: check.passedThisCheck,
    certifiedMastery: false,
    note: check.note,
    feedback: questions.map(q => ({ id: q.id, correct: answers[q.id] === q.correctId, explanation: q.why })),
  });
}
