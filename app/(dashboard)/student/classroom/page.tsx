import type { SupabaseClient } from "@supabase/supabase-js";

import StudentClassroomClient from "./StudentClassroomClient";

import { createClient } from "@/lib/supabase/server";

export default async function StudentClassroomPage() {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membershipData } = await db
    .from("teacher_class_students")
    .select("class_id")
    .eq("student_id", user.id)
    .eq("is_active", true);

  const classIds = (membershipData ?? []).map((item) =>
    String(item.class_id),
  );

  const { data: classesData } = classIds.length
    ? await db
        .from("teacher_classes")
        .select("id,name,teacher_id,academic_year")
        .in("id", classIds)
        .eq("is_active", true)
    : { data: [] };

  const classes = classesData ?? [];
  const teacherIds = [
    ...new Set(classes.map((item) => String(item.teacher_id))),
  ];

  const { data: teacherData } = teacherIds.length
    ? await db
        .from("profiles")
        .select("id,full_name,email")
        .in("id", teacherIds)
    : { data: [] };

  const { data: conversationData } = await db
    .from("edu_conversations")
    .select("id,class_id,teacher_id")
    .eq("student_id", user.id);

  const conversations = conversationData ?? [];
  const conversationIds = conversations.map((item) => String(item.id));

  const { data: messageData } = conversationIds.length
    ? await db
        .from("edu_messages")
        .select("id,conversation_id,sender_id,body,created_at")
        .in("conversation_id", conversationIds)
        .order("created_at")
        .limit(150)
    : { data: [] };

  const { data: rewardData } = await db
    .from("edu_rewards")
    .select("id,title,description,points,icon,created_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: assignmentData } = classIds.length
    ? await db
        .from("edu_assignments")
        .select(
          "id,class_id,title,instructions,kind,due_at,max_points,created_at",
        )
        .in("class_id", classIds)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] };

  const assignments = assignmentData ?? [];
  const assignmentIds = assignments.map((item) => String(item.id));

  const { data: questionData } = assignmentIds.length
    ? await db
        .from("edu_assignment_questions")
        .select(
          "id,assignment_id,question_order,question_type,prompt,options,points",
        )
        .in("assignment_id", assignmentIds)
        .order("question_order")
    : { data: [] };

  const { data: submissionData } = assignmentIds.length
    ? await db
        .from("edu_assignment_submissions")
        .select(
          "assignment_id,score,max_score,status,submitted_at,teacher_feedback",
        )
        .in("assignment_id", assignmentIds)
        .eq("student_id", user.id)
    : { data: [] };

  return (
    <StudentClassroomClient
      studentId={user.id}
      classes={classes as Array<{
        id: string;
        name: string;
        teacher_id: string;
        academic_year: string | null;
      }>}
      teachers={(teacherData ?? []) as Array<{
        id: string;
        full_name: string;
        email: string;
      }>}
      conversations={conversations as Array<{
        id: string;
        class_id: string;
        teacher_id: string;
      }>}
      messages={(messageData ?? []) as Array<{
        id: string;
        conversation_id: string;
        sender_id: string;
        body: string;
        created_at: string;
      }>}
      rewards={(rewardData ?? []) as Array<{
        id: string;
        title: string;
        description: string | null;
        points: number;
        icon: string;
        created_at: string;
      }>}
      assignments={assignments as Array<{
        id: string;
        class_id: string;
        title: string;
        instructions: string;
        kind: string;
        due_at: string | null;
        max_points: number;
        created_at: string;
      }>}
      questions={(questionData ?? []) as Array<{
        id: string;
        assignment_id: string;
        question_order: number;
        question_type: string;
        prompt: string;
        options: unknown;
        points: number;
      }>}
      submissions={(submissionData ?? []) as Array<{
        assignment_id: string;
        score: number | null;
        max_score: number | null;
        status: string;
        submitted_at: string | null;
        teacher_feedback: string | null;
      }>}
    />
  );
}
