/**
 * Match Arabic lesson titles with or without vowel marks (tashkeel).
 * Escapes regex syntax supplied by the student. This is a bounded literal
 * substring matcher, not a free-form user-controlled PostgreSQL regex.
 *
 * PostgREST imatch maps to PostgreSQL ~* on the title column only.
 * Country, grade, publication status and active curriculum restrictions
 * remain in the caller's query before range pagination.
 */
const ARABIC_MARKS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/gu;
const OPTIONAL_MARKS = "[\u064B-\u065F\u0670\u06D6-\u06ED]*";
const REGEX_SPECIAL = /[\\^$.*+?()[\]{}|]/u;

export function lessonTitleSearchPattern(input: string): string | null {
  const text = input
    .normalize("NFKC")
    .replace(ARABIC_MARKS, "")
    .trim()
    .replace(/\s+/gu, " ");

  if (text.length < 2 || text.length > 80) return null;
  if (/[\\%_]/u.test(text)) return null;

  return Array.from(text, (character) => {
    if (character === " ") return "\\s+";
    const literal = REGEX_SPECIAL.test(character) ? "\\" + character : character;
    return literal + OPTIONAL_MARKS;
  }).join("");
}
