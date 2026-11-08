import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCountryCode } from "@/lib/countries";

const allowedSelfSignupRoles = new Set(["student", "child", "parent"]);
const destinations: Record<string, string> = {
  student: "/student", child: "/child", teacher: "/teacher",
  parent: "/parent", school: "/school", admin: "/admin",
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || !user.email) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const { data: existing, error: lookupError } = await supabase
    .from("profiles").select("role,country,full_name").eq("id", user.id).maybeSingle();
  if (lookupError) {
    return NextResponse.json({ error: "تعذر التحقق من صلاحيات الحساب." }, { status: 503 });
  }
  if (existing?.role && existing?.country && existing?.full_name?.trim()) {
    const storedRole = existing.role.trim().toLowerCase();
    return NextResponse.json({ ok: true, destination: destinations[storedRole] || "/student" });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "بيانات الحساب غير صالحة." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "بيانات الحساب غير صالحة." }, { status: 400 });
  }
  const data = body as Record<string, unknown>;
  const fullName = typeof data.fullName === "string" ? data.fullName.trim().slice(0, 120) : "";
  const role = typeof data.role === "string" ? data.role.trim().toLowerCase() : "student";
  const country = typeof data.country === "string" ? data.country.trim().toUpperCase() : "";
  if (!fullName) return NextResponse.json({ error: "اكتب الاسم الكامل." }, { status: 400 });
  if (!isCountryCode(country)) return NextResponse.json({ error: "اختر دولة صحيحة." }, { status: 400 });

  // A requested teacher/school role is NEVER proof of entitlement.
  // Do not create a privileged profile through the service-role client.
  if (!allowedSelfSignupRoles.has(role)) {
    return NextResponse.json(
      { error: "صلاحيات المعلم والمدرسة تتطلب اعتمادًا إداريًا منفصلًا." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  const storedRole = typeof existing?.role === "string" ? existing.role.trim().toLowerCase() : "";
  if (storedRole && storedRole !== role) {
    return NextResponse.json(
      { error: "لا يمكن تغيير نوع الحساب من صفحة إكمال البيانات." },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  const admin = createAdminClient();
  // Existing profiles: update only non-authorization fields. New profiles:
  // INSERT, never UPSERT, to prevent a race overwriting a verified role.
  const { error: writeError } = storedRole
    ? await admin.from("profiles").update({ full_name: fullName, country })
      .eq("id", user.id).eq("role", storedRole)
    : await admin.from("profiles").insert({
      id: user.id, email: user.email, full_name: fullName, role, country,
    });
  if (writeError) {
    const { data: racedProfile, error: racedError } = await supabase
      .from("profiles").select("role,country,full_name").eq("id", user.id).maybeSingle();
    if (racedError || !racedProfile?.role || !racedProfile?.country || !racedProfile?.full_name?.trim()) {
      return NextResponse.json({ error: "تعذر إكمال ملف الحساب." }, { status: 503 });
    }
    const racedRole = racedProfile.role.trim().toLowerCase();
    // Never report a successful role change based on a racing insert.
    return NextResponse.json({ ok: true, destination: destinations[racedRole] || "/student" });
  }
  return NextResponse.json({ ok: true, destination: destinations[storedRole || role] || "/student" });
}
