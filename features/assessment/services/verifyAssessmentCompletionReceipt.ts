import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Receipt is an optional, rollout-gated recovery mechanism.
 *
 * IMPORTANT: enable only after live assessment_sessions and
 * assessment_session_answers INSERT/UPDATE/DELETE/TRUNCATE have been revoked
 * from browser roles, and the new receipts table has no browser write grants.
 * Otherwise the client-modifiable session can manufacture false evidence.
 */
type FinishedSession = {
  id: string;
  student_id?: string;
  lesson_id: string;
  finished: boolean;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
};

type TrustedAnalytics = {
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
};

type ReceiptRow = {
  session_id: string;
  student_id: string;
  lesson_id: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
};

type Params = {
  admin: SupabaseClient;
  session: FinishedSession;
  studentId: string;
  lessonId: string;
  analytics: TrustedAnalytics;
  allowCreate: boolean;
};

function validNumber(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isSafeInteger(value) && value >= 0;
}

function matchesReceipt(row: ReceiptRow, expected: ReceiptRow): boolean {
  return row.session_id === expected.session_id &&
    row.student_id === expected.student_id &&
    row.lesson_id === expected.lesson_id &&
    row.total_questions === expected.total_questions &&
    row.correct_answers === expected.correct_answers &&
    row.wrong_answers === expected.wrong_answers;
}

/**
 * Returns true only for a server-issued, immutable completion receipt.
 * After a network interruption between final scoring and adaptive-step
 * update, a retry can safely reconcile against this stored server receipt.
 * Never create a new receipt from an already finished client-visible row.
 */
export async function verifyAssessmentCompletionReceipt({
  admin, session, studentId, lessonId, analytics, allowCreate,
}: Params): Promise<boolean> {
  const totalsAreValid =
    session.finished === true &&
    session.lesson_id === lessonId &&
    [session.total_questions, session.correct_answers, session.wrong_answers,
      analytics.totalQuestions, analytics.totalCorrect, analytics.totalWrong]
      .every(validNumber) &&
    session.total_questions > 0 &&
    session.total_questions === session.correct_answers + session.wrong_answers &&
    session.total_questions === analytics.totalQuestions &&
    session.correct_answers === analytics.totalCorrect &&
    session.wrong_answers === analytics.totalWrong;

  if (!totalsAreValid) {
    return false;
  }

  const expected: ReceiptRow = {
    session_id: session.id,
    student_id: studentId,
    lesson_id: lessonId,
    total_questions: session.total_questions,
    correct_answers: session.correct_answers,
    wrong_answers: session.wrong_answers,
  };

  const selectReceipt = () => admin
    .from("assessment_completion_receipts")
    .select("session_id,student_id,lesson_id,total_questions,correct_answers,wrong_answers")
    .eq("session_id", session.id)
    .eq("student_id", studentId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const current = await selectReceipt();
  if (current.error) throw current.error;
  if (current.data) {
    return matchesReceipt(current.data as ReceiptRow, expected);
  }

  if (!allowCreate) {
    return false;
  }

  // No user-supplied score or 'finished' flag reaches this insert directly.
  // Caller has verified a newly advanced session with trusted answer keys.
  const { error } = await admin
    .from("assessment_completion_receipts")
    .insert(expected);

  // Concurrent request may have inserted first; re-read and compare.
  if (error && error.code !== "23505") {
    throw error;
  }

  const verified = await selectReceipt();
  if (verified.error) throw verified.error;
  return !!verified.data &&
    matchesReceipt(verified.data as ReceiptRow, expected);
}
