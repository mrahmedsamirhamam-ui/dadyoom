import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudentAssignmentCandidate } from "./student-next-step";

/**
 * Query with the signed-in student's Supabase client, NEVER a service-role
 * client. edu_assignment_visible_to_student() in the database RLS restricts
 * published assignments to active class members and explicit student targets.
 */
export async function getPendingStudentAssignments(
  db: SupabaseClient,
  studentId: string,
  classIds: string[],
): Promise<{
  assignments: StudentAssignmentCandidate[];
  submittedAssignmentIds: ReadonlySet<string>;
}> {
  const uniqueClassIds = [...new Set(classIds.filter(Boolean))];
  if (!uniqueClassIds.length) {
    return { assignments: [], submittedAssignmentIds: new Set<string>() };
  }

  const { data, error } = await db
    .from("edu_assignments")
    .select("id,class_id,title,due_at,created_at")
    .in("class_id", uniqueClassIds)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const assignments = (data ?? []) as StudentAssignmentCandidate[];
  if (!assignments.length) {
    return { assignments: [], submittedAssignmentIds: new Set<string>() };
  }

  const { data: submissions, error: submissionError } = await db
    .from("edu_assignment_submissions")
    .select("assignment_id,status,submitted_at")
    .eq("student_id", studentId)
    .in("assignment_id", assignments.map((item) => item.id));

  if (submissionError) throw submissionError;

  const submittedAssignmentIds = new Set(
    (submissions ?? [])
      .filter((row) =>
        row.status === "submitted" ||
        row.status === "graded" ||
        Boolean(row.submitted_at),
      )
      .map((row) => String(row.assignment_id)),
  );

  return { assignments, submittedAssignmentIds };
}
