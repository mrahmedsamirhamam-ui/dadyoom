/*
 * Legacy lesson completion route.
 *
 * SECURITY: Authentication alone is not evidence of mastery. Keep legacy
 * callers on the same >=90% canonical gate as /api/lessons/complete.
 * Do not INSERT into student_progress from this route.
 */
export { POST } from "@/app/api/lessons/complete/route";
