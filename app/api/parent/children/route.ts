import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function GET() {
  const access = await requireRole(["PARENT"]);
  if (!access.ok) {
    return NextResponse.json(
      { error: access.reason },
      { status: access.reason === "unauthenticated" ? 401 : access.reason === "unavailable" ? 503 : 403 },
    );
  }

  const supabase = await createClient();
  const { data: links, error } = await supabase
    .from("parent_students")
    .select("student_id, relationship")
    .eq("parent_id", access.userId)
    .eq("is_active", true);
  if (error) return NextResponse.json({ error: "Unable to load children" }, { status: 503 });

  const ids = [...new Set((links ?? []).map((link) => link.student_id))];
  if (!ids.length) return NextResponse.json({ children: [] });

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, grade_number")
    .in("id", ids);
  if (profileError) return NextResponse.json({ error: "Unable to load children" }, { status: 503 });

  // RLS may hide linked profiles. Never present a partial roster as complete.
  if ((profiles ?? []).length !== ids.length) {
    return NextResponse.json({ error: "Linked profile access is incomplete" }, { status: 503 });
  }

  return NextResponse.json({
    children: (profiles ?? []).map((profile) => ({
      id: profile.id,
      name: profile.full_name,
      grade: profile.grade_number,
    })),
  });
}
