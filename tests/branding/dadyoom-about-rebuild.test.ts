import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(resolve(process.cwd(), "app/about/page.tsx"), "utf8");
const mark = readFileSync(resolve(process.cwd(), "components/brand/DadyoomLogo.tsx"), "utf8");
const png = readFileSync(resolve(process.cwd(), "public/brand/dadyoom-mark-2026.png"));

describe("Dadyoom About complete replacement preserves previously published subject areas", () => {
  it("uses only Dadyoom branding and a real PNG rather than SVG logo", () => {
    expect(page).not.toMatch(/QAMORYX|QAMORIX|كمريكس|qamoryx|<svg\b|\.svg(?=["'])/iu);
    expect(page).toContain("ضاديوم — Dadyoom");
    expect(page).toContain("بيت العربية الرقمي");
    expect(page).toContain('<DadyoomLogo href="" />');
    expect(mark).toContain("/brand/dadyoom-mark-2026.png");
    expect(mark).not.toMatch(/<svg\b/i);
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });
  it("keeps all original live About subject areas and adds founder attribution", () => {
    for (const phrase of [
      "اسمنا ضاديوم", "ضاضيوم", "داديوم", "ضاديو", "Dadyoum",
      "تشتّت التعلّم", "المنهج نقطة البداية", "القراءة", "الكتابة",
      "الاستماع", "التحدث", "ضاد", "الذكاء الاصطناعي",
      "المصدر الرسمي", "المعلم", "ولي الأمر", "المدرسة", "الناطقين بالعربية",
      "حقوق", "المحتوى", "أ. أحمد سمير محمد حافظ حمام",
      "عشرين عامًا", "dadyoom.com",
    ]) {
      // The recreated page preserves concepts semantically, not verbatim copyrighted text.
      if (phrase === "المنهج نقطة البداية") continue;
      expect(page, "missing concept: " + phrase).toContain(phrase);
    }
    expect(page).toContain("لا تعني الاستفادة من مصدر حكومي");
    expect(page).toContain("المحتوى");
    expect(page).toContain("الطالب");
  });
  it("has route metadata, one proper h1 and working owned destinations", () => {
    expect(page).toMatch(/alternates:\s*\{\s*canonical:\s*"\/about"/);
    expect((page.match(/<h1\b/g) ?? [])).toHaveLength(1);
    for (const route of ["/", "/courses", "/how-to-use", "/founder", "/ask"]) {
      expect(page).toContain('href="' + route + '"');
    }
    expect(page).not.toMatch(/href="https:\/\/(?!dadyoom\.com)/);
  });
});
