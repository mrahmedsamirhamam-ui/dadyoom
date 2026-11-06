export type ArabicCountNoun =
  | "grade" | "classroom" | "lesson" | "skill" | "student"
  | "teacher" | "school" | "activity" | "question" | "unit" | "minute" | "point";
export type ArabicNounForms = Readonly<{
  one: string; two: string; few: string; many: string; other: string; zero: string;
}>;
export const ARABIC_COUNT_NOUNS: Readonly<Record<ArabicCountNoun, ArabicNounForms>>;
export function formatArabicCount(count: number, noun: ArabicCountNoun): string;
