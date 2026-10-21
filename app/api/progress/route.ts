/*
 * Legacy progress completion route.
 *
 * SECURITY: Never write student_progress.completed directly. All lesson
 * completion requests must pass the canonical activity/question mastery gate.
 * This route is a backwards-compatible alias (same request body: lessonId).
 */
export { POST } from "@/app/api/lessons/complete/route";
