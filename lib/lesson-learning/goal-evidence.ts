/**
 * Conservative, local alignment of lesson evidence with authored goals.
 *
 * A question or activity is NOT proof of mastery merely because it appears next
 * in the database. Only textually related items may be placed under a goal.
 * If no reliable overlap exists, callers must show a teacher-reviewed task.
 *
 * This is a presentation safeguard, not semantic equivalence, a curricular
 * certification, or a grading algorithm.
 */

const STOP_WORDS = new Set([
  "الطالب", "طالب", "التلميذ", "تلميذ", "المتعلم", "متعلم",
  "الدرس", "درس", "الهدف", "هدف", "السؤال", "سؤال",
  "اجاب", "الاجاب", "اجابه", "صحيح", "صحيحه", "الخاطئ",
  "يستنتج", "يحدد", "يميز", "يفسر", "يوظف", "يطبق",
  "يحلل", "يصنف", "يكتب", "يستخرج", "يقارن", "يصحح",
  "يوضح", "اذكر", "حدد", "حلل", "استخرج", "اشرح",
  "فيم", "ماذا", "كيف", "لماذا", "اين", "متى",
  "ان", "على", "من", "عن", "في", "الي", "لدي", "هذا",
  "تلك", "هذه", "التي", "الذي", "مع", "بعد", "قبل",
  "مثال", "امثل", "مختلف", "معطي", "الاتي", "التالي"
]);

export function meaningfulLearningTerms(value: unknown): string[] {
  if (typeof value !== "string") return [];
  const raw = value
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u0640]/gu, "")
    .replace(/[أإآٱ]/gu, "ا")
    .replace(/ى/gu, "ي")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .toLowerCase()
    .split(/\s+/u);

  const terms = new Set<string>();
  for (const original of raw) {
    let word = original;
    if (word.startsWith("ال") && word.length >= 5) word = word.slice(2);
    // Strip only transparent common suffixes, not internal root letters.
    for (const suffix of ["تين", "تان", "ات", "ون", "ين", "ية", "ة"]) {
      if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
        word = word.slice(0, -suffix.length);
        break;
      }
    }
    if (word.length < 3 || STOP_WORDS.has(word)) continue;
    terms.add(word);
  }
  return [...terms];
}

/**
 * Assign at most one candidate to each goal and never reuse a candidate.
 * A minimum of TWO independent common terms is deliberately conservative;
 * an unmatched goal falls back to an open, teacher-reviewed assessment.
 */
export function alignLearningEvidence(
  goals: readonly string[],
  candidateTexts: readonly string[],
): Array<number | null> {
  const candidates = candidateTexts.map((text) => new Set(meaningfulLearningTerms(text)));
  const used = new Set<number>();
  return goals.map((goal) => {
    const terms = meaningfulLearningTerms(goal);
    let bestIndex: number | null = null;
    let bestCount = 1;
    let bestRatio = 0;
    candidates.forEach((candidate, index) => {
      if (used.has(index)) return;
      const count = terms.filter((term) => candidate.has(term)).length;
      const ratio = count / Math.max(terms.length, 1);
      if (count >= 2 && (count > bestCount || (count === bestCount && ratio > bestRatio))) {
        bestIndex = index;
        bestCount = count;
        bestRatio = ratio;
      }
    });
    if (bestIndex !== null) used.add(bestIndex);
    return bestIndex;
  });
}
