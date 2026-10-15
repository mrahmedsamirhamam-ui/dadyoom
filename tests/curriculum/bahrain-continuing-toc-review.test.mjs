import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = (path) => readFileSync(path, "utf8");
const route = read("app/admin/curriculum/coverage/toc-review/continuing/[level]/[term]/page.tsx");
const nav = read("app/admin/curriculum/coverage/toc-review/page.tsx");
const helper = read("lib/curriculum/bahrain-continuing-level-review.ts");
const audit = JSON.parse(read("data/curriculum-completeness/bahrain-book-completeness-2026-2027.json"));
describe("Bahrain continuing education 12-scope review", () => {
  it("routes all six levels and two terms through isolated evidence", () => {
    expect(audit.books.filter(book => book.program === "التعليم المستمر")).toHaveLength(12);
    expect((helper.match(/: "(?:الأول|الثاني) (?:محو الأمية|متابعة|تقوية)"/gu) ?? [])).toHaveLength(6);
    expect(nav).toContain('continuingSlug(book.level)');
  });
  it("filters exact curriculum, grade name, term and requires admin", () => {
    expect(route).toContain('eq("name_ar", "اللغة العربية — التعليم المستمر")');
    expect(route).toContain('eq("name_ar", level)');
    expect(route).toContain('eq("semester", term)');
    expect(route).toContain('profile?.role?.trim().toLowerCase() !== "admin"');
    expect(route).toContain('inspectTocMatches(evidence.data.toc_outline, candidates, term)');
  });
  it("never promotes title candidates to approved official lessons", () => {
    expect(route).toContain("مرشح عنوان فقط — لا اعتماد تلقائي");
    expect(route).toContain("خطة الفصل الثاني 2026–2027 لم تثبت");
    expect(route).not.toContain('.from("lessons").update(');
    expect(route).not.toContain('.from("lessons").insert(');
  });
});
