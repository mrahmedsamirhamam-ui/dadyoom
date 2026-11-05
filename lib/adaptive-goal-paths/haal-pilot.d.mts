export type LearningPath = "start" | "progress" | "challenge";
export type TeachingQuestion = Readonly<{
  id: string;
  stem: string;
  choices: ReadonlyArray<Readonly<{ id: string; label: string }>>;
  correctId: string;
  why: string;
  errorKind: string;
}>;
export const PATHS: ReadonlyArray<LearningPath>;
export const PATH_LABELS: Readonly<Record<LearningPath, string>>;
export const HALL_GOAL: Readonly<{
  id: string;
  topic: string;
  grade: number;
  objective: string;
  mastery: Readonly<{ minimumCorrect: number; questionsPerCheck: number; spacedChecks: number }>;
  disclaimer: string;
}>;
export const DIAGNOSTIC: ReadonlyArray<TeachingQuestion>;
export const ANCHOR: ReadonlyArray<TeachingQuestion>;
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
export const PATH_CONTENT: Readonly<Record<LearningPath, PathContent>>;
export function recommendPath(input?: {
  correct?: number;
  total?: number;
  hintsUsed?: number;
  errorKinds?: ReadonlyArray<string>;
  responseTimesMs?: ReadonlyArray<number>;
}): LearningPath;
export function suggestSupport(input?: {
  path?: LearningPath;
  consecutiveSuccess?: number;
  consecutiveStruggles?: number;
}): LearningPath;
export function assessQuestions(
  questions: ReadonlyArray<TeachingQuestion>,
  answers: Record<string, string>,
): {
  correct: number;
  total: number;
  ratio: number;
  rows: { id: string; correct: boolean; answered: boolean; errorKind: string }[];
};
export function assessAnchor(answers: Record<string, string>): ReturnType<typeof assessQuestions> & {
  passedThisCheck: boolean;
  certifiedMastery: boolean;
  note: string;
};
