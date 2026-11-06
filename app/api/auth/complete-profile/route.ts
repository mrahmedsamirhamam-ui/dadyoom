import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCountryCode } from "@/lib/countries";
import { destinationForStoredRole, isSelfSignupRole } from "@/lib/auth/role-destination.mjs";
import { ensurePendingRoleRequest, isApprovalRequired } from "@/lib/auth/pending-role-request";


export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return NextResponse.json({ error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("role,country,full_name")
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

  // Pending status is informational. Only verified profiles.role grants rights.
  // This table is created by the reviewed (NOT YET DEPLOYED) SQL proposal.
  const originalRole = typeof existing?.role === "string"
    ? existing.role.trim().toLowerCase() : "";
  const { data: application, error: applicationError } = originalRole === "student"
    ? await supabase.from("profile_role_requests")
      .select("requested_role,status")
      .eq("user_id", user.id)
      .maybeSingle()
    : { data: null, error: null };
  if (applicationError) {
    return NextResponse.json(
      { error: "تعذر مراجعة حالة طلب الحساب." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (destinationForStoredRole(existing?.role) !== "/onboarding" &&
      existing?.country?.trim() && existing?.full_name?.trim()) {
    const role = existing.role.trim().toLowerCase();
    if (application && isApprovalRequired(application.requested_role)) {
      return NextResponse.json({ ok: true, pendingApproval: true, destination: "/account/role-status" });
    }
    return NextResponse.json({ ok: true, destination: destinationForStoredRole(role) });
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
  const matchesPendingApplication =
    existingRole === "student" && isApprovalRequired(role) &&
    application?.requested_role === role;
  if (existingRole && existingRole !== role && !matchesPendingApplication) {
    return NextResponse.json(
      { error: "هذا الحساب مسجل بدور مختلف. لا يمكن تغيير الصلاحيات من صفحة التسجيل." },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }
  const admin = createAdminClient();
  const initialRole = isApprovalRequired(role) ? "student" : role;
  const { error: insertError } = existingRole
    ? await admin.from("profiles")
      .update({ email: user.email, full_name: fullName, country })
      .eq("id", user.id)
    // INSERT is intentional: an UPSERT could overwrite a concurrently
    // created profile role with an unverified value from the request body.
    : await admin.from("profiles").insert(
      { id: user.id, email: user.email, full_name: fullName, role: initialRole, country },
    );

  if (insertError) {
    const { data: racedProfile, error: raceError } = await supabase
      .from("profiles")
      .select("role,country,full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (raceError || !racedProfile?.role || !racedProfile?.country || !racedProfile?.full_name?.trim()) {
      console.error("PROFILE_COMPLETION_ERROR:", insertError.message);
      return NextResponse.json({ error: "تعذر إكمال ملف الحساب." }, { status: 500 });
    }

    const racedRole = racedProfile.role.trim().toLowerCase();
    if (racedRole === "student" && isApprovalRequired(role)) {
      const pending = await ensurePendingRoleRequest(admin, user.id, role);
      if (!pending.ok) return NextResponse.json({ error: "تعذر تسجيل طلب اعتماد الحساب." }, { status: 503 });
      return NextResponse.json({ ok: true, pendingApproval: true, destination: "/account/role-status" });
    }
    return NextResponse.json({ ok: true, destination: destinationForStoredRole(racedRole) });
  }

  if (matchesPendingApplication || (!existingRole && isApprovalRequired(role))) {
    if (isApprovalRequired(role)) {
      const pending = await ensurePendingRoleRequest(admin, user.id, role);
      if (!pending.ok) {
        return NextResponse.json({ error: "تعذر تسجيل طلب اعتماد الحساب." }, { status: 503 });
      }
    }
    return NextResponse.json({ ok: true, pendingApproval: true, destination: "/account/role-status" });
  }
  return NextResponse.json({ ok: true, destination: destinationForStoredRole(existingRole || initialRole) });
}
