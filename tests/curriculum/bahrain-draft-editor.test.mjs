import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { validateBahrainDraftCorrection } from "../../lib/curriculum/bahrain-draft-correction";
const action=readFileSync("app/admin/lessons/[id]/actions.ts","utf8");
const page=readFileSync("app/admin/lessons/[id]/page.tsx","utf8");

const valid={title:"القراءة: صديقتي مريم",summary:"فهم النص واستخراج فكرته",
 content:"شرح أصلي ومهام صفية قابلة للتحقق",sourceUrl:"",sourcePageStart:"",sourcePageEnd:""};

describe("Bahrain draft editorial correction without unauthorized publication",()=>{
  test("allows editing an existing draft without inventing a textbook URL",()=>{
    const result=validateBahrainDraftCorrection(valid);
    expect(result.ok).toBe(true);
    if(result.ok){
      expect(result.draft.title).toBe(valid.title);
      expect(result.draft.source_pdf_url).toBeNull();
      expect(result.draft.source_page_start).toBeNull();
      expect(result.draft).not.toHaveProperty("status");
    }
  });
  test("rejects plans, catalog listings and invalid page ranges as official textbook citations",()=>{
    for(const fields of [
      {...valid,sourceUrl:"https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan1.pdf"},
      {...valid,sourceUrl:"https://edunet.bh/manual/books2026/books1.pdf"},
      {...valid,sourceUrl:"http://edunet.bh/book.pdf"},
      {...valid,sourceUrl:"https://evil.example/book.pdf"},
      {...valid,sourcePageStart:"12",sourcePageEnd:""},
      {...valid,sourceUrl:"https://edunet.bh/e_content/book.pdf",sourcePageStart:"21",sourcePageEnd:"12"},
    ]) expect(validateBahrainDraftCorrection(fields).ok).toBe(false);
  });
  test("server requires admin auth + BH + current draft status before privileged write",()=>{
    expect(action).toContain("getDashboardRequestViewer()");
    expect(action).toContain('!== "admin"');
    expect(action).toContain('row.status !== "draft"');
    expect(action).toContain('country?.code !== "BH"');
    expect(action).toContain('.eq("status", "draft")');
    expect(action).toContain('.update(parsed.draft)');
    expect(action).not.toContain('status: "published"');
    expect(page).toContain('lesson.status === "draft" && country?.code === "BH"');
    expect(page).toContain("حفظ التصحيحات كمسودة — بدون نشر");
  });
});
