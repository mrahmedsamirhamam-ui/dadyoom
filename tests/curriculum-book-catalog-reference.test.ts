import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isBookCatalogReference } from "../lib/curriculum/book-catalog-reference";

const source=readFileSync(resolve(process.cwd(),"app/lessons/[id]/page.tsx"),"utf8");

describe("book catalog reference is not misrepresented as a scored lesson", () => {
  it("recognizes the explicit official-book index even without a lesson body", () => {
    expect(isBookCatalogReference({ content:null, summary:"عقدة تغطية رسمية تمثل كتاب اللغة العربية" })).toBe(true);
    expect(isBookCatalogReference({ content:" ", summary:" عقدة تغطية رسمية - كتاب"})).toBe(true);
  });
  it("never hides a real published lesson or an unrelated empty title", () => {
    expect(isBookCatalogReference({ content:"شرح أصلي ومراجعة", summary:"عقدة تغطية رسمية" })).toBe(false);
    expect(isBookCatalogReference({ content:"", summary:"تدريب قراءة حقيقي" })).toBe(false);
    expect(isBookCatalogReference({ content:null, summary:null })).toBe(false);
  });
  it("renders catalog references before enabling mastery or question controls", () => {
    const check=source.indexOf("if (isBookCatalogReference(lesson))");
    const returnPage=source.indexOf("<main dir=\"rtl\"",check);
    const lessonQuestions=source.indexOf("const lessonQuestions =");
    const app=source.indexOf("StartLessonButton",source.indexOf("export default async function"));
    expect(check).toBeGreaterThan(-1);
    expect(returnPage).toBeGreaterThan(check);
    expect(lessonQuestions).toBeGreaterThan(returnPage);
    expect(app).toBeGreaterThan(lessonQuestions);
    expect(source).toContain("مرجع كتاب رسمي — ليس درسًا تعليميًا");
  });
});
