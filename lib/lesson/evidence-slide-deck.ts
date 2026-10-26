/**
 * Source-grounded learner slides. No synthetic objectives, answers or
 * imagined examples are added to compensate for incomplete curricula.
 *
 * Keep this independent of React, Next, Supabase and paid AI providers.
 */
export type EvidenceSlide = {
  kind?: "cover" | "objectives" | "concept" | "compare" | "activity" | "review";
  title: string;
  subtitle?: string;
  bullets?: string[];
  callout?: string;
  leftTitle?: string;
  leftItems?: string[];
  rightTitle?: string;
  rightItems?: string[];
  question?: string;
  answer?: string;
  narration?: string;
  seconds?: number;
};

export type EvidenceDeck = {
  title: string;
  slides: EvidenceSlide[];
};

export type GroundedLesson = {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  learning_objectives?: unknown;
  vocabulary?: unknown;
  instructions?: unknown;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/gu, " ").trim() : "";
}

function nonemptyStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(clean).filter((s) => s.length >= 8))].slice(0, 12);
}

function lessonVocabulary(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const items: string[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    const word = clean(row.word);
    const meaning = clean(row.meaning);
    if (word && meaning) items.push(`${word} — ${meaning}`);
  }
  return [...new Set(items)].slice(0, 12);
}

function passages(value: string | null): string[] {
  const raw = String(value ?? "").replace(/\r/gu, "\n");
  const sentences = raw
    .split(/[.!؟؛\n]+/u)
    .map(clean)
    .filter((s) => s.length >= 24);
  const parts: string[] = [];
  for (const sentence of sentences) {
    let remaining = sentence;
    while (remaining.length > 220) {
      const boundary = remaining.lastIndexOf(" ", 205);
      const cut = boundary >= 85 ? boundary : 205;
      parts.push(remaining.slice(0, cut).trim());
      remaining = remaining.slice(cut).trim();
    }
    if (remaining.length >= 24) parts.push(remaining);
  }
  return [...new Set(parts)].slice(0, 20);
}

function actualActivity(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  return value
    .map((entry) => typeof entry === "string" ? clean(entry) : "")
    .find((entry) => entry.length >= 18) ?? null;
}

/**
 * Returns null when the stored lesson provides no material to teach.
 * Never returns a "complete" presentation manufactured from the title.
 */
export function buildEvidenceDeck(lesson: GroundedLesson): EvidenceDeck | null {
  const title = clean(lesson.title);
  const summary = clean(lesson.summary);
  const objectives = nonemptyStrings(lesson.learning_objectives);
  const vocabulary = lessonVocabulary(lesson.vocabulary);
  const lines = passages(lesson.content);
  const activity = actualActivity(lesson.instructions);
  if (!title || (!summary && lines.length === 0 && objectives.length === 0 && vocabulary.length === 0)) {
    return null;
  }
  const slides: EvidenceSlide[] = [{
    kind: "cover",
    title,
    subtitle: "عرض تعليمي مبني على البيانات المتاحة في ضاديوم • يُراجع مع المعلم",
  }];
  if (objectives.length > 0) {
    slides.push({kind: "objectives", title: "أهداف التعلم المسجلة", bullets: objectives.slice(0, 4)});
  }
  if (summary) {
    slides.push({kind: "concept", title: "مدخل إلى الدرس", callout: summary.slice(0, 320)});
  }
  for (let i = 0; i < Math.min(lines.length, 18); i += 3) {
    slides.push({
      kind: "concept",
      title: i === 0 ? "نقرأ الشرح ونفهمه" : `شرح الدرس — الجزء ${i / 3 + 1}`,
      bullets: lines.slice(i, i + 3),
    });
  }
  for (let i = 0; i < vocabulary.length; i += 4) {
    slides.push({
      kind: "concept",
      title: "مفردات الدرس ومعانيها",
      bullets: vocabulary.slice(i, i + 4),
    });
  }
  if (activity) {
    slides.push({kind: "activity", title: "تطبيق من الدرس", question: activity});
  }
  const review = [...lines.slice(-2), ...vocabulary.slice(0, 2)].slice(0, 4);
  if (review.length > 0) {
    slides.push({kind: "review", title: "مراجعة عناصر الدرس", bullets: review});
  }
  // Every slide must have evidence. Missing fields stay missing instead of
  // filling them with invented objectives, stock examples or answer keys.
  return {title, slides};
}
