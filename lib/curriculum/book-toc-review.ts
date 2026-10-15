/** Stable scope identifier for the 56 Bahrain audit rows, not a certification. */
export function bookTocScopeKey(book: {
  program?: string | null;
  track?: string | null;
  grade?: number | null;
  level?: string | null;
  semesterOrBookPart?: number | null;
}) {
  return [
    book.program ?? "",
    book.track ?? "",
    book.grade ?? "",
    book.level ?? "",
    book.semesterOrBookPart ?? "",
  ].join("|");
}
