/**
 * Fallback is for genuine mobile-network or AI-provider failures only.
 * Authentication/authorization errors must never be turned into local success.
 * A lesson-bound assistant requires published server-verified content.
 */
const TRANSIENT_ASSISTANT_ERRORS = new Set([0, 408, 409, 425, 429, 500, 502, 503, 504]);

export function hasBoundLesson(context: Record<string, unknown>): boolean {
  return typeof context.lessonId === "string" && context.lessonId.trim().length > 0;
}

export function mayUseLocalAssistant(
  native: boolean,
  context: Record<string, unknown>,
  cloudStatus?: number,
): boolean {
  return native &&
    !hasBoundLesson(context) &&
    (cloudStatus === undefined || TRANSIENT_ASSISTANT_ERRORS.has(cloudStatus));
}
