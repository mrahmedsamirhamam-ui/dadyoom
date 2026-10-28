export type CatalogCandidate = {
  content: string | null | undefined;
  summary: string | null | undefined;
};

/** Explicit book index entries are references, not assessed lesson bodies. */
export function isBookCatalogReference(lesson: CatalogCandidate): boolean {
  return !(lesson.content ?? "").trim() &&
    (lesson.summary ?? "").trim().startsWith("عقدة تغطية رسمية");
}
