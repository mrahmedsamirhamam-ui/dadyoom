import { textbookSourceCandidate } from "@/lib/curriculum/textbook-source-candidate";

export type DraftCorrection = {
  title: string;
  summary: string | null;
  content: string | null;
  source_pdf_url: string | null;
  source_page_start: number | null;
  source_page_end: number | null;
};

export function validateBahrainDraftCorrection(fields: {
  title: string;
  summary: string;
  content: string;
  sourceUrl: string;
  sourcePageStart: string;
  sourcePageEnd: string;
}): { ok: true; draft: DraftCorrection } | { ok: false; error: string } {
  const title = fields.title.trim().replace(/\s+/gu, " ");
  const summary = fields.summary.trim();
  const content = fields.content.trim();
  const url = fields.sourceUrl.trim();
  const startRaw = fields.sourcePageStart.trim();
  const endRaw = fields.sourcePageEnd.trim();

  if (title.length < 3 || title.length > 200 || summary.length > 1000 ||
      content.length > 30000 || url.length > 600) {
    return { ok: false, error: "البيانات تتجاوز حدود التحرير المسموحة." };
  }
  // A plan PDF or a book-name catalog is NOT independent book evidence.
  const source = url ? textbookSourceCandidate(url) : null;
  if (url && !source) {
    return { ok: false, error: "أدخل رابط كتاب الوزارة نفسه، لا خطة التدريس أو دليل أسماء الكتب." };
  }
  if (Boolean(startRaw) !== Boolean(endRaw) || (startRaw && !source)) {
    return { ok: false, error: "حدّد بداية الصفحة ونهايتها مع رابط الكتاب الرسمي." };
  }
  let start: number | null = null;
  let end: number | null = null;
  if (startRaw && endRaw) {
    start = Number(startRaw);
    end = Number(endRaw);
    if (!Number.isInteger(start) || !Number.isInteger(end) ||
        start < 1 || end < start || end > 5000 || end - start > 200) {
      return { ok: false, error: "نطاق الصفحات غير صالح؛ راجع ترقيم الكتاب." };
    }
  }

  return { ok: true, draft: {
    title,
    summary: summary || null,
    content: content || null,
    source_pdf_url: source,
    source_page_start: start,
    source_page_end: end,
  } };
}
