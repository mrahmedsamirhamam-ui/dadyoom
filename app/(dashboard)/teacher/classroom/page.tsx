import type { SupabaseClient } from "@supabase/supabase-js";

import TeacherClassroomClient from "./TeacherClassroomClient";

import { createClient } from "@/lib/supabase/server";

export default async function TeacherClassroomPage() {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [
    classesResult,
    lessonsResult,
    conversationResult,
    assignmentResult,
    rewardResult,
  ] = await Promise.all([
    db
      .from("teacher_classes")
      .select("id,name,academic_year")
      .eq("teacher_id", user.id)
      .eq("is_active", true)
      .order("created_at")
      .limit(50),

    db
      .from("lessons")
      .select("id,title")
      .eq("status", "published")
      .order("lesson_number")
      .limit(120),

    db
      .from("edu_conversations")
      .select("id,class_id,student_id")
      .eq("teacher_id", user.id)
      .limit(100),

    db
      .from("edu_assignments")
      .select("id,class_id,title,kind,target_mode,status,due_at,created_at")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),

    db
      .from("edu_rewards")
      .select("id,student_id,title,points,icon,created_at")
      .eq("issuer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const classes = classesResult.data ?? [];
  const classIds = classes.map((item) => String(item.id));

  const { data: membershipData } = classIds.length
    ? await db
        .from("teacher_class_students")
        .select("class_id,student_id")
        .in("class_id", classIds)
        .eq("is_active", true)
        .limit(1000)
    : { data: [] };

  const memberships = membershipData ?? [];
  const studentIds = [
    ...new Set(memberships.map((item) => String(item.student_id))),
  ];

  const conversations = conversationResult.data ?? [];
  const conversationIds = conversations.map((item) => String(item.id));

  const [profileResult, messageResult] = await Promise.all([
    studentIds.length
      ? db
          .from("profiles")
          .select("id,full_name,email")
          .in("id", studentIds)
      : Promise.resolve({ data: [] }),
    conversationIds.length
      ? db
          .from("edu_messages")
          .select("id,conversation_id,sender_id,body,created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
  ]);

  const profileById = new Map(
    (profileResult.data ?? []).map((item) => [String(item.id), item]),
  );

  const students = memberships.map((item) => {
    const profile = profileById.get(String(item.student_id));

    return {
      classId: String(item.class_id),
      id: String(item.student_id),
      name: String(profile?.full_name ?? profile?.email ?? "طالب"),
    };
  });

  return (
    <TeacherClassroomClient
      teacherId={user.id}
      classes={classes as Array<{ id: string; name: string; academic_year: string | null }>}
      students={students}
      lessons={(lessonsResult.data ?? []) as Array<{ id: string; title: string }>}
      conversations={conversations as Array<{ id: string; class_id: string; student_id: string }>}
      messages={(messageResult.data ?? []) as Array<{
        id: string;
        conversation_id: string;
        sender_id: string;
        body: string;
        created_at: string;
      }>}
      assignments={(assignmentResult.data ?? []) as Array<{
        id: string;
        class_id: string;
        title: string;
        kind: string;
        target_mode: string;
        status: string;
        due_at: string | null;
        created_at: string;
      }>}
      rewards={(rewardResult.data ?? []) as Array<{
        id: string;
        student_id: string;
        title: string;
        points: number;
        icon: string;
        created_at: string;
      }>}
    />
  );
}
