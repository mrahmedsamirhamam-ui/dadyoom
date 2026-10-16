import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
const sql = readFileSync("data/curriculum-completeness/arab22-72-topic-specific-core-lesson-enrichment-20261016.sql","utf8");
const page = readFileSync("app/lessons/[id]/page.tsx","utf8");

describe("22-country mass content update is specific, safe and idempotent", () => {
  it("contains exactly 72 individually-written Arabic teaching packs", () => {
    const packs = sql.match(/^\('/gmu) ?? [];
    expect(packs).toHaveLength(72);
    expect(sql).toContain("أدوات الاستفهام");
    expect(sql).toContain("أتعلم من مثال محلول:");
    expect(sql).toContain("مفتاح المراجعة الذاتية:");
    expect(sql).toContain("خطوة التعمق:");
    expect(sql).toContain("حروف المد");
    expect(sql).toContain("المفعول به");
    expect(sql).toContain("مراجعة الثانوية الشاملة");
  });

  it("updates only precisely matched, published source-free core records without changing their identity", () => {
    expect(sql).toContain("JOIN original_packs p ON p.title=l.title");
    expect(sql).toContain("l.status='published'");
    expect(sql).toContain("co.is_active AND cu.is_active AND g.is_active");
    expect(sql).toContain("l.content LIKE 'درس ضاديوم الأصلي:%'");
    expect(sql).toContain("length(l.content)<650");
    expect(sql).toContain("l.source_pdf_url IS NULL");
    expect(sql).toContain("l.official_content_scope IS NULL");
    expect(sql).not.toContain("INSERT INTO public.lessons");
    expect(sql).not.toMatch(/UPDATE public\.grades/);
  });

  it("keeps all earlier instruction verbatim and prevents repeated mass appends", () => {
    expect(sql).toContain("المادة الأصلية السابقة كما نُشرت:");
    expect(sql).toContain("|| d.content");
    expect(sql).toContain("l.content NOT LIKE '%حزمة ضاديوم الموضوعية المتخصصة%'");
    expect(page).toContain('"حزمة ضاديوم الموضوعية المتخصصة"');
    expect(page).toContain('data-lesson-source-kind="dadyoom-original"');
  });

  it("explicitly distinguishes original practice from official textbook equivalence", () => {
    expect(sql).toContain("شرح أصلي غير منقول عن الكتاب الوزاري");
    expect(sql).toContain("لا يثبت تطابق درس رسمي في دولة محددة");
    expect(sql).toContain("BETWEEN 1 AND 3");
    expect(sql).toContain("BETWEEN 4 AND 6");
  });
});
