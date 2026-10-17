import { isCurriculumScopeRecord } from "@/lib/curriculum/lesson-content-kind";
import { lessonNeedsSourceReview } from "@/lib/curriculum/lesson-source-review";

/**
 * Only generate automatic word-cloze prompts from a usable lesson body.
 * A lesson's existing questions and vocabulary may still be used if this
 * function returns an empty string. It does not certify ministry matching.
 */
export function sourceForAutomaticGameQuestions(input: {
  content?: string | null;
  summary?: string | null;
}): string {
  const body = (input.content ?? input.summary ?? "").trim();
  if (!body || lessonNeedsSourceReview(body) ||
      isCurriculumScopeRecord({
        content: input.content,
        summary: input.summary,
      })) {
    return "";
  }
  return body;
}
