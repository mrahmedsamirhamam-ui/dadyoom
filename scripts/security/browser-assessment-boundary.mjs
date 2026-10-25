// Conservative static tripwire for directly querying private grading tables
// inside "use client" source modules. This is NOT a replacement for RLS,
// column grants, server-only module boundaries or authenticated E2E testing.
export const PRIVATE_ASSESSMENT_TABLES = new Set([
  "questions",
  "lesson_activities",
  "ai_assessments",
  "question_attempts",
  "lesson_activity_attempts",
  "student_lesson_progress",
  "lesson_mastery",
  "assessment_sessions",
  "assessment_session_answers",
  "edu_game_attempts",
  "student_progress",
  "student_skill_progress",
  "lesson_progress",
  "edu_learner_progress",
  "quiz_attempts",
]);

export function isExplicitClientModule(source) {
  // A module may have explanatory comments before its client directive.
  // A 'use client' token in the middle of a normal function is not a directive.
  const prefix = source
    .replace(/^\uFEFF/, "")
    .replace(/^(?:(?:\s*\/\/[^\n]*\n)|(?:\s*\/\*[\s\S]*?\*\/))*/, "")
    .trimStart();
  return /^(?:"use client"|'use client')\s*;?\s*(?:\r?\n|$)/.test(prefix);
}

export function findDirectBrowserGradeAccess(source) {
  if (!isExplicitClientModule(source)) return [];

  const findings = [];
  // Catch both supabase.from("questions") and supabase["from"]("questions").
  // Direct literal calls only: aliasing/dynamic names require manual review.
  const regex = /(?:\.\s*(from)|\[\s*["'](from)["']\s*\])\s*\(\s*["']([a-zA-Z][a-zA-Z0-9_]*)["']/g;
  for (const match of source.matchAll(regex)) {
    const table = match[3];
    if (!PRIVATE_ASSESSMENT_TABLES.has(table)) continue;
    const line = source.slice(0, match.index).split("\n").length;
    findings.push({ table, line });
  }
  return findings;
}
