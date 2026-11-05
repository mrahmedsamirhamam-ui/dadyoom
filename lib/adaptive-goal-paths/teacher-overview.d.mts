export type LearningPath = "start" | "progress" | "challenge";
export type FictionalGoalObservation = Readonly<{
  goalId: string;
  selectedPath: LearningPath;
  anchorCorrect: number;
  hintsUsed: number;
  misconception: string | null;
  verified: boolean;
}>;
export type TeachingStrategy = Readonly<{
  id: string; title: string; fit: string; action: string; pitfall: string;
}>;
export type AssessmentTool = Readonly<{
  id: string; name: string; use: string; criterion: string;
}>;
export const MISTAKE_LABELS: Readonly<Record<string, string>>;
export const STRATEGY_CARDS: ReadonlyArray<TeachingStrategy>;
export const ASSESSMENT_TOOLS: ReadonlyArray<AssessmentTool>;
export const HALL_RUBRIC: Readonly<{
  goalId: string;
  criteria: ReadonlyArray<Readonly<{ id: string; label: string; levels: ReadonlyArray<string> }>>;
}>;
export function createFictionalClass(size?: number): ReadonlyArray<FictionalGoalObservation>;
export function buildTeacherGoalOverview(
  records: ReadonlyArray<FictionalGoalObservation>,
  goal?: Readonly<{
    id: string;
    objective: string;
    mastery: Readonly<{ minimumCorrect: number; questionsPerCheck: number }>;
  }>
): Readonly<{
  objective: string;
  goalId: string;
  total: number;
  paths: ReadonlyArray<Readonly<{ path: LearningPath; label: string; count: number }>>;
  checkPasses: number;
  supportInvites: number;
  unverified: number;
  averageHints: number;
  misconceptions: ReadonlyArray<Readonly<{ kind: string; label: string; count: number }>>;
  illustrativeOnly: true;
  certifiedMasteryCount: null;
  privacyNote: string;
}>;
