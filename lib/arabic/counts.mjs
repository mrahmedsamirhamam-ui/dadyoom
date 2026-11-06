/**
 * UI-safe Arabic count/noun agreement (Arabic grammar, not numeral-to-words).
 *
 * 0/3–10: plural; 1: singular; 2: dual; 11–99: singular accusative
 * (tamyiz); 100/1000 and 101-style numbers use the final spoken unit.
 *
 * E.g. 1 صف, 2 صفان, 3 صفوف, 10 مهارات, 12 صفًا, 22 درسًا.
 * This helper is for stand-alone counts, not full syntactic sentences:
 * in oblique cases choose genitive/accusative dual forms separately.
 */
export const ARABIC_COUNT_NOUNS = Object.freeze({
  grade: Object.freeze({ one: "صف", two: "صفان", many: "صفوف", tamyiz: "صفًا" }),
  lesson: Object.freeze({ one: "درس", two: "درسان", many: "دروس", tamyiz: "درسًا" }),
  skill: Object.freeze({ one: "مهارة", two: "مهارتان", many: "مهارات", tamyiz: "مهارةً" }),
  classroom: Object.freeze({ one: "فصل", two: "فصلان", many: "فصول", tamyiz: "فصلًا" }),
  student: Object.freeze({ one: "طالب", two: "طالبان", many: "طلاب", tamyiz: "طالبًا" }),
  teacher: Object.freeze({ one: "معلم", two: "معلمان", many: "معلمون", tamyiz: "معلمًا" }),
  result: Object.freeze({ one: "نتيجة", two: "نتيجتان", many: "نتائج", tamyiz: "نتيجةً" }),
  country: Object.freeze({ one: "دولة", two: "دولتان", many: "دول", tamyiz: "دولةً" }),
  question: Object.freeze({ one: "سؤال", two: "سؤالان", many: "أسئلة", tamyiz: "سؤالًا" }),
  activity: Object.freeze({ one: "نشاط", two: "نشاطان", many: "أنشطة", tamyiz: "نشاطًا" }),
  unit: Object.freeze({ one: "وحدة", two: "وحدتان", many: "وحدات", tamyiz: "وحدةً" }),
});

/** Normalizes Arabic-Indic digits only for validation; does not alter display. */
export function arabicCountNoun(count, noun) {
  const forms = ARABIC_COUNT_NOUNS[noun];
  if (!forms) throw new TypeError("Unsupported Arabic noun");
  if (!Number.isSafeInteger(count) || count < 0) throw new RangeError("Count must be a nonnegative safe integer");
  if (count === 0) return forms.many;
  const last100 = count % 100;
  if (count >= 100 && last100 === 0) return forms.one;
  if (last100 === 1) return forms.one;
  if (last100 === 2) return forms.two;
  if (last100 >= 3 && last100 <= 10) return forms.many;
  return forms.tamyiz;
}

export function formatArabicCount(count, noun, locale = "ar") {
  const numeral = new Intl.NumberFormat(locale, { useGrouping: false }).format(count);
  return numeral + " " + arabicCountNoun(count, noun);
}
