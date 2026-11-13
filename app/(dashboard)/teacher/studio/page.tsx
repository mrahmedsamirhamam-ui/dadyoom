import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeacherStudio from "@/features/teacher-studio/TeacherStudio";

export const dynamic = "force-dynamic";

export default async function TeacherStudioPage() {
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role?.trim().toLowerCase() ?? "";
  if (profileError || (role !== "teacher" && role !== "admin")) {
    redirect("/student");
  }
  return <TeacherStudio />;
}
