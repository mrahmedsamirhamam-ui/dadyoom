import { describe, expect, it } from "vitest";
import { auditLearningObjective, buildDadyoomTeachingDeck } from "../lib/lesson/dadyoom-teaching-journey";

const sample = {
  id: "bh-g6-arabic",
  title: "التعاون في خدمة المجتمع",
  summary: "يعرض النص أثر التعاون بين أفراد المجتمع في حماية البيئة وتنظيم الأماكن العامة.",
  content: "اتفق الطلاب على جمع النفايات من الحديقة في حملة تطوعية. تعاونوا على توزيع المهام وشرحوا أهمية العمل المشترك من خلال أمثلة من النص.",
  learning_objectives: [
    "أن يستنتج الطالب الفكرة العامة للنص.",
    "أن يحلل الطالب أثر التعاون في النص.",
    "أن يصوغ الطالب جملة توضح أهمية العمل المشترك.",
  ],
  vocabulary: [{word: "تطوع", meaning: "عمل يُقدَّم اختيارًا دون مقابل"}],
  instructions: ["استخرج من النص مثالًا على تعاون الطلاب، ثم شاركه مع مجموعتك."],
};

describe("Dadyoom's academically grounded teaching journey", () => {
  it("starts with classroom rules and brain-storming before revealing lesson title", () => {
    const deck = buildDadyoomTeachingDeck(sample);
    expect(deck?.slides[0].title).toBe("ميثاقنا الصفي");
    expect(deck?.slides[1].title).toContain("استنتج عنوان الدرس");
    expect(deck?.slides[2].kind).toBe("cover");
    expect(deck?.slides[2].title).toBe(sample.title);
  });

  it("gives every stored objective its own differentiated practice and formative assessment", () => {
    const deck = buildDadyoomTeachingDeck(sample);
    expect(deck).not.toBeNull();
    for (let i = 1; i <= 3; i++) {
      expect(deck?.slides.some((s) => s.title === `الهدف التعليمي ${i}`)).toBe(true);
      const activity = deck?.slides.find((s) => s.title === `نشاط متدرج للهدف ${i}`);
      expect(activity?.bullets).toHaveLength(3);
      expect(activity?.bullets?.[0]).toContain("دعم");
      expect(activity?.bullets?.[1]).toContain("مستوى أساسي");
      expect(activity?.bullets?.[2]).toContain("تحدٍّ");
      expect(deck?.slides.some((s) => s.title === `تقويم بنائي للهدف ${i}`)).toBe(true);
    }
  });

  it("connects a non-invented learning stimulus with subject links, values, access and exit tickets", () => {
    const deck = buildDadyoomTeachingDeck(sample);
    const all = JSON.stringify(deck);
    expect(all).toContain("اتفق الطلاب على جمع النفايات");
    expect(all).toContain("تذكرة الخروج");
    expect(all).toContain("مادة دراسية أخرى");
    expect(all).toContain("قيمة إسلامية أو إنسانية");
    expect(all).toContain("بديل ميسّر");
    expect(all).not.toMatch(/سورة\s|حديث صحيح|https?:\/\//u);
  });

  it("flags a compound objective for teacher revision instead of certifying it", () => {
    const objective = auditLearningObjective("أن يحدد الطالب الفكرة ويقارن بين الحجج.");
    expect(objective.needsTeacherReview).toBe(true);
    expect(objective.singleAction).toBe(false);
    expect(auditLearningObjective("أن يشرح الطالب الفكرة بدليل.").bloom).toBe("understand");
  });

  it("does not pretend to have a learning experience if source content is absent", () => {
    expect(buildDadyoomTeachingDeck({id:"missing",title:"درس بلا محتوى",summary:null,content:null}))
      .toBeNull();
  });

  it("does not claim school accreditation or quote a source it does not possess", () => {
    const all = JSON.stringify(buildDadyoomTeachingDeck(sample));
    expect(all).not.toContain("معتمد رسميًا");
    expect(all).not.toContain("آية قرآنية:");
    expect(all).not.toContain("شاهد الفيديو");
    expect(all).not.toContain("قررت الوزارة");
  });
});
