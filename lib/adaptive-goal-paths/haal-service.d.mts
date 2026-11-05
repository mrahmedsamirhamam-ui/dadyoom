import type { LearningPath, PublicQuestion } from "./haal-public.mjs";

export type QuestionBank = Readonly<{
  goalId: string;
  diagnostic: ReadonlyArray<PublicQuestion>;
  anchorForms: ReadonlyArray<ReadonlyArray<PublicQuestion>>;
  practice: Readonly<Record<LearningPath, ReadonlyArray<PublicQuestion>>>;
  gradedOnServer: true;
  certifiedMasteryAvailable: false;
  storage: "none";
}>;
export type PilotGradingKind = "diagnostic" | "practice" | "anchor";
export type GradeRequest = {
  goalId: string;
  kind: PilotGradingKind;
  answers: Record<string, string>;
  path?: LearningPath;
  formIndex?: number;
  questionId?: string;
};
export type GradeResponse =
  | { ok: false; status: 400; error: string }
  | { ok: true; status: 200; kind: "diagnostic"; correct: number; total: number; errorKinds: (string | null)[]; recommendationIsBinding: false; certifiedMastery: false }
  | { ok: true; status: 200; kind: "practice"; correct: boolean; explanation: string | null; certifiedMastery: false }
  | { ok: true; status: 200; kind: "anchor"; correct: number; total: number; passedThisCheck: boolean; certifiedMastery: false; note: string; feedback: { id: string; correct: boolean; explanation: string }[] };
export function getPublicHaalPilotQuestions(): QuestionBank;
export function gradeHaalPilotRequest(body: unknown): GradeResponse;
