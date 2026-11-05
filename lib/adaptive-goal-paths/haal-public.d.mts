export type LearningPath = "start" | "progress" | "challenge";
export type PublicQuestion = Readonly<{
  id: string;
  stem: string;
  choices: ReadonlyArray<Readonly<{ id: string; label: string }>>;
}>;
export type PathContent = Readonly<{
  heading: string;
  intro: string;
  example: string;
  explanation: string;
  practice: string;
  glossary: string;
  hints: ReadonlyArray<string>;
  feedback: string;
}>;
/** Public key-free fixture; includes no answer or explanation. */
export type QuestionBank = Readonly<{
  goalId: string;
  diagnostic: ReadonlyArray<PublicQuestion>;
  anchorForms: ReadonlyArray<ReadonlyArray<PublicQuestion>>;
  practice: Readonly<Record<LearningPath, ReadonlyArray<PublicQuestion>>>;
  gradedOnServer: true;
  certifiedMasteryAvailable: false;
  storage: "none";
}>;
export const PATHS: ReadonlyArray<LearningPath>;
export const PATH_LABELS: Readonly<Record<LearningPath, string>>;
export const HALL_GOAL: Readonly<{
  id: string; topic: string; grade: number; objective: string;
  mastery: Readonly<{ minimumCorrect: number; questionsPerCheck: number; spacedChecks: number }>;
  disclaimer: string;
}>;
export const PATH_CONTENT: Readonly<Record<LearningPath, PathContent>>;
export function recommendPath(input?: {
  correct?: number; total?: number; hintsUsed?: number;
  errorKinds?: ReadonlyArray<string>; responseTimesMs?: ReadonlyArray<number>;
}): LearningPath;
export function suggestSupport(input?: {
  path?: LearningPath; consecutiveSuccess?: number; consecutiveStruggles?: number;
}): LearningPath;
