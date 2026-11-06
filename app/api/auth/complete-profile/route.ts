import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCountryCode } from "@/lib/countries";
import { destinationForStoredRole, isSelfSignupRole } from "@/lib/auth/role-destination.mjs";


export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("role,country,full_name,requested_role")
    .eq("id", user.id)
    .maybeSingle();

  // Fail closed: a failed RLS/profile lookup must never lead to a privileged
  // insert/upsert that could overwrite a previously authorised role.
  if (existingError) {
    return NextResponse.json(
      { error: "تعذر التحقق من ملف الحساب. حاول مرة أخرى." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (destinationForStoredRole(existing?.role) !== "/onboarding" &&
      existing?.country?.trim() && existing?.full_name?.trim()) {
    const role = existing.role.trim().toLowerCase();
    return NextResponse.json({ ok: true, destination: role === "student" && ["teacher","school"].includes(existing?.requested_role ?? "") ? "/account/role-request" : destinationForStoredRole(role) });
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
  const existingRole = typeof existing?.role === "string"
    ? existing.role.trim().toLowerCase() : "";
  // Existing admin can complete missing name/country; a new account can never
  // select admin from a user-supplied payload.
  if (!isSelfSignupRole(role) && !(existingRole === "admin" && role === "admin")) {
    return NextResponse.json({ error: "نوع الحساب غير صالح." }, { status: 400 });
  }
  if (!isCountryCode(country)) return NextResponse.json({ error: "اختر دولة صحيحة." }, { status: 400 });

  // A pre-existing role is authoritative, even for an incomplete profile.
  // No self-service role changes, including student -> teacher or school.
  const isPendingRoleRequest = existingRole === "student" &&
    ["teacher", "school"].includes(existing?.requested_role ?? "") &&
    existing?.requested_role === role;
  if (existingRole && existingRole !== role && !isPendingRoleRequest) {
    return NextResponse.json(
      { error: "هذا الحساب مسجل بدور مختلف. لا يمكن تغيير الصلاحيات من صفحة التسجيل." },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }
  const admin = createAdminClient();
  const { error: insertError } = existingRole
    ? await admin.from("profiles")
      .update({ email: user.email, full_name: fullName, country })
      .eq("id", user.id)
    // INSERT is intentional: an UPSERT could overwrite a concurrently
    // created profile role with an unverified value from the request body.
    : await admin.from("profiles").insert(
      {
        id: user.id, email: user.email, full_name: fullName, country,
        // Requests from the client are NEVER trusted teacher/school privileges.
        role: ["teacher","school"].includes(role) ? "student" : role,
        requested_role: ["teacher","school"].includes(role) ? role : null,
        requested_role_at: ["teacher","school"].includes(role) ? new Date().toISOString() : null,
      },
    );

  if (insertError) {
    const { data: racedProfile, error: raceError } = await supabase
      .from("profiles")
      .select("role,country,full_name,requested_role")
      .eq("id", user.id)
      .maybeSingle();

    if (raceError || !racedProfile?.role || !racedProfile?.country || !racedProfile?.full_name?.trim()) {
      console.error("PROFILE_COMPLETION_ERROR:", insertError.message);
      return NextResponse.json({ error: "تعذر إكمال ملف الحساب." }, { status: 500 });
    }

    const racedRole = racedProfile.role.trim().toLowerCase();
    return NextResponse.json({ ok: true, destination: racedRole === "student" && ["teacher","school"].includes(racedProfile.requested_role ?? "") ? "/account/role-request" : destinationForStoredRole(racedRole) });
  }

  return NextResponse.json({
    ok: true,
    destination: isPendingRoleRequest || (!existingRole && ["teacher","school"].includes(role))
      ? "/account/role-request"
      : destinationForStoredRole(existingRole || role),
  });
}
