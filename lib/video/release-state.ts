export const VIDEO_AI_STATUS = "soon" as const;

export const VIDEO_AI_SOON_MESSAGE =
  "إنشاء الفيديو بالذكاء الاصطناعي قريبًا وغير مفعّل حاليًا.";

export function isVideoAiGenerationEnabled() {
  // Release gate: keep AI video generation disabled until it is explicitly
  // approved for production. Do not derive this from provider credentials.
  return false;
}
