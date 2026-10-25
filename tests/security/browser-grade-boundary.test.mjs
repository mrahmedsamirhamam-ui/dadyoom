import { describe, expect, it } from "vitest";
import {
  findDirectBrowserGradeAccess,
  isExplicitClientModule,
  PRIVATE_ASSESSMENT_TABLES,
} from "../../scripts/security/browser-assessment-boundary.mjs";

describe("private grading tables must not be read or written directly from browser modules", () => {
  it("finds an ordinary client module including a leading comment", () => {
    expect(isExplicitClientModule(
      `// An educational widget
"use client";
import { useState } from "react";`
    )).toBe(true);
    expect(isExplicitClientModule(`/* explanation */
'use client'
export default function Widget() {}`)).toBe(true);
    expect(isExplicitClientModule(`"use server";
const source = '"use client"';`)).toBe(false);
    expect(isExplicitClientModule(`function x() { "use client"; }`)).toBe(false);
  });

  it("rejects direct access to private questions, activity answers and forged scores", () => {
    const source = `"use client";
const publicQuestionKey = client.from("questions").select("correct_answer");
const activityAnswer = client.from('lesson_activities').select("answer");
const grade = client
  .from("question_attempts")
  .insert({ is_correct: true });
const game = client["from"]("edu_game_attempts").insert({ xp: 5000 });`;
    expect(findDirectBrowserGradeAccess(source).map(x => x.table)).toEqual([
      "questions", "lesson_activities", "question_attempts", "edu_game_attempts",
    ]);
    for (const row of findDirectBrowserGradeAccess(source)) {
      expect(row.line).toBeGreaterThan(1);
    }
  });

  it("permits only learner-safe views and server-authenticated grade operations", () => {
    const safeView = `"use client";
const { data } = await supabase.from("dadyoom_student_questions").select("id,question");`;
    expect(findDirectBrowserGradeAccess(safeView)).toEqual([]);
    const serverAction = `"use server";
const { error } = await admin.from("question_attempts").insert({is_correct:true});`;
    expect(findDirectBrowserGradeAccess(serverAction)).toEqual([]);
    const serverRoute = `import "server-only";
const keys = await admin.from("questions").select("correct_answer");`;
    expect(findDirectBrowserGradeAccess(serverRoute)).toEqual([]);
  });

  it("preserves fail-closed private table coverage for every grading result table", () => {
    for (const table of [
      "question_attempts",
      "lesson_activity_attempts",
      "student_lesson_progress",
      "lesson_mastery",
      "assessment_sessions",
      "assessment_session_answers",
      "edu_game_attempts",
    ]) {
      expect(PRIVATE_ASSESSMENT_TABLES.has(table)).toBe(true);
      expect(findDirectBrowserGradeAccess(
        `'use client';\nsupabase.from('${table}').update({score:100});`
      )).toHaveLength(1);
    }
  });
});
