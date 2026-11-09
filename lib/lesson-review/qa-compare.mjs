// Provisional lexical comparison only; not a teacher-certified correctness evaluator.
export function normalizeArabic(value) {
  return String(value ?? "").normalize("NFKC").replace(/[\u064B-\u065F\u0670\u0640]/gu,"")
    .replace(/[\u0622\u0623\u0625]/gu,"ا").replace(/\u0649/gu,"ي")
    .replace(/\s+/gu," ").trim().toLowerCase();
}
export function provisionalLexicalMatch(answer, expected) {
  const want=normalizeArabic(expected), got=normalizeArabic(answer);
  if(!want||!got) return false;
  // Avoid single-character matches that trivially occur within longer text.
  if(want.length<2) return got===want;
  return got===want || got.includes(want);
}
