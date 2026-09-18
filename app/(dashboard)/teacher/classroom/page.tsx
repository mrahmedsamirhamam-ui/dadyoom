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

  const { data: classesData } = await db
    .from("teacher_classes")
    .select("id,name,academic_year")
    .eq("teacher_id", user.id)
    .eq("is_active", true)
    .order("created_at");

  const classes = classesData ?? [];
  const classIds = classes.map((item) => String(item.id));

  const { data: membershipData } = classIds.length
    ? await db
        .from("teacher_class_students")
        .select("class_id,student_id")
        .in("class_id", classIds)
        .eq("is_active", true)
    : { data: [] };

  const memberships = membershipData ?? [];
  const studentIds = [
    ...new Set(memberships.map((item) => String(item.student_id))),
  ];

  const { data: profileData } = studentIds.length
    ? await db
        .from("profiles")
        .select("id,full_name,email")
        .in("id", studentIds)
    : { data: [] };

  const profileById = new Map(
    (profileData ?? []).map((item) => [String(item.id), item]),
  );

  const students = memberships.map((item) => {
    const profile = profileById.get(String(item.student_id));

    return {
      classId: String(item.class_id),
      id: String(item.student_id),
      name: String(profile?.full_name ?? profile?.email ?? "طالب"),
    };
  });

  const { data: lessonsData } = await db
    .from("lessons")
    .select("id,title")
    .eq("status", "published")
    .order("lesson_number")
    .limit(300);

  const { data: conversationData } = await db
    .from("edu_conversations")
    .select("id,class_id,student_id")
    .eq("teacher_id", user.id);

  const conversations = conversationData ?? [];
  const conversationIds = conversations.map((item) => String(item.id));

  const { data: messageData } = conversationIds.length
    ? await db
        .from("edu_messages")
        .select("id,conversation_id,sender_id,body,created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false })
        .limit(100)
    : { data: [] };

  const { data: assignmentData } = await db
    .from("edu_assignments")
    .select("id,class_id,title,kind,target_mode,status,due_at,created_at")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: rewardData } = await db
    .from("edu_rewards")
    .select("id,student_id,title,points,icon,created_at")
    .eq("issuer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <TeacherClassroomClient
      teacherId={user.id}
      classes={classes as Array<{ id: string; name: string; academic_year: string | null }>}
      students={students}
      lessons={(lessonsData ?? []) as Array<{ id: string; title: string }>}
      conversations={conversations as Array<{ id: string; class_id: string; student_id: string }>}
      messages={(messageData ?? []) as Array<{
        id: string;
        conversation_id: string;
        sender_id: string;
        body: string;
        created_at: string;
      }>}
      assignments={(assignmentData ?? []) as Array<{
        id: string;
        class_id: string;
        title: string;
        kind: string;
        target_mode: string;
        status: string;
        due_at: string | null;
        created_at: string;
      }>}
      rewards={(rewardData ?? []) as Array<{
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
