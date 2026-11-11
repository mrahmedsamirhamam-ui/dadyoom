import { getReadingProgress, type ReadingRecord } from "./passports";
import { ownerBookCandidates, type LibraryBook } from "./books";

export const LOCAL_READING_KEY = "dadyoom:reading-library:v1";
export type LocalReadingEntry = { bookId: string; approved: boolean; answers: string[] };
export type BrowserStore = Pick<Storage, "getItem" | "setItem">;
const allowed = new Set(ownerBookCandidates.map((book) => book.id));
const MAX_NOTE = 4000;

/** Browser data is untrusted notes, never evidence of approval. */
export function readLocalEntries(store: BrowserStore): LocalReadingEntry[] {
  try {
    const raw: unknown = JSON.parse(store.getItem(LOCAL_READING_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    const result: LocalReadingEntry[] = [];
    for (const entry of raw) {
      if (!entry || typeof entry !== "object" || typeof entry.bookId !== "string" ||
          !allowed.has(entry.bookId) || seen.has(entry.bookId) ||
          !Array.isArray(entry.answers) || entry.answers.length > 3 ||
          !entry.answers.every((a: unknown) => typeof a === "string" && a.length <= MAX_NOTE)) continue;
      seen.add(entry.bookId);
      result.push({ bookId: entry.bookId, approved: false, answers: [...entry.answers] });
      if (result.length >= 50) break;
    }
    return result;
  } catch { return []; }
}

export function writeLocalEntries(store: BrowserStore, entries: readonly LocalReadingEntry[]): void {
  const seen = new Set<string>();
  const safe: LocalReadingEntry[] = [];
  for (const entry of entries) {
    if (!allowed.has(entry.bookId) || seen.has(entry.bookId) ||
        !Array.isArray(entry.answers) || entry.answers.length > 3 ||
        !entry.answers.every((a) => typeof a === "string" && a.length <= MAX_NOTE)) continue;
    seen.add(entry.bookId);
    safe.push({ bookId: entry.bookId, approved: false, answers: [...entry.answers] });
    if (safe.length >= 50) break;
  }
  store.setItem(LOCAL_READING_KEY, JSON.stringify(safe));
}

/** No automatic approval: teacher-reviewed questions alone do not verify student answers. */
export function saveLocalAnswers(store: BrowserStore, book: LibraryBook, answers: string[]): LocalReadingEntry[] {
  if (!allowed.has(book.id) || answers.length > 3 ||
      !answers.every((a) => typeof a === "string" && a.length <= MAX_NOTE)) return readLocalEntries(store);
  const updated = [...readLocalEntries(store).filter((e) => e.bookId !== book.id),
    { bookId: book.id, approved: false, answers: [...answers] }];
  writeLocalEntries(store, updated);
  return readLocalEntries(store);
}

/** Untrusted client approvals must never unlock passports. */
export function localPassportProgress(entries: readonly LocalReadingEntry[]) {
  const records: ReadingRecord[] = entries.filter((e) => allowed.has(e.bookId))
    .map(({ bookId }) => ({ bookId, approved: false }));
  return getReadingProgress(records);
}
