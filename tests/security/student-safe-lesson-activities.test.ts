import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { publicLessonActivities } from "../../features/lesson-activities/services/public-lesson-activities";

const { createClient, createAdminClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));

import { getLessonPageBundle } from "../../features/lessons/queries/getLessonPageBundle";

function fixtureActivity() {
  return {
    id: "activity-1",
    lesson_id: "lesson-1",
    title: "تدريب على الحروف",
    activity_type: "multiple_choice",
    instructions: "اختر الحرف",
    activity_order: 1,
    points: 5,
    is_published: true,
    section: "القراءة",
    created_at: "2026-10-23",
    updated_at: "2026-10-23",
    answer: { correctAnswer: "private" },
    privateTeacherNotes: "do-not-forward",
    content: {
      text: "أي حرف صحيح؟",
      options: [
        { id: "a", text: "الألف", isCorrect: true, score: 10 },
        { id: "b", text: "الباء", "correct_answer": "a" },
      ],
      nested: {
        prompt: "تعلم بالمرح",
        solution: { expectedAnswer: "a" },
        examples: [{ label: "مثال", answerKey: "a" }],
      },
    },
  };
}

function bundle(student: { id: string } | null) {
  return {
    lesson: { id: "lesson-1", title: "درس تجريبي" },
    questions: [],
    activities: [fixtureActivity()],
    student,
    completed: false,
    questionAttempts: [],
    learningProgress: null,
    tutorMessages: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("student-safe published and private-preview activity serialization", () => {
  it("retains educational text, images and answer options without answer hints", () => {
    const row = fixtureActivity();
    row.content.options.push({
      id: "c", text: "الجيم", isCorrect: false, score: 0,
    } as typeof row.content.options[number]);
    const result = publicLessonActivities([row]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "activity-1", title: "تدريب على الحروف",
      content: {
        text: "أي حرف صحيح؟",
        options: [
          { id: "a", text: "الألف", score: 10 },
          { id: "b", text: "الباء" },
          { id: "c", text: "الجيم", score: 0 },
        ],
        nested: {
          prompt: "تعلم بالمرح",
          examples: [{ label: "مثال" }],
        },
      },
    });
    expect(result[0]).not.toHaveProperty("answer");
    expect(result[0]).not.toHaveProperty("privateTeacherNotes");
    expect(JSON.stringify(result)).not.toMatch(/isCorrect|correct_answer|correctAnswer|solution|answerKey|privateTeacherNotes/);
    // Rendering projection must not mutate the trusted grading source row.
    expect(row.content.options[0]).toHaveProperty("isCorrect", true);
    expect(row).toHaveProperty("answer");
  });

  it("normalizes spelling variants of protected nested grading keys", () => {
    const row = fixtureActivity();
    row.content = {
      question: "ما الصحيح؟",
      option: {
        "IS-CORRECT": true,
        "correct_answer": "private",
        "ANSWER_KEY": "private",
        "Expected Answer": "private",
        "marking-key": "private",
        "rightAnswer": "private",
        label: "اختيار مرئي",
      },
    } as typeof row.content;
    expect(publicLessonActivities([row])[0].content).toEqual({
      question: "ما الصحيح؟",
      option: { label: "اختيار مرئي" },
    });
  });

  it("drops untrusted top-level fields and malformed rows", () => {
    expect(publicLessonActivities(null)).toEqual([]);
    expect(publicLessonActivities([null, { id: "missing" }, fixtureActivity()]))
      .toHaveLength(1);
    const stripped = publicLessonActivities([{
      ...fixtureActivity(), gradingInternal: "secret",
      selected_answer: "b", correctAnswer: "a",
    }]);
    expect(stripped[0]).not.toHaveProperty("gradingInternal");
    expect(stripped[0]).not.toHaveProperty("selected_answer");
  });

  it("preserves draft activity section from content when not a DB column", () => {
    const row = fixtureActivity();
    const withoutSection = { ...row, section: undefined, content: { section: "الكتابة", text: "كوّن جملة" } };
    expect(publicLessonActivities([withoutSection])[0].section).toBe("الكتابة");
  });

  it("returns student-safe activities in the real anonymous published bundle", async () => {
    const rpc = vi.fn(async () => ({ data: bundle(null), error: null }));
    createClient.mockResolvedValue({ rpc });
    const actual = await getLessonPageBundle("lesson-1");
    expect(actual?.activities).toHaveLength(1);
    expect(actual?.activities[0].content).toMatchObject({
      text: "أي حرف صحيح؟",
      options: [{ id: "a", text: "الألف" }, { id: "b", text: "الباء" }],
    });
    expect(JSON.stringify(actual?.activities)).not.toContain("isCorrect");
    expect(JSON.stringify(actual?.activities)).not.toContain("correct_answer");
    expect(JSON.stringify(actual?.activities)).not.toContain("privateTeacherNotes");
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith("get_lesson_page_bundle", { p_lesson_id: "lesson-1" });
  });

  it("preserves signed-in attempt retrieval while projecting published activities", async () => {
    const from = vi.fn((table: string) => {
      expect(table).toBe("lesson_activity_attempts");
      const q = {
        select: vi.fn(() => q),
        eq: vi.fn(() => q),
        in: vi.fn(async () => ({
          data: [{ activity_id: "activity-1", is_correct: true, attempt_number: 1 }],
          error: null,
        })),
      };
      return q;
    });
    createClient.mockResolvedValue({
      rpc: vi.fn(async () => ({ data: bundle({ id: "student-1" }), error: null })),
      from,
    });
    const actual = await getLessonPageBundle("lesson-1");
    expect(actual?.activityAttempts).toEqual([
      { activity_id: "activity-1", is_correct: true, attempt_number: 1 },
    ]);
    expect(actual?.activities[0].content.options).toEqual([
      { id: "a", text: "الألف", score: 10 },
      { id: "b", text: "الباء" },
    ]);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("sanitizes the Bahrain draft serializer as well as published RPC payloads", () => {
    const source = readFileSync(resolve(process.cwd(),
      "features/lessons/queries/getLessonPageBundle.ts"), "utf8");
    expect(source).toContain("const safeActivities = publicLessonActivities(bundle.activities)");
    expect(source).toContain("publicLessonActivities(activitiesResult.data)");
    expect(source).toContain("activities: safeActivities");
    expect(source).toContain("    activities,");
  });
});
