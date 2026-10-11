/**
 * Describes what the provided external URL actually proves.
 * A distribution plan is never a copy of a textbook, and an old
 * semester plan is never evidence of the current school-year schedule.
 * This helper performs NO online verification or independent TOC audit.
 */
export type SourceReference = {
  kind: "current-plan" | "historical-plan" | "book-catalog" | "ebook-viewer" | "ministry-digital-lesson" | "other";
  linkLabel: string;
  detail: string;
  editionYear: string | null;
  caution: boolean;
};

const SCHOOL_YEAR = "2026-2027";

export function describeLessonSourceReference(rawUrl: string): SourceReference {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return {
      kind: "other", linkLabel: "رابط المصدر المسجل للدرس",
      detail: "لم يمكن تحديد نوع المصدر وسنته تلقائيًا؛ لا تثبت هذه الإحالة اكتمال فهرس كتاب أو اعتماد خطة دراسية.",
      editionYear: null, caution: true,
    };
  }

  const isBahrainMinistry = url.protocol === "https:" &&
    /(?:^|\.)edunet\.bh$/iu.test(url.hostname);
  if (isBahrainMinistry) {
    const plan = url.pathname.match(/\/manual\/plans([12])-(20\d\d-20\d\d)\/arabic\/[^/]+\.pdf$/iu);
    if (plan) {
      const term = plan[1];
      const year = plan[2];
      const current = year === SCHOOL_YEAR;
      return {
        kind: current ? "current-plan" : "historical-plan",
        linkLabel: `فتح خطة توزيع دروس الفصل ${term === "1" ? "الأول" : "الثاني"} (${year})`,
        detail: current
          ? "هذا رابط خطة توزيع الدروس الرسمية للسنة المذكورة، وليس صفحات الكتاب المدرسي أو دليل اكتمال فهرسه."
          : `هذا المصدر يعود إلى العام الدراسي ${year}، ولا يثبت أن الدرس مقرر في ${SCHOOL_YEAR}. يرجى مراجعة الخطة الرسمية الحالية قبل استخدامه كمقرر هذا العام.`,
        editionYear: year,
        caution: !current,
      };
    }
    if (/\/manual\/books20\d\d\/books\d+\.pdf$/iu.test(url.pathname) ||
        /\/econtent\/booksguide\/?$/iu.test(url.pathname)) {
      return {
        kind: "book-catalog", linkLabel: "فتح دليل أسماء الكتب الرسمي",
        detail: "دليل أسماء الكتب يثبت إدراج الكتاب، لكنه ليس الكتاب نفسه ولا فهرس دروس تمت مطابقته.",
        editionYear: null, caution: true,
      };
    }
    if (/\/e_books\//iu.test(url.pathname)) {
      return {
        kind: "ebook-viewer", linkLabel: "فتح عارض الكتاب الإلكتروني المسجل",
        detail: "رابط عارض الكتاب المسجل لا يعني وحده التحقق من الإصدار الدراسي أو مطابقة جميع بنود الفهرس بالدرس.",
        editionYear: null, caution: false,
      };
    }
    // Some Bahrain G1 part-two records link to actual Ministry digital
    // lesson-resource PDFs (not textbooks and not annual teaching plans).
    // A Ministry resource is not evidence that the 2026–2027 plan assigns it.
    if (/\/e_content\/[^?#]+\/lessons\/[^?#]+\.pdf$/iu.test(url.pathname)) {
      return {
        kind: "ministry-digital-lesson",
        linkLabel: "فتح ملف الدرس الرقمي في موقع الوزارة",
        detail: "هذا ملف درس رقمي تابع للوزارة، وليس فهرس كتاب أو خطة توزيع رسمية لعام 2026–2027؛ لا تثبت الإحالة وحدها اعتماد الدرس لهذا العام.",
        editionYear: null, caution: true,
      };
    }
  }

  return {
    kind: "other", linkLabel: "فتح رابط المصدر المسجل للدرس",
    detail: "لم يُثبت من هذا الرابط وحده أنه كتاب رسمي للسنة الحالية أو أن فهرسه مطابق للدرس.",
    editionYear: null, caution: false,
  };
}
