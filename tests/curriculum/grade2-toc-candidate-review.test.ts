import { describe, expect, it } from "vitest";
import { inspectTocMatches, normalizeTocTitle } from "../../lib/curriculum/toc-title-matching";
import { textbookSourceCandidate } from "../../lib/curriculum/textbook-source-candidate";
import { readFileSync } from "node:fs";

const lessons = [
  { id:"official-1", title:"قِراءَةٌ: وَطَنِي", semester:1, official_content_scope:"plan-scheduled" },
  { id:"official-2", title:"التعبير", semester:1, official_content_scope:"plan-scheduled" },
  { id:"official-3", title:"التعبير", semester:1, official_content_scope:"plan-scheduled" },
  { id:"second-term", title:"حروف المد", semester:2, official_content_scope:"official-book-unscheduled" },
  { id:"enrichment", title:"قِراءَةٌ: وَطَنِي", semester:null, official_content_scope:null },
];
describe("Bahrain textbook title candidate review", () => {
  it("normalizes conservative Arabic orthographic variants, never invents grade equivalence",()=>{
    expect(normalizeTocTitle("القِراءةُ: الوَطَن")).toBe(normalizeTocTitle("القراءة الوطن"));
  });
  it("treats unique lesson title as candidate only and cross-term titles as missing",()=>{
    const m=inspectTocMatches("قراءة: وطني\nحروف المد",lessons,1);
    expect(m.map(x=>x.status)).toEqual(["candidate_only","missing"]);
    expect(m[0].lessonId).toBe("official-1");
    expect(m[1].lessonId).toBeNull();
  });
  it("flags duplicated textbook headings or multiple lesson candidates as ambiguous",()=>{
    expect(inspectTocMatches("التعبير\nالتعبير",lessons,1)
      .every(x=>x.status==="ambiguous")).toBe(true);
    expect(inspectTocMatches("قراءة: وطني\nقراءة: وطني",lessons,1)
      .every(x=>x.status==="ambiguous")).toBe(true);
  });
  it("does not count enrichment as an official match",()=>{
    const m=inspectTocMatches("حروف المد", lessons,1);
    expect(m[0].status).toBe("missing");
  });
  it("rejects plans, book listings and unofficial domains as actual textbook source links",()=>{
    expect(textbookSourceCandidate("https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf")).toBeNull();
    expect(textbookSourceCandidate("https://edunet.bh/manual/books2026/books1.pdf")).toBeNull();
    expect(textbookSourceCandidate("https://edunet.bh/Econtent/BooksGuide")).toBeNull();
    expect(textbookSourceCandidate("https://edunet.bh/Econtent/LessonsGuide")).toBeNull();
    expect(textbookSourceCandidate("https://evil.example/books.pdf")).toBeNull();
    expect(textbookSourceCandidate("https://www.edunet.bh/e_books/Book.aspx?id=234"))
      .toBe("https://www.edunet.bh/e_books/Book.aspx?id=234");
  });
  it("only previews grade two and never changes lesson or book status",()=>{
    const p=readFileSync("app/admin/curriculum/coverage/toc-review/grade-2/page.tsx","utf8");
    const a=readFileSync("app/admin/curriculum/coverage/toc-review/actions.ts","utf8");
    expect(p).toContain('grade_number", 2');
    expect(p).toContain('inspectTocMatches(saved.toc_outline');
    expect(p).toContain("مرشح عنوان فقط — لا اعتماد تلقائي");
    expect(p).not.toContain('.update(');
    expect(a).not.toContain('.from("lessons").update(');
    expect(a).toContain("textbookSourceCandidate(sourceInput)");
  });
});
