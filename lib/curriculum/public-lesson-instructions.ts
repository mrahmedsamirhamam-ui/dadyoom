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

const PRIVATE_HINT = /(?:correct[_\\s-]*answer|answer[_\\s-]*key|model[_\\s-]*answer|solution[_\\s-]*key|grading[_\\s-]*key|مفتاح\\s*(?:الإجابة|الحل)|الإجابة\\s*(?:الصحيحة|النموذجية)|الحل\\s*النموذجي)/iu;

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function visible(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  const cleaned = value.trim().replace(/\\s+/g, " ");
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
