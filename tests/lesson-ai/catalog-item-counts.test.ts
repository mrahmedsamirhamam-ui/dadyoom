import { describe, expect, it } from "vitest";
import { countCatalogItems } from "../../lib/curriculum/catalog-item-counts";

describe("catalog counts distinguish lessons from source books", () => {
  const units = [
    {
      curriculum: { name: "اللغة العربية — المنهج الفلسطيني" },
      lessons: [
        { resourceKind: "book-reference" as const, completed: false },
        { resourceKind: "lesson" as const, completed: true },
        { resourceKind: "lesson" as const, completed: false },
      ],
    },
    {
      curriculum: { name: "المسار العربي الأساسي لضاديوم" },
      lessons: [{ resourceKind: "lesson" as const, completed: false }],
    },
  ];
  it("does not label a book reference as a published or completed lesson", () => {
    expect(countCatalogItems(units)).toEqual({
      lessonCount: 3,
      completedLessonCount: 1,
      officialLessonCount: 2,
      supportingLessonCount: 1,
      bookReferenceCount: 1,
    });
  });
  it("counts null resource kinds as ordinary legacy lessons", () => {
    expect(countCatalogItems([{ curriculum: { name: "مسار رسمي" }, lessons: [{ completed: true }] }]).lessonCount).toBe(1);
  });
  it("handles an empty selection", () => {
    expect(countCatalogItems([]).lessonCount).toBe(0);
  });
});

describe("catalog UI source transparency", () => {
  it("does not label unclassified national material as a verified match", async () => {
    const fs = await import("node:fs");
    const source = fs.readFileSync(
      new URL("../../app/courses/CurriculumCatalogClient.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain("تصنيف مصدر بعض الدروس قيد التحقق");
    expect(source).toContain("تصنيف الدرس وفق مصدره وخطته قيد التحقق");
    expect(source).toContain("lesson.officialContentScope == null");
    expect(source).not.toContain(': "المطابقة الوطنية الموثقة"}');
  });
});
