import type { SupabaseClient } from "@supabase/supabase-js";

import SchoolRewardsClient from "./SchoolRewardsClient";

import { createClient } from "@/lib/supabase/server";

export default async function SchoolRewardsPage() {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: school } = await db
    .from("schools")
    .select("id,name")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!school) {
    return <main dir="rtl" className="p-8">لا توجد مدرسة مرتبطة بهذا الحساب.</main>;
  }

  const { data: links } = await db
    .from("school_teachers")
    .select("teacher_id")
    .eq("school_id", school.id)
    .eq("is_active", true);

  const teacherIds = (links ?? []).map((item) => String(item.teacher_id));

  const { data: classData } = teacherIds.length
    ? await db
        .from("teacher_classes")
        .select("id,name")
        .in("teacher_id", teacherIds)
        .eq("is_active", true)
    : { data: [] };

  const classes = classData ?? [];
  const classIds = classes.map((item) => String(item.id));

  const { data: memberData } = classIds.length
    ? await db
        .from("teacher_class_students")
        .select("class_id,student_id")
        .in("class_id", classIds)
        .eq("is_active", true)
    : { data: [] };

  const members = memberData ?? [];
  const studentIds = [...new Set(members.map((item) => String(item.student_id)))];

  const { data: profileData } = studentIds.length
    ? await db
        .from("profiles")
        .select("id,full_name,email")
        .in("id", studentIds)
    : { data: [] };

  const byId = new Map(
    (profileData ?? []).map((item) => [String(item.id), item]),
  );

  const students = members.map((item) => {
    const profile = byId.get(String(item.student_id));

    return {
      classId: String(item.class_id),
      id: String(item.student_id),
      name: String(profile?.full_name ?? profile?.email ?? "طالب"),
    };
  });

  return (
    <SchoolRewardsClient
      school={{ id: String(school.id), name: String(school.name) }}
      classes={classes as Array<{ id: string; name: string }>}
      students={students}
    />
  );
}
