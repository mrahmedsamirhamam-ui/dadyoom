import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const page = readFileSync("app/admin/curriculum/coverage/drafts/page.tsx", "utf8");
const coverage = readFileSync("app/admin/curriculum/coverage/page.tsx", "utf8");

describe("Bahrain administrative draft review guard", () => {
  test("review shows only Bahrain drafts and links to editor", () => {
    expect(page).toContain('.eq("code", "BH")');
    expect(page).toContain('.eq("status", "draft")');
    expect(page).toContain("/admin/lessons/");
    expect(coverage).toContain('/admin/curriculum/coverage/drafts');
  });
  test("missing provenance, activities and assessments remain visible as blockers", () => {
    expect(page).toContain('لا يوجد رابط لمرجع الكتاب');
    expect(page).toContain('لا توجد أنشطة منشورة');
    expect(page).toContain('لا توجد أسئلة تقييم');
    expect(page).toContain('شرح عام آلي يحتاج مطابقة ومراجعة');
  });
  test("review never mutates, auto-approves or publishes lessons", () => {
    for (const mutation of ['.insert(', '.upsert(', '.update(', '.delete(', '.rpc(', '.eq("status", "published")']) {
      expect(page).not.toContain(mutation);
    }
    expect(page).toContain("Read-only administrative queue");
    expect(page).toContain("لم يتم نشر أو تعديل أي درس");
  });
});
