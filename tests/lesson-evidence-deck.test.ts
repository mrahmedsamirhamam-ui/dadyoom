import { describe, expect, it } from "vitest";
import { buildEvidenceDeck } from "../lib/lesson/evidence-slide-deck";

const title = "فهم النص والتعبير عنه";

describe("Dadyoom evidence-based learning slide builder", () => {
  it("refuses to create a completed-looking presentation from a title alone", () => {
    expect(buildEvidenceDeck({
      id: "lesson-a", title, summary: null, content: null,
      learning_objectives: [], vocabulary: [],
    })).toBeNull();
  });

  it("never fabricates objectives, vocabulary, activities or answers", () => {
    const deck = buildEvidenceDeck({
      id: "lesson-b", title, summary: "نتعلم قراءة الفكرة الرئيسة في نص قصير.",
      content: "تدور القطعة حول تعاون التلاميذ في العناية بالمكتبة، ويناقش النص أثر التعاون في الحفاظ على النظام.",
      learning_objectives: [], vocabulary: [], instructions: [],
    });
    expect(deck).not.toBeNull();
    expect(deck?.slides.some((slide) => slide.kind === "objectives")).toBe(false);
    expect(deck?.slides.some((slide) => slide.kind === "activity")).toBe(false);
    expect(deck?.slides.some((slide) => slide.answer)).toBe(false);
    expect(JSON.stringify(deck)).not.toContain("فهم الفكرة الرئيسية للدرس");
  });

  it("uses stored teaching goals, explanations, vocabulary and tasks", () => {
    const deck = buildEvidenceDeck({
      id: "lesson-c", title,
      summary: "يتعرف الطالب إلى الفكرة الرئيسة للنص.",
      content: "قرأ الطفل النص وحدد الفكرة الرئيسة من الأدلة الواردة فيه. وضّح الفرق بين الفكرة الرئيسة والتفصيل الداعم لها.",
      learning_objectives: ["أن يستنتج الطالب الفكرة العامة للنص بعد القراءة."],
      vocabulary: [{word: "تعاون", meaning: "عمل مشترك لتحقيق هدف"}],
      instructions: ["استخرج من النص دليلًا على تعاون التلاميذ ثم ناقشه مع زميلك."],
    });
    expect(deck).not.toBeNull();
    const contents = JSON.stringify(deck);
    expect(contents).toContain("أن يستنتج الطالب");
    expect(contents).toContain("عمل مشترك");
    expect(contents).toContain("استخرج من النص");
    expect(deck?.slides.some((slide) => slide.kind === "objectives")).toBe(true);
    expect(deck?.slides.some((slide) => slide.kind === "activity")).toBe(true);
  });

  it("does not silently discard paragraphs longer than the old 180-character cutoff", () => {
    const paragraph = "وتحليل المعنى من خلال الشواهد يمنح الطالب فرصة لفهم العلاقات بين أحداث النص وتفسيرها في ضوء ما قرأه. ".repeat(6);
    const deck = buildEvidenceDeck({
      id: "lesson-d", title, summary: null, content: paragraph,
    });
    const concepts = deck?.slides.filter((slide) => slide.kind === "concept") ?? [];
    expect(concepts.length).toBeGreaterThan(0);
    expect(concepts.flatMap((slide) => slide.bullets ?? []).join(" ")).toContain("الشواهد");
  });

  it("keeps the deck linked to the current source rather than reused cached AI text", () => {
    const one = buildEvidenceDeck({id:"one",title,summary:"ملخص أول يتحدث عن الصدق في الحياة.",content:null});
    const two = buildEvidenceDeck({id:"two",title,summary:"ملخص ثان يشرح التعاون بين الزملاء.",content:null});
    expect(JSON.stringify(one)).toContain("الصدق");
    expect(JSON.stringify(two)).toContain("التعاون");
    expect(JSON.stringify(two)).not.toContain("الصدق");
  });
});
