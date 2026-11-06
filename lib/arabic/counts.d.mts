export type ArabicCountNoun = "grade" | "lesson" | "skill" | "classroom" | "student" | "teacher" | "result" | "country" | "question" | "activity" | "unit";
export const ARABIC_COUNT_NOUNS: Readonly<Record<ArabicCountNoun, Readonly<{ one: string; two: string; many: string; tamyiz: string }>>>;
export function arabicCountNoun(count: number, noun: ArabicCountNoun): string;
export function formatArabicCount(count: number, noun: ArabicCountNoun, locale?: string): string;
