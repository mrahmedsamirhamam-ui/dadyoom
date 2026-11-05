import { describe, expect, it } from "vitest";
import { buildGroundedLessonDeck } from "@/lib/lesson-slides/grounded-deck";

function teachingText(deck: ReturnType<typeof buildGroundedLessonDeck>): string {
  return deck.slides.flatMap((slide) => [
    slide.title, slide.callout ?? "", slide.question ?? "", ...(slide.bullets ?? []),
  ]).join(" ");
}

describe("lesson presentations must teach the actual lesson, not objectives alone", () => {
  const content = [
    "يتحدث الدرس عن أهمية المحافظة على المياه في الحياة اليومية.",
    "تحتاج النباتات إلى الماء لكي تنمو، ويحتاج الإنسان إلى الماء للشرب والنظافة.",
    "ومن وسائل ترشيد المياه إغلاق الصنبور أثناء غسل الأسنان وإصلاح التسربات.",
    "نقارن بين الاستخدام الضروري والإسراف في الموارد الطبيعية.",
  ].join("\n");

  it("includes source explanation alongside objectives in the on-screen/export deck", () => {
    const deck = buildGroundedLessonDeck({
      title: "الماء نعمة",
      learning_objectives: ["يتعرف المتعلم أهمية المياه"],
      content,
    });
    const text = teachingText(deck);
    expect(deck.needsContentReview).toBe(false);
    expect(deck.slides.some((slide) => slide.kind === "concept")).toBe(true);
    expect(text).toContain("إغلاق الصنبور");
    expect(text).toContain("الإسراف");
    expect(text).toContain("يتعرف المتعلم أهمية المياه");
  });

  it("keeps longer paragraphs instead of discarding them by an upper length filter", () => {
    const long = "يروي النص قصة تعاون الأطفال في الحي من أجل تنظيف الحديقة العامة وتوفير مكان آمن للقراءة واللعب والتواصل مع الآخرين. ".repeat(9);
    const deck = buildGroundedLessonDeck({title: "الحديقة",content: long});
    const chunks = deck.slides.filter((slide) => slide.kind === "concept");
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.flatMap((slide) => slide.bullets ?? []).join(" ")).toContain("تنظيف الحديقة");
    expect(chunks.flatMap((slide) => slide.bullets ?? []).join(" ")).toContain("للعب والتواصل");
  });

  it("shows an explicit missing-content notice for catalogue-only records", () => {
    const deck = buildGroundedLessonDeck({
      title: "القراءة — الجزء الأول",
      content: "راجع الكتاب الرسمي أو نسخة مرخصة منه، ثم استخدم أنشطة ضاديوم الأصلية للفهم والتطبيق دون إعادة نشر محتوى الكتاب.",
      learning_objectives: ["أقرأ", "أفهم"],
    });
    expect(deck.needsContentReview).toBe(true);
    expect(deck.slides.some((slide) => slide.kind === "concept")).toBe(false);
    expect(teachingText(deck)).toContain("الشرح يحتاج إلى استكمال");
  });

  it("never substitutes goals for missing explanation", () => {
    const deck = buildGroundedLessonDeck({
      title: "درس لم يكتمل",
      learning_objectives: ["أن يذكر", "أن يقرأ"],
      content: "",
    });
    expect(deck.needsContentReview).toBe(true);
    expect(deck.slides.some((slide) => slide.kind === "objectives")).toBe(false);
  });

  it("integrates the saved vocabulary without inventing definitions", () => {
    const deck = buildGroundedLessonDeck({
      title: "الماء نعمة",
      content,
      vocabulary: [{word:"ترشيد",meaning:"حسن الاستخدام"}],
    });
    expect(teachingText(deck)).toContain("ترشيد — حسن الاستخدام");
  });

  it("uses source-backed teaching slides if the main content is unavailable", () => {
    const deck = buildGroundedLessonDeck({
      title: "درس",
      instructions: [{kind:"slides",items:[{title:"الشرح",body:"يتأمل التلميذ القصة ويقرأ الفقرة الأولى ثم يفسر سلوك الشخصية ويربطه بقيمة التعاون بين الناس."}]}],
    });
    expect(deck.needsContentReview).toBe(false);
    expect(teachingText(deck)).toContain("قيمة التعاون");
  });

  it("flags overflow instead of silently claiming the entire text is represented", () => {
    const deck = buildGroundedLessonDeck({
      title: "موضوع طويل",
      content: "يفسر الكاتب الحدث ويربطه بالشخصيات والمكان والزمان والنتيجة، ثم يقدم فكرة جديدة يستطيع المتعلم مناقشتها. ".repeat(350),
    });
    expect(deck.omittedContent).toBe(true);
    expect(teachingText(deck)).toContain("أكمل القراءة");
  });
});
