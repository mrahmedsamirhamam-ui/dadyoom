import { getReadingProgress, type ReadingRecord } from "./passports";
import { isBookApprovable, type LibraryBook } from "./books";

export const LOCAL_READING_KEY = "dadyoom:reading-library:v1";
export type LocalReadingEntry = { bookId: string; approved: boolean; answers: string[] };
export type BrowserStore = Pick<Storage, "getItem" | "setItem">;

export function readLocalEntries(store: BrowserStore): LocalReadingEntry[] {
  try {
    const parsed: unknown = JSON.parse(store.getItem(LOCAL_READING_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is LocalReadingEntry =>
      typeof item === "object" && item !== null && typeof item.bookId === "string" &&
      typeof item.approved === "boolean" && Array.isArray(item.answers) &&
      item.answers.every((answer: unknown) => typeof answer === "string"),
    ).slice(0, 50);
  } catch { return []; }
}

export function writeLocalEntries(store: BrowserStore, entries: readonly LocalReadingEntry[]): void {
  store.setItem(LOCAL_READING_KEY, JSON.stringify(entries.slice(0, 50)));
}

/** Client-side training flag, not an authoritative teacher approval or competition certificate. */
export function saveLocalAnswers(store: BrowserStore, book: LibraryBook, answers: string[]): LocalReadingEntry[] {
  const existing = readLocalEntries(store).filter((entry) => entry.bookId !== book.id);
  const approved = isBookApprovable(book) && answers.length === book.questions.length &&
    answers.every((answer) => answer.trim().length >= 10);
  const updated = [...existing, { bookId: book.id, approved, answers }];
  writeLocalEntries(store, updated);
  return updated;
}

export function localPassportProgress(entries: readonly LocalReadingEntry[]) {
  const records: ReadingRecord[] = entries.map(({ bookId, approved }) => ({ bookId, approved }));
  return getReadingProgress(records);
}
