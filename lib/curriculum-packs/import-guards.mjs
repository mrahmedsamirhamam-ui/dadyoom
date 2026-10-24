/**
 * Enforce the exact identity of an existing curriculum lesson.
 * A matching unit_number/lesson_number is not permission to publish a draft
 * or replace a teacher's unrelated content.
 */
export function assertSafeExistingCurriculumLesson(existing, incoming) {
  if (existing?.status !== "published") {
    throw new Error("CURRICULUM_DRAFT_REQUIRES_SEPARATE_REVIEW");
  }
  if (
    String(existing?.title ?? "").trim() !==
    String(incoming?.title ?? "").trim()
  ) {
    throw new Error("CURRICULUM_EXISTING_LESSON_TITLE_CONFLICT");
  }
}
