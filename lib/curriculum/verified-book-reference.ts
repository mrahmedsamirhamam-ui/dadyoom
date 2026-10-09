/**
 * Only known source-book title cards, never inferred from generic lesson names.
 * These are catalog references, NOT individual textbook lesson TOC entries.
 * Keep stable DB IDs/rows intact for provenance and future source validation.
 */
export function isBookReference(input: {
  countryCode: string;
  unitTitle: string;
  lessonTitle: string;
}): boolean {
  const { countryCode, unitTitle, lessonTitle } = input;
  switch (countryCode.toUpperCase()) {
    case "YE":
      return unitTitle === "اللغة العربية — حزمة الكتب الرسمية" &&
        /^(الأدب والنصوص والبلاغة|القراءة|النحو والصرف)(?: — الجزء (?:الأول|الثاني))?$/u.test(lessonTitle);
    case "TN":
      return unitTitle === "اللغة العربية — حزمة الكتاب الرسمي" &&
        /^(?:كتاب النصوص — رياضة|عيون الأدب — الجزء الثاني|نصوص — آداب(?: — الجزء (?:الأول|الثاني))?|كتاب العربية — رياضة)$/u.test(lessonTitle);
    case "OM":
      return unitTitle === "كتب اللغة العربية الرسمية المعتمدة — 2026/2027" &&
        /^(?:لغتي الجميلة — الفصل الدراسي (?:الأول|الثاني)|المؤنس — الفصل الدراسي (?:الأول|الثاني)|المفيد)$/u.test(lessonTitle);
    case "LY":
      return /^كتاب (?:الأدب والنصوص|المطالعة والإنشاء|النقد الأدبي) — ثالث ثانوي أدبي$/u.test(unitTitle) &&
        /^(?:الأدب والنصوص|المطالعة والإنشاء|النقد الأدبي) — تغطية كتابية تكاملية$/u.test(lessonTitle);
    default:
      return false;
  }
}
