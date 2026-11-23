import { describe, expect, it } from "vitest";
import { ownerBookCandidates } from "./books";
import { localPassportProgress, readLocalEntries, saveLocalAnswers, writeLocalEntries, LOCAL_READING_KEY } from "./local-progress";
function memoryStore(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(LOCAL_READING_KEY, initial);
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } };
}
describe("browser-only reading pilot", () => {
  it("isolates browser stores and never approves notes", () => {
    const a = memoryStore(), b = memoryStore();
    const entries = saveLocalAnswers(a, ownerBookCandidates[0], ["قرأت الكتاب"]);
    expect(a.getItem(LOCAL_READING_KEY)).not.toBeNull();
    expect(readLocalEntries(b)).toEqual([]);
    expect(entries[0].approved).toBe(false);
    expect(localPassportProgress(entries).completed).toBe(0);
  });
  it("rejects invalid JSON and unknown books", () => {
    expect(readLocalEntries(memoryStore("{broken"))).toEqual([]);
    expect(readLocalEntries(memoryStore(JSON.stringify([{ bookId: "unknown", approved: true, answers: [] }])))).toEqual([]);
  });
  it("deduplicates and rejects forged approval", () => {
    const id = ownerBookCandidates[0].id;
    const store = memoryStore(JSON.stringify([
      { bookId: id, approved: true, answers: ["first"] },
      { bookId: id, approved: true, answers: ["second"] },
    ]));
    expect(readLocalEntries(store)).toEqual([{ bookId: id, approved: false, answers: ["first"] }]);
    expect(localPassportProgress([{ bookId: id, approved: true, answers: [] }]).completed).toBe(0);
  });
  it("rejects oversized notes and strips approval on writes", () => {
    const store = memoryStore();
    expect(saveLocalAnswers(store, ownerBookCandidates[0], ["x".repeat(4001)])).toEqual([]);
    writeLocalEntries(store, [{ bookId: ownerBookCandidates[0].id, approved: true, answers: ["note"] }]);
    expect(readLocalEntries(store)[0].approved).toBe(false);
    expect(JSON.parse(store.getItem(LOCAL_READING_KEY) ?? "[]")[0].approved).toBe(false);
  });
  it("does not approve even a forged rights-cleared catalog entry", () => {
    const book = { ...ownerBookCandidates[0], rightsStatus: "موثق" as const,
      questions: [{ id: "1", prompt: "سؤال", reviewedBy: "معلم" }, { id: "2", prompt: "سؤال", reviewedBy: "معلم" }] };
    expect(saveLocalAnswers(memoryStore(), book, ["إجابة طويلة", "إجابة طويلة"])[0].approved).toBe(false);
  });
});
