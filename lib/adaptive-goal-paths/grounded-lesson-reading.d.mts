export type ReadingPath = "start" | "progress" | "challenge";
export type ReadingPathInfo = Readonly<{ id: ReadingPath; title: string; hint: string }>;
export const READING_PATHS: ReadonlyArray<ReadingPathInfo>;
export function splitPublishedLessonIntoSteps(content: string | null | undefined, maxCharacters?: number): string[];
export function listPublishedGoalChoices(objectives: ReadonlyArray<string> | unknown): string[];
