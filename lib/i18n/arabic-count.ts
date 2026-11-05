/** Count labels in Arabic; use shared forms rather than concatenating a number and a singular noun. */
export type ArabicCountNoun = "lesson" | "grade" | "unit" | "student" | "day" | "activity" | "class";

type Forms = { singular: string; dual: string; plural: string; accusative: string };
const nouns: Record<ArabicCountNoun, Forms> = {
  lesson: { singular: "درس", dual: "درسان", plural: "دروس", accusative: "درسًا" },
  grade: { singular: "صفّ", dual: "صفّان", plural: "صفوف", accusative: "صفًّا" },
  unit: { singular: "وحدة", dual: "وحدتان", plural: "وحدات", accusative: "وحدةً" },
  student: { singular: "طالب", dual: "طالبان", plural: "طلاب", accusative: "طالبًا" },
  day: { singular: "يوم", dual: "يومان", plural: "أيام", accusative: "يومًا" },
  activity: { singular: "نشاط", dual: "نشاطان", plural: "أنشطة", accusative: "نشاطًا" },
  class: { singular: "فصل", dual: "فصلان", plural: "فصول", accusative: "فصلًا" },
};
const numbers = new Intl.NumberFormat("ar-BH", { numberingSystem: "latn" });

/** Forms for standalone dashboard/UI count strings, not nouns inside longer sentences. */
export function formatArabicCount(value: number, noun: ArabicCountNoun): string {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError("Count must be a nonnegative integer");
  const form = nouns[noun];
  if (value === 0) return `لا ${form.plural}`;
  if (value === 1) return `${form.singular} واحد`;
  if (value === 2) return form.dual;
  const lastTwo = value % 100;
  const n = numbers.format(value);
  if (lastTwo >= 3 && lastTwo <= 10) return `${n} ${form.plural}`;
  if (lastTwo >= 11 && lastTwo <= 99) return `${n} ${form.accusative}`;
  // Multiples of 100 and 1000 and their additions can need a different case.
  // Prefer a semantically correct count label rather than assuming 3–10 plural everywhere.
  if (value % 100 === 0) return `${n} ${form.singular}`;
  const ones = value % 10;
  if (ones >= 3 && ones <= 9) return `${n} ${form.plural}`;
  return `${n} ${form.accusative}`;
}
