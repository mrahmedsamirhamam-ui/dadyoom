import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCountryCode } from "@/lib/countries";

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

  let body: { fullName?: string; role?: unknown; country?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "بيانات الحساب غير صالحة." }, { status: 400 });
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
  // A public profile-completion request must never assign authorization roles.
  // Role changes require a separately authorized administrator workflow.
  const role = "student";
  const country = typeof body.country === "string" ? body.country.trim().toUpperCase() : "";

  if (!fullName) return NextResponse.json({ error: "اكتب الاسم الكامل." }, { status: 400 });
  if (!isCountryCode(country)) return NextResponse.json({ error: "اختر دولة صحيحة." }, { status: 400 });

  // Do not overwrite any existing role, including a partially completed profile.
  // The administrator must repair such profiles through an audited privileged path.
  if (existing) {
    return NextResponse.json({ error: "يتطلب إكمال هذا الملف مراجعة إدارية آمنة." }, { status: 409 });
  }

  const admin = createAdminClient();
  const { error: insertError } = await admin.from("profiles").insert(
    {
      id: user.id,
      email: user.email,
      full_name: fullName,
      role,
      country,
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
