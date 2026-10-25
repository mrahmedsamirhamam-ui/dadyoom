/**
 * Trusted grading for "ذاكر والعب". This file never runs in the browser.
 * Grading uses the full server-stored question set, never client claims.
 */
import { gradeStoredMcq } from "@/features/questions/services/grade-stored-mcq";

export type StudyPlayRow = {
  id: string;
  question_type: string;
  options: unknown;
  correct_answer: string;
};

export type StudyPlayAnswer = {
  questionId: string;
  optionId: string;
};

export type StudyPlayGrade = {
  correctAnswers: number;
  totalQuestions: number;
  score: number;
  passed: boolean;
  grading: { questionId: string; optionId: string; isCorrect: boolean }[];
};

const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export function gradeStudyPlay(
  questions: StudyPlayRow[],
  answers: unknown,
): StudyPlayGrade {
  if (!Array.isArray(questions) || questions.length < 1 || questions.length > 100) {
    throw new Error("لا توجد أسئلة صالحة وكاملة لهذا الدرس.");
  }
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    throw new Error("يجب الإجابة عن جميع أسئلة الدرس مرة واحدة.");
  }

  const rowIds = new Set<string>();
  const submitted = new Map<string, string>();

  for (const answer of answers) {
    if (
      !answer || typeof answer !== "object" || Array.isArray(answer) ||
      typeof answer.questionId !== "string" ||
      typeof answer.optionId !== "string" ||
      !UUID.test(answer.questionId) || !answer.optionId.trim() ||
      submitted.has(answer.questionId)
    ) {
      throw new Error("بيانات إجابات غير صالحة أو مكررة.");
    }
    submitted.set(answer.questionId, answer.optionId);
  }

  const grading: StudyPlayGrade["grading"] = [];

  for (const row of questions) {
    if (!row.id || !UUID.test(row.id) || rowIds.has(row.id)) {
      throw new Error("بنك أسئلة الدرس غير صالح.");
    }
    rowIds.add(row.id);

    const optionId = submitted.get(row.id);
    if (!optionId) {
      throw new Error("إجابة ناقصة أو سؤال لا ينتمي إلى هذا الدرس.");
    }

    const result = gradeStoredMcq(
      {
        question_type: row.question_type,
        options: row.options,
        correct_answer: row.correct_answer,
      },
      optionId,
    );
    if (!result.valid) {
      throw new Error("أحد أسئلة الدرس يحتاج إلى مراجعة قبل التصحيح.");
    }
    grading.push({ questionId: row.id, optionId, isCorrect: result.isCorrect });
  }

  const correctAnswers = grading.filter((item) => item.isCorrect).length;
  const totalQuestions = grading.length;
  const score = Math.round((100 * correctAnswers) / totalQuestions);

  return {
    correctAnswers,
    totalQuestions,
    score,
    passed: score >= 70,
    grading,
  };
}
