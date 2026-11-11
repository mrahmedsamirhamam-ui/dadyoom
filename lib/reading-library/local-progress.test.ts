import { describe, expect, it } from "vitest";
import { ownerBookCandidates } from "./books";
import { localPassportProgress, readLocalEntries, saveLocalAnswers, LOCAL_READING_KEY } from "./local-progress";

function memoryStore() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

describe("browser-only reading progress", () => {
  it("keeps visitor A's reading state separate from visitor B and performs no server requests", () => {
    const a = memoryStore();
    const b = memoryStore();
    const book = ownerBookCandidates[0];
    const aEntries = saveLocalAnswers(a, book, ["قرأت الكتاب"]);
    expect(a.getItem(LOCAL_READING_KEY)).not.toBeNull();
    expect(b.getItem(LOCAL_READING_KEY)).toBeNull();
    expect(readLocalEntries(b)).toEqual([]);
    expect(aEntries[0].approved).toBe(false);
    expect(localPassportProgress(aEntries).completed).toBe(0);
  });
  it("does not approve rights-unverified books without reviewed questions", () => {
    const entries = saveLocalAnswers(memoryStore(), ownerBookCandidates[0], []);
    expect(entries[0].approved).toBe(false);
  });
});
