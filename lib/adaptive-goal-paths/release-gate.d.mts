export type ReleaseStatus = Readonly<{ ready: boolean; blockers: ReadonlyArray<string> }>;
export type AdaptiveLessonManifest = Readonly<{
  goal: Readonly<{ id: string; objective: string; mastery: Readonly<{ questionsPerCheck: number; minimumCorrect: number; spacedChecks: number }> }>;
  scope: Readonly<{ country: string | null; ministry: string | null; grade: number; term: number | null }>;
  source: Readonly<{
    edition: string | null;
    officialBookUrl: string | null;
    status: string;
    tableOfContentsChecked: boolean;
    lessonTextChecked: boolean;
  }>;
  paths: Readonly<Record<string, Readonly<{ intro: string; example: string; explanation: string; practice: string; hints: ReadonlyArray<string> }>>>;
  sharedCheck: ReadonlyArray<Readonly<{
    id: string; correctId: string; choices: ReadonlyArray<Readonly<{ id: string; label: string }>>;
  }>>;
  reviews: Readonly<{ linguistic: boolean; pedagogical: boolean; studentSafety: boolean }>;
  trial: Readonly<{ completed: boolean; participants: number; controlsReviewed: boolean }>;
  security: Readonly<{ authenticatedServerAssessment: boolean; roleIsolationVerified: boolean }>;
}>;
export const HALL_PILOT_MANIFEST: AdaptiveLessonManifest;
export function checkAdaptiveLessonRelease(manifest: AdaptiveLessonManifest | null | undefined): ReleaseStatus;
