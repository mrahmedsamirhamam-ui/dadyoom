import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  publicLessonActivityPrompts,
  publicLessonSlideInstructions,
  hasUnreviewedCurriculumSource,
  publicLessonVocabulary,
  publicLessonTeachingText,
} from "../lib/curriculum/public-lesson-instructions";

describe("Public original lesson activities for every Arab curriculum", () => {
  const data = [
    "قراءة فردية قصيرة",
    { kind: "activities", items: [
      { level: "أساسي", title: "تهيئة", instructions: "لاحظ العنوان واستنتج الفكرة.", answer: "مفتاح سرّي" },
      { level: "متقدم", title: "تحدّي", instructions: "أنشئ مثالًا من عندك.", correctAnswer: "مفتاح سرّي 2" },
      { title: "إعادة", instructions: "لاحظ العنوان واستنتج الفكرة." },
      { title: "سؤال مُفسد", instructions: "الإجابة الصحيحة: الخيار أ" },
    ]},
    { kind: "assessment", items: [{ question: "السؤال", answer: "مفتاح سرّي 3", instructions: "هذه ليست أنشطة منشورة" }] },
    { kind: "dadyoom_source", source_content_status: "MVP_DRAFT", source_publication_ready: false },
    { kind: "slides", items: [{ title: "القراءة", body: "تعرّف الفكرة.", correctAnswer: "مفتاح سرّي 4" }] },
  ];

  it("surfaces real structured and legacy learning activities without duplicate fillers", () => {
    expect(publicLessonActivityPrompts(data)).toEqual([
      { title: "نشاط تعليمي", level: "", instructions: "قراءة فردية قصيرة" },
      { title: "تهيئة", level: "أساسي", instructions: "لاحظ العنوان واستنتج الفكرة." },
      { title: "تحدّي", level: "متقدم", instructions: "أنشئ مثالًا من عندك." },
    ]);
  });
  it("redacts all grading, assessment and source metadata from browser-bound slide props", () => {
    const slides = publicLessonSlideInstructions(data);
    expect(slides).toEqual([{ kind:"slides", items:[{ title:"القراءة", body:"تعرّف الفكرة." }] }]);
    const htmlPayload = JSON.stringify({ activities:publicLessonActivityPrompts(data), slides });
    expect(htmlPayload).not.toMatch(/answer|correct|مفتاح سرّي|MVP_DRAFT|الإجابة الصحيحة/i);
    expect(publicLessonSlideInstructions([{kind:"assessment",items:[{body:"mystery"}]}])).toEqual([]);
    expect(publicLessonActivityPrompts([{kind:"assessment",items:[{instructions:"private"}]}])).toEqual([]);
  });
  it("does not assume every published lesson is ministry-verified", () => {
    expect(hasUnreviewedCurriculumSource(data)).toBe(true);
    expect(hasUnreviewedCurriculumSource([{kind:"dadyoom_source",source_publication_ready:true}])).toBe(false);
    expect(hasUnreviewedCurriculumSource(null)).toBe(false);
  });
  it("rejects oversized or malformed objects and never serializes unknown nested data", () => {
    const rows = publicLessonActivityPrompts([{kind:"activities",items:[
      null, 42, {instructions:{answer:"hidden"}},
      ...Array.from({length:25},(_,i)=>({title:"نشاط",level:"owner",instructions:"تطبيق رقم "+i,secret:"hidden"})),
    ]}]);
    expect(rows).toHaveLength(18);
    expect(rows[0].level).toBe("");
    expect(JSON.stringify(rows)).not.toContain("hidden");
  });
  it("hides teacher answer keys from lesson text, slides, and AI-tutor context",()=>{
    const source=[
      "أقرأ النص وأستنتج الفكرة.",
      "مفتاح الإجابة: أعادت الطفلةُ الكتابَ إلى المكتبة.",
      "",
      "تنبيه حقوق: القطعة من ضاديوم.",
      "مفتاح المراجعة ومؤشرات الاستجابة الصحيحة:",
      "عودة الكتاب إلى المكتبة.",
      "تُقبل الجملة المكافئة.",
      "",
      "بعد القراءة: أصوغ فكرة مستقلة.",
      "الإجابة النموذجية: سر آخر",
      "",
      "خاتمة الدرس.",
    ].join("\n");
    const learner=publicLessonTeachingText(source);
    expect(learner).toContain("أقرأ النص");
    expect(learner).toContain("تنبيه حقوق");
    expect(learner).toContain("بعد القراءة");
    expect(learner).toContain("خاتمة الدرس");
    expect(learner).not.toMatch(/مفتاح الإجابة|أعادت الطفلة|مفتاح المراجعة|تُقبل الجملة المكافئة|الإجابة النموذجية|سر آخر/u);
    expect(publicLessonTeachingText(null)).toBe("");
    const page=readFileSync(resolve(process.cwd(),"app/lessons/[id]/page.tsx"),"utf8");
    expect(page).toContain("lessonContent={teachingContent}");
    expect(page).toContain("content={teachingContent}");
    expect(page).toContain("{teachingContent}");
    expect(page).not.toContain("lessonContent={lesson.content");
    expect(page).not.toContain("content={lesson.content}");
  });
  it("keeps analysis and independent practice in 22-country common-skill modules but hides model answers",()=>{
    const model=[
      "أفهم القاعدة أو الفكرة:",
      "الحجّةُ تحتاج إلى دليلٍ.",
      "أطبق بنفسي: اقترح دليلًا.",
      "مفتاح المراجعة الذاتية:",
      "الإجابة السرية هي استعمال الحجة الصحيحة.",
      "خطوة التحليل: بيّن أثر الشاهد في المعنى.",
      "مهمة الإتقان: أعد كتابة الفكرة مع تعليلها.",
      "تنبيه المصدر: هذا إثراء مستقل.",
    ].join("\n");
    const learner=publicLessonTeachingText(model);
    expect(learner).toContain("الحجّةُ تحتاج");
    expect(learner).toContain("خطوة التحليل");
    expect(learner).toContain("مهمة الإتقان");
    expect(learner).toContain("أطبق بنفسي");
    expect(learner).not.toContain("الإجابة السرية");
    expect(learner).not.toContain("مفتاح المراجعة الذاتية");
    expect(learner).toContain("تنبيه المصدر");
  });
  it("recovers 295 already-stored RLS-visible vocabulary lists without exposing nested answer fields",()=>{
    const restored=publicLessonVocabulary([],[
      {word:"تعاون",meaning:"مساعدة الآخرين",correctAnswer:"private-key"},
      {word:"تعاون",meaning:"duplicate"},
      {word:"كتاب",meaning:"مجموعة أوراق نافعة",answer:{key:"private-key"}},
      {word:"الإجابة الصحيحة: ب",meaning:"السر"},
      {word:"فارغ",meaning:null},
    ]);
    expect(restored).toEqual([
      {word:"تعاون",meaning:"مساعدة الآخرين"},
      {word:"كتاب",meaning:"مجموعة أوراق نافعة"},
    ]);
    expect(JSON.stringify(restored)).not.toContain("private-key");
    expect(publicLessonVocabulary([{word:"قلم",meaning:"أداة كتابة"}],[{word:"hidden",meaning:"wrong"}]))
      .toEqual([{word:"قلم",meaning:"أداة كتابة"}]);
  });
  it("shows full published lesson content in safe escaped React text and passes slide allowlist only", () => {
    const page=readFileSync(resolve(process.cwd(),"app/lessons/[id]/page.tsx"),"utf8");
    expect(page).toContain("publicLessonActivityPrompts(lesson.instructions)");
    expect(page).toContain("publicLessonSlideInstructions(lesson.instructions)");
    expect(page).toContain("instructions={publicSlideInstructions}");
    expect(page).not.toContain("instructions={lesson.instructions}");
    expect(page).toContain("whitespace-pre-wrap");
    expect(page).toContain("{teachingContent}");
    expect(page).toContain("publicLessonTeachingText(lesson.content)");
    expect(page).not.toContain("\n                {lesson.content}\n");
    expect(page).toContain('.from("lesson_vocabulary")');
    expect(page).toContain('.eq("lesson_id", lesson.id)');
    expect(page).toContain('if (vocabulary.length === 0 && user)');

    expect(page).not.toContain("dangerouslySetInnerHTML");
  });
});
describe("All-22-country curriculum health report remains read-only",()=>{
  it("surfaces unpublished/MVP, missing metadata, missing verified sources and under-assessed lessons",()=>{
    const sql=readFileSync(resolve(process.cwd(),"scripts/arab-22-curriculum-readonly-audit.sql"),"utf8");
    expect(sql).toContain("published_mvp_draft");
    expect(sql).toContain("missing_embedded_vocabulary");
    expect(sql).toContain("needs_assessment_review");
    expect(sql).toContain("source_content_status");
    expect(sql).toContain("thematic_enrichment_template_rows");
    expect(sql).toContain("labelled_review_key_rows");
    expect(sql).toContain("official_content_scope_unspecified_rows");
    expect(sql).toContain("official_content_scope");
    expect(sql).toContain("co.code");
    const executable = sql.replace(/--[^\n]*/g,"");
    expect(executable).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|CREATE)\s+(?:INTO|FROM|ON|TABLE|VIEW|public\.)/i);
    expect(sql).not.toMatch(/correct_answer|lesson_activity_attempts|user_id|student_id/i);
  });
});
