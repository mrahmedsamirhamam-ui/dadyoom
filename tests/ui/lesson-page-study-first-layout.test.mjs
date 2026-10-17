import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const page=readFileSync("app/lessons/[id]/page.tsx","utf8");
const nav=readFileSync("components/lesson/LessonPageJourneyNav.tsx","utf8");
describe("Dadyoom lesson study-first UX",()=>{
  test("overview explanation and practice precede secondary promotions",()=>{
    for(const [a,b] of [
      ['id="lesson-overview"','id="lesson-explanation"'],
      ['id="lesson-explanation"','id="lesson-practice"'],
      ['id="lesson-practice"','id="lesson-assessment"'],
      ['id="lesson-assessment"','id="lesson-extras"']
    ]) expect(page.indexOf(a)).toBeLessThan(page.indexOf(b));
    expect(page).toContain("ابدأ شرح الدرس");
    expect(page).toContain("أدوات إضافية للدرس");
    expect(page).toContain('id="lesson-final-quiz"');
  });
  test("keeps lesson activities learning tools and honest sourcing",()=>{
    for(const item of ["<LessonLearningSlides","<LessonPracticeWorkspace",
      "<InteractiveLessonActivities","<MultipleChoiceQuestion","<LessonTutor",
      "<LessonMasteryCard","<LessonSemanticSearch","<SmartQrCard",
      "<WeakQuestionsReview","<ScoreCard","<LearningCompleteLessonButton",
      "<StartLessonButton","<LessonProgressCard","<VocabularyCard",
      "lessonNeedsSourceReview(lesson.content)","sourceReviewRequired ? (",
      "مسار التعبير والكتابة الأصلي — ضاديوم"]) expect(page).toContain(item);
    expect(page).toContain("(initialCompleted ? 100 : 0)");
    expect(page).toContain('/lessons/${lesson.id}/games');
    expect(page).toContain('/lessons/${lesson.id}/study');
    expect(page).toContain('/lessons/${lesson.id}/video');
  });
  test("uses responsive accessible anchor navigation",()=>{
    expect((page.match(/<LessonPageJourneyNav/g)??[]).length).toBe(2);
    expect(nav).toContain('aria-label="خريطة رحلة التعلم"');
    expect(nav).toContain('href={"#" + item.id}');
    expect(nav).toContain("overflow-x-auto");
    expect(nav).toContain("min-h-11");
  });
});
