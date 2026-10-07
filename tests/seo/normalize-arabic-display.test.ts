import { describe, expect, it } from "vitest";

import { normalizeArabicDisplayText } from "../../lib/seo/normalize-arabic-display";

describe("normalizeArabicDisplayText", () => {
  it("removes conservative OCR spacing artifacts", () => {
    expect(
      normalizeArabicDisplayText(
        "الإ نتاج الكتابيّ : تفكيك الموضوع ( 1 .)",
      ),
    ).toBe(
      "الإنتاج الكتابيّ: تفكيك الموضوع (1.)",
    );
  });

  it("repairs common Arabic OCR hamza ordering", () => {
    expect(
      normalizeArabicDisplayText(
        "اإلنتاج الكتابي: وصف األحداث",
      ),
    ).toBe(
      "الإنتاج الكتابي: وصف الأحداث",
    );
  });

  it("drops a stray leading closing parenthesis and trailing dash", () => {
    expect(
      normalizeArabicDisplayText(
        ")القراءة: درّاجتي (شعر/ : دراسة القصيدة كاملة -",
      ),
    ).toBe(
      "القراءة: درّاجتي (شعر: دراسة القصيدة كاملة",
    );
  });

  it("keeps already clean Arabic titles unchanged", () => {
    const title =
      "السيرة الذاتية: «حياتي» لأحمد أمين.";

    expect(
      normalizeArabicDisplayText(title),
    ).toBe(title);
  });
});
