/**
 * Allowlist-only view models for public lesson teaching material.
 * The imported instructions JSON may contain assessment answer keys.
 * Never pass that raw JSON to a client component.
 */
export type PublicLessonActivityPrompt = {
  title: string;
  level: string;
  instructions: string;
};

export type PublicLessonSlide = {
  title?: string;
  body?: string;
};

const PRIVATE_HINT = /(?:correct[_\s-]*answer|answer[_\s-]*key|model[_\s-]*answer|solution[_\s-]*key|grading[_\s-]*key|مفتاح\s*(?:الإجابة|الحل)|الإجابة\s*(?:الصحيحة|النموذجية)|الحل\s*النموذجي)/iu;

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function visible(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (!cleaned || PRIVATE_HINT.test(cleaned)) return "";
  return cleaned.slice(0, max);
}

export function publicLessonActivityPrompts(input: unknown): PublicLessonActivityPrompt[] {
  if (!Array.isArray(input)) return [];
  const result: PublicLessonActivityPrompt[] = [];
  const seen = new Set<string>();
  for (const entry of input) {
    // Legacy simple free-text instructions are already intended for learners.
    if (typeof entry === "string") {
      const instructions = visible(entry, 850);
      if (instructions && !seen.has(instructions)) {
        seen.add(instructions);
        result.push({ title: "نشاط تعليمي", level: "", instructions });
      }
    } else {
      const section = object(entry);
      // Never project "assessment", "answer", "dadyoom_source", or unknown sections.
      if (section?.kind !== "activities" || !Array.isArray(section.items)) continue;
      for (const raw of section.items) {
        const item = object(raw);
        if (!item) continue;
        const instructions = visible(item.instructions, 850);
        if (!instructions || seen.has(instructions)) continue;
        seen.add(instructions);
        const title = visible(item.title, 90) || "نشاط تعليمي";
        const allowedLevel = visible(item.level, 25);
        const level = ["أساسي", "متوسط", "متقدم", "دعم", "إثراء"].includes(allowedLevel)
          ? allowedLevel : "";
        result.push({ title, level, instructions });
        if (result.length >= 18) return result;
      }
    }
    if (result.length >= 18) break;
  }
  return result;
}

/**
 * Pass only explicit teaching slide title/body fields to the client.
 * Do NOT pass whole instructions objects; assessment answers may be nested.
 */
export function publicLessonSlideInstructions(
  input: unknown,
): Array<{ kind: "slides"; items: PublicLessonSlide[] }> {
  if (!Array.isArray(input)) return [];
  const slides: PublicLessonSlide[] = [];
  for (const rawSection of input) {
    const section = object(rawSection);
    if (section?.kind !== "slides" || !Array.isArray(section.items)) continue;
    for (const rawSlide of section.items) {
      const slide = object(rawSlide);
      if (!slide) continue;
      const title = visible(slide.title, 100);
      const body = visible(slide.body, 550);
      if (!title && !body) continue;
      slides.push({ ...(title ? { title } : {}), ...(body ? { body } : {}) });
      if (slides.length >= 24) break;
    }
    if (slides.length >= 24) break;
  }
  return slides.length ? [{ kind: "slides", items: slides }] : [];
}

/** A published row can still be an unreviewed original supplement. */
export function hasUnreviewedCurriculumSource(input: unknown): boolean {
  if (!Array.isArray(input)) return false;
  return input.some(raw => {
    const section = object(raw);
    return section?.kind === "dadyoom_source" &&
      (section.source_content_status === "MVP_DRAFT" ||
        section.source_publication_ready === false);
  });
}

/** Compose only visible word+meaning fields, never nested private metadata. */
export function publicLessonVocabulary(
  embedded: unknown,
  relational: unknown,
): Array<{ word: string; meaning: string }> {
  const preferred = Array.isArray(embedded) && embedded.length > 0 ? embedded : relational;
  if (!Array.isArray(preferred)) return [];
  const words: Array<{ word: string; meaning: string }> = [];
  const seen = new Set<string>();
  for (const raw of preferred) {
    const entry = object(raw);
    if (!entry) continue;
    const word = visible(entry.word, 90);
    const meaning = visible(entry.meaning, 300);
    if (!word || !meaning) continue;
    const key = word.replace(/\s+/g, " ").toLocaleLowerCase("ar");
    if (seen.has(key)) continue;
    seen.add(key);
    words.push({ word, meaning });
    if (words.length >= 50) break;
  }
  return words;
}

/**
 * Strip explicitly labelled teacher answer keys from student-facing text.
 * All stored canonical lesson content remains unchanged.
 */
export function publicLessonTeachingText(input: unknown): string {
  if (typeof input !== "string") return "";
  const lines = input.split(/\r?\n/u);
  const output: string[] = [];
  let suppressAnswerBlock = false;
  const teacherOnly = /(?:مفتاح\s*(?:الإجابة|المراجعة|الحل)|الإجابة\s*النموذجية|إجابة\s*نموذجية(?:\s*مستندة)?|مؤشرات\s*الاستجابة\s*الصحيحة|الحل\s*النموذجي)/iu;
  const nextSection = /^(?:#{1,4}\s*)?(?:تنبيه|حالة\s*المصدر|ملاحظة|حدود\s*المطابقة|مسار\s*(?:دعم|متوسط|متقدم)|أنشطة\s*متمايزة|أتعلم\s*مفردة|أفكر|بعد\s*القراءة|حقوق\s*المحتوى|التغذية\s*الراجعة)/u;
  for (const line of lines) {
    const trimmed = line.trim().replace(/^\*\*|\*\*$/g, "");
    if (teacherOnly.test(trimmed)) {
      suppressAnswerBlock = true;
      continue;
    }
    if (suppressAnswerBlock) {
      if (!trimmed) {
        suppressAnswerBlock = false;
        output.push("");
      } else if (nextSection.test(trimmed)) {
        suppressAnswerBlock = false;
        output.push(line);
      }
      continue;
    }
    output.push(line);
  }
  return output.join("\n").replace(/\n{3,}/g,"\n\n").trim();
}
