/** Content-quality marker, not a verdict on a textbook or a school. */
export function lessonNeedsSourceReview(content: string | null | undefined): boolean {
  const text = (content ?? "").trim();
  return text.startsWith("يتناول هذا الدرس موضوع «") ||
    text.includes("مدخل OCR غير محسوم");
}
