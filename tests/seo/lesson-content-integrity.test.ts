import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isKnownNonTeachingLessonPlaceholder } from "@/lib/lesson-content-integrity";

const boilerplate =
  "يتناول هذا الدرس موضوع «الدّرس الثّالث». " +
  "يبدأ التعلم بتهيئة قصيرة، ثم قراءة أو مناقشة الموضوع، " +
  "واستخراج الفكرة الرئيسة، ثم تطبيقها في نشاط شفهي وكتابي مناسب لمستوى الطالب.";

describe("lesson content integrity", () => {
  it("recognizes the exact short published Bahrain generic template", () => {
    expect(isKnownNonTeachingLessonPlaceholder(boilerplate)).toBe(true);
    expect(isKnownNonTeachingLessonPlaceholder(`  ${boilerplate}  `)).toBe(true);
  });

  it("does not suppress real explanations, small lessons or nonstring data", () => {
    const realExplanation =
      "يتناول هذا الدرس موضوع «الفاعل». يبدأ التعلم بتهيئة قصيرة، " +
      "ويستخرج الفكرة الرئيسة من المثال: قرأَ الطالبُ الكتابَ. " +
      "الفاعل اسم مرفوع يدل على من قام بالفعل، وعلامة رفعه الضمة.";
    expect(isKnownNonTeachingLessonPlaceholder(realExplanation)).toBe(false);
    expect(isKnownNonTeachingLessonPlaceholder(
      boilerplate + " ".repeat(500) + "شرح موسع"
    )).toBe(false);
    expect(isKnownNonTeachingLessonPlaceholder(null)).toBe(false);
    expect(isKnownNonTeachingLessonPlaceholder("تعريف واضح للفاعل")).toBe(false);
  });

  it("the lesson page warns students and withholds boilerplate from AI/slides", () => {
    const file = readFileSync("app/lessons/[id]/page.tsx", "utf8");
    expect(file).toContain("isKnownNonTeachingLessonPlaceholder(lesson.content)");
    expect(file).toContain("محتوى هذا الدرس قيد المراجعة");
    expect(file).toContain('lessonContent={lessonNeedsSourceReview ? "" : lesson.content ?? ""}');
    expect(file).toContain("{!lessonNeedsSourceReview ? (");
    expect(file).toContain("{user && !lessonNeedsSourceReview ? (");
    expect(file).toContain('href="/courses"');
  });
});
