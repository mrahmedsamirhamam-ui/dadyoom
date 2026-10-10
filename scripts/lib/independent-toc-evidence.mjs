// A scope is NOT certified just because two aggregate counts happen to match.
// Independently reviewed textbook TOC entries must map one-to-one to actual
// published lesson identifiers, with a source from the book itself.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const sha256 = /^[0-9a-f]{64}$/iu;
const hasText = (v) => typeof v === "string" && v.trim().length >= 2;
const goodDate = (v) => typeof v === "string" && /^20\d\d-\d\d-\d\d/u.test(v)
  && !Number.isNaN(Date.parse(v));

function bookLink(url) {
  if (!hasText(url)) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || !/(^|\.)edunet\.bh$/iu.test(u.hostname)) return false;
    const path = u.pathname.toLowerCase();
    // A teaching plan or a *list of book names* is not a book TOC.
    return !/\/manual\/plans/u.test(path)
      && !/\/manual\/books20/u.test(path)
      && !/\/econtent\/booksguide/u.test(path)
      && path !== "/";
  } catch { return false; }
}

export function independentTocValidation(row, academicYear = "2026-2027") {
  const e = row?.independentTocEvidence;
  const reasons = [];
  if (!e || typeof e !== "object") {
    return { valid: false, reasons: ["INDEPENDENT_BOOK_TOC_NOT_PROVIDED"] };
  }
  if (e.academicYear !== academicYear) reasons.push("TOC_YEAR_MISMATCH");
  if (e.scopeBookTitlesVerified !== true) reasons.push("SCOPE_BOOK_TITLES_NOT_VERIFIED");
  if (!hasText(e.reviewedBy) || !goodDate(e.reviewedAt)) {
    reasons.push("SCOPE_HUMAN_REVIEW_MISSING");
  }
  if (row.currentBookCatalogVerified !== true) reasons.push("OFFICIAL_CATALOG_NOT_VERIFIED");

  const books = Array.isArray(e.books) ? e.books : [];
  const namedScopeBooks = Array.isArray(e.scopeBookTitles) ? e.scopeBookTitles : [];
  if (!books.length || !namedScopeBooks.length) reasons.push("BOOKS_SCOPE_EMPTY");

  const expectedTitles = [...new Set(namedScopeBooks.map((x) => String(x).trim()))].sort();
  const actualTitles = [...new Set(books.map((x) => String(x?.title ?? "").trim()))].sort();
  if (expectedTitles.length !== namedScopeBooks.length ||
      actualTitles.length !== books.length ||
      JSON.stringify(expectedTitles) !== JSON.stringify(actualTitles)) {
    reasons.push("INCOMPLETE_BOOK_EDITION_COVERAGE");
  }

  const ids = new Set();
  const lessons = new Set();
  let totalToc = 0;
  let matched = 0;
  for (const book of books) {
    if (!hasText(book.title) || !bookLink(book.tocSourceUrl) ||
        !sha256.test(String(book.sourceSha256 ?? "")) ||
        book.editionYear !== academicYear ||
        !hasText(book.reviewedBy) || !goodDate(book.reviewedAt)) {
      reasons.push("BOOK_EDITION_SOURCE_UNVERIFIED");
    }
    const items = Array.isArray(book.items) ? book.items : [];
    if (!items.length) reasons.push("EMPTY_BOOK_TOC");
    for (const item of items) {
      totalToc += 1;
      const key = String(book.title ?? "") + ":" + String(item?.tocKey ?? "");
      if (!hasText(item?.tocKey) || ids.has(key)) reasons.push("DUPLICATE_OR_MISSING_TOC_KEY");
      ids.add(key);
      if (!hasText(item?.title) || !Number.isInteger(item?.page) || item.page < 1) {
        reasons.push("INCOMPLETE_TOC_ITEM");
      }
      if (!uuid.test(String(item?.matchedLessonId ?? "")) ||
          !hasText(item?.matchedLessonTitle) ||
          !hasText(item?.matchReviewedBy) ||
          !goodDate(item?.matchReviewedAt)) {
        reasons.push("LESSON_MAPPING_NOT_INDEPENDENTLY_REVIEWED");
        continue;
      }
      const lessonId = String(item.matchedLessonId).toLowerCase();
      if (lessons.has(lessonId)) reasons.push("LESSON_USED_FOR_MORE_THAN_ONE_TOC_ITEM");
      lessons.add(lessonId);
      matched += 1;
    }
  }

  if (totalToc === 0 || !Number.isInteger(row?.bookTotalTOCItems) ||
      row.bookTotalTOCItems !== totalToc) reasons.push("TOC_TOTAL_NOT_PROVEN");
  if (!Number.isInteger(row?.matchedTOCItems) ||
      row.matchedTOCItems !== matched || matched !== totalToc ||
      row?.missingItems !== 0) reasons.push("NOT_ALL_TOC_ITEMS_MATCHED");
  return { valid: reasons.length === 0, reasons: [...new Set(reasons)], totalToc, matched };
}
