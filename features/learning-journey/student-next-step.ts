/**
 * A single primary next step for the student dashboard.
 * This module has no database, auth, or UI dependencies; authorization must
 * already be applied when the assignment candidates are retrieved.
 */
export type StudentAssignmentCandidate = {
  id: string;
  class_id: string;
  title: string;
  due_at: string | null;
  created_at: string;
};

export type StudentNextStep = {
  kind: "teacher" | "continue" | "recommended" | "explore";
  title: string;
  description: string;
  href: string;
  action: string;
  dueAt?: string | null;
};

export type StudentNextStepInput = {
  assignments: StudentAssignmentCandidate[];
  submittedAssignmentIds: ReadonlySet<string>;
  continueLessonId?: string | null;
  recommendedLessonId?: string | null;
  firstLessonId?: string | null;
};

function dueTime(value: string | null): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

export function selectNextStudentStep({
  assignments,
  submittedAssignmentIds,
  continueLessonId,
  recommendedLessonId,
  firstLessonId,
}: StudentNextStepInput): StudentNextStep {
  const nextAssignment = assignments
    .filter((assignment) => !submittedAssignmentIds.has(assignment.id))
    .sort((left, right) => {
      const dueDifference = dueTime(left.due_at) - dueTime(right.due_at);
      if (!Number.isNaN(dueDifference) && dueDifference !== 0) return dueDifference;
      return right.created_at.localeCompare(left.created_at);
    })[0];

  if (nextAssignment) {
    return {
      kind: "teacher",
      title: nextAssignment.title.trim() || "مهمة من معلمك",
      description: "لديك مهمة منشورة من المعلم لم تُسلّم بعد. ابدأ بها أولًا.",
      href: `/student/classroom?classId=${encodeURIComponent(nextAssignment.class_id)}#assignment-${encodeURIComponent(nextAssignment.id)}`,
      action: "ابدأ واجب المعلم",
      dueAt: nextAssignment.due_at,
    };
  }

  if (continueLessonId) {
    return {
      kind: "continue",
      title: "تابع درسك الحالي",
      description: "ارجع مباشرة إلى الدرس الذي بدأت تعلمه.",
      href: `/lessons/${encodeURIComponent(continueLessonId)}`,
      action: "تابع الدرس",
    };
  }

  if (recommendedLessonId) {
    return {
      kind: "recommended",
      title: "درس مقترح لك",
      description: "ابدأ الدرس المناسب لخطتك التعليمية.",
      href: `/lessons/${encodeURIComponent(recommendedLessonId)}`,
      action: "ابدأ الدرس",
    };
  }

  if (firstLessonId) {
    return {
      kind: "recommended",
      title: "ابدأ أول درس",
      description: "ابدأ التعلم من الدروس المتاحة في مسارك.",
      href: `/lessons/${encodeURIComponent(firstLessonId)}`,
      action: "ابدأ الدرس",
    };
  }

  return {
    kind: "explore",
    title: "اختر مسارك التعليمي",
    description: "لم نحدد درسًا لك بعد. استكشف المسارات المتاحة دون افتراض اكتمال منهج غير موثق.",
    href: "/courses",
    action: "استكشف الدروس",
  };
}
