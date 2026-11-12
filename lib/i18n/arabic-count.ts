/**
 * Centralized Modern Standard Arabic count agreement for Dadyoom.
 * 3–10: genitive plural; 11–99: accusative singular; 100: singular.
 * Arabic inflection is lexical: pass verified forms, never guess tanwin.
 * For 1 and 2, the noun supplies the number (درس واحد، درسان).
 */
export const COUNT_NOUNS = {
  grade:   { one: "صف واحد", two: "صفان", plural: "صفوف", accusative: "صفًا", hundred: "صف" },
  lesson:  { one: "درس واحد", two: "درسان", plural: "دروس", accusative: "درسًا", hundred: "درس" },
  skill:   { one: "مهارة واحدة", two: "مهارتان", plural: "مهارات", accusative: "مهارةً", hundred: "مهارة" },
  student: { one: "طالب واحد", two: "طالبان", plural: "طلاب", accusative: "طالبًا", hundred: "طالب" },
  teacher: { one: "معلم واحد", two: "معلمان", plural: "معلمين", accusative: "معلمًا", hundred: "معلم" },
  parent:  { one: "ولي أمر واحد", two: "وليا أمر", plural: "أولياء أمور", accusative: "ولي أمر", hundred: "ولي أمر" },
  school:  { one: "مدرسة واحدة", two: "مدرستان", plural: "مدارس", accusative: "مدرسةً", hundred: "مدرسة" },
} as const;

export type CountNoun = keyof typeof COUNT_NOUNS;

/** Suitable for standalone dashboard counters (nominative case for 1/2). */
export function formatArabicCount(value: number, noun: CountNoun): string {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError("Arabic count must be a non-negative safe integer.");
  }
  const f = COUNT_NOUNS[noun];
  if (value === 1) return f.one;
  if (value === 2) return f.two;
  if (value === 0) return "0 " + f.plural;

  // Counted noun depends on the last two digits in compound numerals.
  const remainder = value % 100;
  if (value >= 100 && (remainder === 0 || remainder === 1 || remainder === 2)) {
    return String(value) + " " + f.hundred;
  }
  if (remainder >= 3 && remainder <= 10) {
    return String(value) + " " + f.plural;
  }
  return String(value) + " " + f.accusative;
}
