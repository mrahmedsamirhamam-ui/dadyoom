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
  // The first header of an imported lesson is often administrative metadata.
  // Restrict cloze prompts to the authored instructional section, not the
  // country/grade, provenance, source attribution or release disclaimer.
  const markers = [
    "مسار التعلّم الذاتي الموسّع",
    "مسار التعلم الذاتي —",
    "الدرس التطبيقي الموسّع",
  ];
  const offsets = markers.map((marker) => body.lastIndexOf(marker)).filter((index) => index >= 0);
  if (!offsets.length) return body;
  const from = Math.max(...offsets);
  const afterHeading = body.indexOf("\n", from);
  return afterHeading >= 0 ? body.slice(afterHeading + 1).trim() : "";
}
