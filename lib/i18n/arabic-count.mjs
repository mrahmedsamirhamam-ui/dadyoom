/**
 * Arabic count/تمييز formatting for Dadyoom UI.
 * Strings are reviewed nouns, not guessed by pluralization or English i18n.
 *
 * Explicit 1/2: "صفّ واحد" / "صفّان".
 * 3–10 and the equivalent final two digits: genitive plural "10 مهارات".
 * 11–99: singular accusative "12 صفًّا".
 * Exact hundreds: singular genitive "100 صفّ" (vowel omitted in UI).
 *
 * Numbers above 100 are handled by their final two digits as a UI compact
 * display convention; for complex spoken numeral sentences use a full Arabic
 * number-to-words inflector and contextual i'rab instead.
 */
export const ARABIC_COUNT_NOUNS = Object.freeze({
  grade: Object.freeze({ one: "صفّ واحد", two: "صفّان", few: "صفوف", many: "صفًّا", other: "صفّ", zero: "لا توجد صفوف" }),
  classroom: Object.freeze({ one: "فصل واحد", two: "فصلان", few: "فصول", many: "فصلًا", other: "فصل", zero: "لا توجد فصول" }),
  lesson: Object.freeze({ one: "درس واحد", two: "درسان", few: "دروس", many: "درسًا", other: "درس", zero: "لا توجد دروس" }),
  skill: Object.freeze({ one: "مهارة واحدة", two: "مهارتان", few: "مهارات", many: "مهارةً", other: "مهارة", zero: "لا توجد مهارات" }),
  student: Object.freeze({ one: "طالب واحد", two: "طالبان", few: "طلاب", many: "طالبًا", other: "طالب", zero: "لا يوجد طلاب" }),
  teacher: Object.freeze({ one: "معلم واحد", two: "معلمان", few: "معلمين", many: "معلمًا", other: "معلم", zero: "لا يوجد معلمون" }),
  school: Object.freeze({ one: "مدرسة واحدة", two: "مدرستان", few: "مدارس", many: "مدرسةً", other: "مدرسة", zero: "لا توجد مدارس" }),
  activity: Object.freeze({ one: "نشاط واحد", two: "نشاطان", few: "أنشطة", many: "نشاطًا", other: "نشاط", zero: "لا توجد أنشطة" }),
  question: Object.freeze({ one: "سؤال واحد", two: "سؤالان", few: "أسئلة", many: "سؤالًا", other: "سؤال", zero: "لا توجد أسئلة" }),
});

/** @param {number} n @param {keyof typeof ARABIC_COUNT_NOUNS} noun */
export function formatArabicCount(n, noun) {
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError("عدد غير صالح");
  const forms = ARABIC_COUNT_NOUNS[noun];
  if (!forms) throw new TypeError("اسم معدود غير معتمد");
  if (n === 0) return forms.zero;
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  const lastTwo = n % 100;
  if (lastTwo >= 3 && lastTwo <= 10) return n + " " + forms.few;
  if (lastTwo >= 11 && lastTwo <= 99) return n + " " + forms.many;
  return n + " " + forms.other;
}
