import { suspectImportedLessonTitleReason } from "@/lib/curriculum/imported-lesson-title-quality";
import { lessonNeedsSourceReview } from "@/lib/curriculum/lesson-source-review";
import { textbookSourceCandidate } from "@/lib/curriculum/textbook-source-candidate";

export function publishedLessonNeedsSourceCorrection(row: { title: string; content: string | null }) {
  return lessonNeedsSourceReview(row.content) || suspectImportedLessonTitleReason(row.title) !== null;
}

export function validatePublishedBahrainSourceCorrection(fields: {
  title: string; summary: string; content: string; sourceUrl: string;
  sourcePageStart: string; sourcePageEnd: string; reviewerConfirmed: string;
}) {
  const title = fields.title.trim().replace(/\s+/gu, " ");
  const summary = fields.summary.trim();
  const content = fields.content.trim();
  const source = textbookSourceCandidate(fields.sourceUrl);
  const start = Number(fields.sourcePageStart);
  const end = Number(fields.sourcePageEnd);
  if (fields.reviewerConfirmed !== "yes") return { ok: false as const, error: "يلزم تأكيد مراجعة الكتاب البشريّة." };
  if (title.length < 3 || title.length > 200 || suspectImportedLessonTitleReason(title))
    return { ok: false as const, error: "عنوان الدرس ما زال غير صالح للمطابقة." };
  if (summary.length < 20 || summary.length > 1000 || content.length < 180 ||
      content.length > 30000 || lessonNeedsSourceReview(content))
    return { ok: false as const, error: "الشرح غير مكتمل أو ما زال قالبًا عامًا." };
  if (!source || !fields.sourcePageStart.trim() || !fields.sourcePageEnd.trim() ||
      !Number.isInteger(start) || !Number.isInteger(end) || start < 1 ||
      end < start || end > 5000 || end - start > 200)
    return { ok: false as const, error: "رابط كتاب الوزارة وصفحاته المباشرة مطلوبان." };
  return { ok: true as const, correction: {
    title, summary, content, source_pdf_url: source,
    source_page_start: start, source_page_end: end,
  } };
}
