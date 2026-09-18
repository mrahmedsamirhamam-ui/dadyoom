import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCountryCode } from "@/lib/countries";

const allowedRoles = new Set(["student", "child", "teacher", "parent", "school"]);
const destinations: Record<string, string> = {
  student: "/student",
  child: "/child",
  teacher: "/teacher",
  parent: "/parent",
  school: "/school",
  admin: "/admin",
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("role,country,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.role && existing?.country && existing?.full_name?.trim()) {
    const role = existing.role.trim().toLowerCase();
    return NextResponse.json({ ok: true, destination: destinations[role] || "/student" });
  }

  let body: { fullName?: string; role?: string; country?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "بيانات الحساب غير صالحة." }, { status: 400 });
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
  const role = typeof body.role === "string" ? body.role.trim().toLowerCase() : "student";
  const country = typeof body.country === "string" ? body.country.trim().toUpperCase() : "";

  if (!fullName) return NextResponse.json({ error: "اكتب الاسم الكامل." }, { status: 400 });
  if (!allowedRoles.has(role)) return NextResponse.json({ error: "نوع الحساب غير صالح." }, { status: 400 });
  if (!isCountryCode(country)) return NextResponse.json({ error: "اختر دولة صحيحة." }, { status: 400 });

  const admin = createAdminClient();
  const { error: insertError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: fullName,
      role,
      country,
    },
    {
      onConflict: "id",
    }
  );

  if (insertError) {
    const { data: racedProfile } = await supabase
      .from("profiles")
      .select("role,country,full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (!racedProfile?.role || !racedProfile?.country || !racedProfile?.full_name?.trim()) {
      console.error("PROFILE_COMPLETION_ERROR:", insertError.message);
      return NextResponse.json({ error: "تعذر إكمال ملف الحساب." }, { status: 500 });
    }

    const racedRole = racedProfile.role.trim().toLowerCase();
    return NextResponse.json({ ok: true, destination: destinations[racedRole] || "/student" });
  }

  return NextResponse.json({ ok: true, destination: destinations[role] || "/student" });
}
