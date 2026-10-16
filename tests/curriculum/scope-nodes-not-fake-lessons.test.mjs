import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";

const load = (file) => readFileSync(file, "utf8");
const classification = load("lib/curriculum/lesson-content-kind.ts");
const page = load("app/lessons/[id]/page.tsx");
const api = load("app/api/courses/catalog/route.ts");
const service = load("services/lessons/student-curriculum-catalog.ts");
const catalog = load("app/courses/CurriculumCatalogClient.tsx");
const counts = load("lib/curriculum/catalog-item-counts.ts");

describe("National subject coverage is not automatically a completed lesson", () => {
  test("recognizes explicit domain descriptions without penalizing original teaching content", () => {
    for (const start of [
      "هذا المحتوى من إنشاء ضاديوم لتغطية مجال",
      "هذا درس أصلي من ضاديوم صُمم لتغطية الكفاية الرسمية",
      "تمثل هذه العقدة مجال",
      "حزمة أصلية من ضاديوم لتغطية معايير",
      "تغطية أصلية من ضاديوم لمجال",
      "حزمة وطنية أصلية لمواءمة العربية",
      "حزمة وطنية أصلية من ضاديوم لمواءمة العربية",
      "حزمة وطنية أصلية من ضاديوم لتغطية تعلم العربية",
    ]) expect(classification).toContain(start);
    expect(classification).toContain("originalLessonOpenings");
    expect(classification).toContain("body.startsWith(opening)");
    expect(classification).toContain("Length must not grant fake mastery");
    expect(classification).toContain("isEmptyLessonReference");
  });

  test("scope and empty-text resources skip the XP, mastery and quizzes of a real lesson", () => {
    expect(page).toContain("if (curriculumScope || emptyReference) {");
    expect(page).toContain('مجال من المنهج — ليس درسًا مستقلًا');
    expect(page).toContain('لا تُحتسب درجة أو نقاط إتقان');
    expect(page).toContain("const catalogLink = scoped ?");
    expect(page).toContain("const searchLink = scoped ?");
    expect(page).toContain('grade >= 1 && grade <= 13');
    const i = page.indexOf("if (curriculumScope || emptyReference)");
    const j = page.indexOf("const sourceReviewRequired =");
    expect(i).toBeGreaterThan(-1);
    expect(j).toBeGreaterThan(i);
    expect(page.slice(i,j)).not.toContain("<LessonMasteryCard");
    expect(page.slice(i,j)).not.toContain("<LearningCompleteLessonButton");
  });

  test("both catalog backends classify scope by summary and share the same resource-kind contract", () => {
    expect(api).toContain("isCurriculumScopeRecord({");
    expect(service).toContain("isCurriculumScopeRecord({");
    expect(service).toContain('"curriculum-scope"');
    expect(api).toContain('"curriculum-scope"');
    expect(counts).toContain('if (lesson.resourceKind === "curriculum-scope")');
    expect(counts).toContain("curriculumScopeCount");
    expect(catalog).toContain('lesson.resourceKind === "curriculum-scope" ?');
    expect(catalog).toContain("مجال دراسي — ليس درسًا مكتملًا");
    expect(catalog).toContain("مجال يحتاج تفصيل الدروس");
  });

  test("search results expose the national-domain classification without inventing a textbook lesson", () => {
    const api = load("app/api/lessons/search/route.ts");
    const widget = load("components/search/LessonSearchClient.tsx");
    expect(api).toContain("isCurriculumScopeRecord({ summary: item.summary, content: item.content })");
    expect(api).toContain("isEmptyLessonReference(item.content)");
    expect(api).toContain('"id,title,summary,content,semester,units!inner');
    expect(widget).toContain('lesson.resourceKind === "curriculum-scope"');
    expect(widget).toContain("مجال دراسي — يحتاج تفصيل الدروس");
    expect(widget).toContain("اعرف حالة المجال وابحث عن الدروس التفصيلية");
  });

  test("domain records cannot be counted as completed independent lessons", () => {
    const i = counts.indexOf('if (lesson.resourceKind === "curriculum-scope")');
    const j = counts.indexOf("lessonCount += 1;");
    expect(i).toBeGreaterThan(-1);
    expect(j).toBeGreaterThan(i);
    expect(counts.slice(i,j)).toContain("continue;");
  });
});
