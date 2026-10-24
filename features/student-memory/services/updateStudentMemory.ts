import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type UpdateStudentMemoryParams = {
  /** Pass only the trusted server Supabase client. */
  supabase: SupabaseClient;
  /** The authenticated user.id, never request-body studentId. */
  studentId: string;
  /** The authenticated user.email, never request-body email. */
  studentEmail: string;
};

type SavedAnswer = {
  assessment_id: string;
  lesson_id: string;
  session_id: string;
  selected_answer: number;
};

type AssessmentKey = {
  id: string;
  lesson_id: string | null;
  student_email: string;
  correct_answer: number;
  skill: string | null;
  completed: boolean | null;
};

type OwnedSession = {
  id: string;
  lesson_id: string;
};

const ANSWERS_PAGE_SIZE = 500;
const PRIVATE_LOOKUP_BATCH = 100;
const MAX_ANSWERS = 20000;

function groupsOf<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

/**
 * Recompute student memory using published server-graded answer keys.
 * NEVER trust assessment_session_answers.is_correct, .correct_answer or
 * .skill: browser role grants on those columns have not yet been revoked.
 *
 * SECURITY LIMITATION: selected_answer, session_id and lesson_id remain
 * browser-writable in today's production grants. Recomputing keys here
 * removes one forgery vector but does NOT replace the planned ACL cutover.
 * All reads/writes MUST be from the authenticated server-only admin client.
 */
export async function updateStudentMemory({
  supabase,
  studentId,
  studentEmail,
}: UpdateStudentMemoryParams) {
  const id = studentId.trim();
  const email = studentEmail.trim();
  if (!id || !email) {
    throw new Error("Student identity is required for verified memory.");
  }

  const answers: SavedAnswer[] = [];
  // PostgREST can cap SELECT at 1,000 rows. Explicit bounded paging prevents
  // silently computing "all-time" student memory from just the first 1,000.
  for (let offset = 0; offset <= MAX_ANSWERS; offset += ANSWERS_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("assessment_session_answers")
      .select("assessment_id,lesson_id,session_id,selected_answer")
      .eq("student_id", id)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + ANSWERS_PAGE_SIZE - 1);

    if (error) throw error;
    const page = (data ?? []) as SavedAnswer[];
    answers.push(...page);
    if (answers.length > MAX_ANSWERS) {
      throw new Error("Student memory exceeds the safe batch limit.");
    }
    if (page.length < ANSWERS_PAGE_SIZE) break;
  }

  if (answers.length === 0) return [];

  const uniqueQuestionIds = Array.from(new Set(
    answers.map((answer) => answer.assessment_id)
  ));
  const uniqueSessionIds = Array.from(new Set(
    answers.map((answer) => answer.session_id)
  ));

  const keys = new Map<string, AssessmentKey>();
  for (const ids of groupsOf(uniqueQuestionIds, PRIVATE_LOOKUP_BATCH)) {
    const { data, error } = await supabase
      .from("ai_assessments")
      .select("id,lesson_id,student_email,correct_answer,skill,completed")
      .eq("student_email", email)
      .in("id", ids);
    if (error) throw error;
    for (const row of (data ?? []) as AssessmentKey[]) {
      if (!ids.includes(row.id) || keys.has(row.id)) {
        throw new Error("Inconsistent private assessment evidence.");
      }
      keys.set(row.id, row);
    }
  }

  const sessions = new Map<string, OwnedSession>();
  for (const ids of groupsOf(uniqueSessionIds, PRIVATE_LOOKUP_BATCH)) {
    const { data, error } = await supabase
      .from("assessment_sessions")
      .select("id,lesson_id")
      .eq("student_id", id)
      .in("id", ids);
    if (error) throw error;
    for (const row of (data ?? []) as OwnedSession[]) {
      if (!ids.includes(row.id) || sessions.has(row.id)) {
        throw new Error("Inconsistent assessment session evidence.");
      }
      sessions.set(row.id, row);
    }
  }

  if (
    keys.size !== uniqueQuestionIds.length ||
    sessions.size !== uniqueSessionIds.length
  ) {
    throw new Error("Unverifiable student assessment history.");
  }

  const skills = new Map<string, { total: number; correct: number }>();
  for (const answer of answers) {
    const key = keys.get(answer.assessment_id);
    const session = sessions.get(answer.session_id);
    if (
      !key || !session || key.completed !== true ||
      key.student_email !== email ||
      key.lesson_id !== answer.lesson_id ||
      session.lesson_id !== answer.lesson_id ||
      !Number.isSafeInteger(answer.selected_answer) ||
      answer.selected_answer < 0 ||
      !Number.isSafeInteger(key.correct_answer) ||
      key.correct_answer < 0
    ) {
      throw new Error("Unverifiable student memory answer.");
    }

    const skill = typeof key.skill === "string" && key.skill.trim()
      ? key.skill.trim()
      : "الاستيعاب";
    const current = skills.get(skill) ?? { total: 0, correct: 0 };
    current.total += 1;
    if (answer.selected_answer === key.correct_answer) {
      current.correct += 1;
    }
    skills.set(skill, current);
  }

  const now = new Date().toISOString();
  const memory = Array.from(skills, ([skill, value]) => ({
    student_id: id,
    skill,
    score: Math.round(value.correct / value.total * 100),
    attempts: value.total,
    updated_at: now,
  }));

  const { error: writeError } = await supabase
    .from("student_memory")
    .upsert(memory, { onConflict: "student_id,skill" });
  if (writeError) throw writeError;

  return memory;
}
