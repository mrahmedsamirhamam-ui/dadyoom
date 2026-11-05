import { describe, expect, it } from "vitest";
import { selectNextStudentStep, type StudentAssignmentCandidate } from "@/features/learning-journey/student-next-step";

const task = (id: string, due_at: string | null): StudentAssignmentCandidate => ({
  id,
  class_id: "class-a",
  title: `واجب ${id}`,
  due_at,
  created_at: "2026-11-04T10:00:00Z",
});

describe("student's next step", () => {
  it("prioritizes unsubmitted teacher work over a continued lesson", () => {
    const result = selectNextStudentStep({
      assignments: [task("a", "2026-11-06T10:00:00Z")],
      submittedAssignmentIds: new Set(),
      continueLessonId: "lesson-1",
    });
    expect(result.kind).toBe("teacher");
    expect(result.href).toBe("/student/classroom?classId=class-a#assignment-a");
  });

  it("sorts teacher work by soonest due date, leaving undated work last", () => {
    const result = selectNextStudentStep({
      assignments: [task("later", "2026-11-12T10:00:00Z"), task("undated", null), task("soon", "2026-11-06T10:00:00Z")],
      submittedAssignmentIds: new Set(),
    });
    expect(result.href).toContain("#assignment-soon");
  });

  it("does not recommend an already submitted assignment", () => {
    const result = selectNextStudentStep({
      assignments: [task("done", null)],
      submittedAssignmentIds: new Set(["done"]),
      continueLessonId: "lesson-1",
    });
    expect(result.kind).toBe("continue");
    expect(result.href).toBe("/lessons/lesson-1");
  });

  it("uses the recommended lesson then the first lesson, without inventing an assignment", () => {
    expect(selectNextStudentStep({
      assignments: [], submittedAssignmentIds: new Set(), recommendedLessonId: "recommended",
      firstLessonId: "first",
    }).href).toBe("/lessons/recommended");
    expect(selectNextStudentStep({
      assignments: [], submittedAssignmentIds: new Set(), firstLessonId: "first",
    }).href).toBe("/lessons/first");
  });

  it("returns a real destination when the learner has no lessons", () => {
    const result = selectNextStudentStep({
      assignments: [], submittedAssignmentIds: new Set(),
    });
    expect(result.kind).toBe("explore");
    expect(result.href).toBe("/courses");
  });
});
