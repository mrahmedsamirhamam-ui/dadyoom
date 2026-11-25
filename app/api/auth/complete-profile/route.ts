import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCountryCode } from "@/lib/countries";
import {
  isKnownRole,
  isSelfSignupRole,
  normalizeRole,
} from "@/lib/auth/role-policy";
import {
  isOnboardingRpcEnabled,
  ONBOARDING_COMPLETE_RPC,
} from "@/lib/auth/onboarding-activation";

const destinations: Record<string, string> = {
  student: "/student",
  child: "/child",
  teacher: "/teacher",
  parent: "/parent",
  school: "/school",
  admin: "/admin",
};

function destinationFor(role: string) {
  return destinations[role] || "/student";
}

export async function POST(request: Request) {
  // RLS-scoped client: the identity and the stored role come from the session,
  // never from the request body, OAuth metadata, or user-controlled metadata.
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    return NextResponse.json(
      { error: "يجب تسجيل الدخول أولًا." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data: existing, error: lookupError } = await supabase
    .from("profiles")
    .select("role,country,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(
      { error: "تعذر التحقق من صلاحيات الحساب." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const storedRole = normalizeRole(existing?.role);
  const rpcEnabled = isOnboardingRpcEnabled();
  const profileIsComplete = Boolean(
    existing?.country?.trim() && existing?.full_name?.trim(),
  );
  const incompleteBaseline =
    storedRole === "student" && !profileIsComplete;
  // A completed profile is authoritative even when the RPC is active. Only a
  // trigger-created baseline with no completed fields may consume the token.
  if (storedRole && profileIsComplete) {
    return NextResponse.json({
      ok: true,
      destination: destinationFor(storedRole),
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "بيانات الحساب غير صالحة." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "بيانات الحساب غير صالحة." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const data = body as Record<string, unknown>;
  const fullName = typeof data.fullName === "string" ? data.fullName.trim().slice(0, 120) : "";
  const requestedRole = normalizeRole(data.role ?? "student");
  const country = typeof data.country === "string" ? data.country.trim().toUpperCase() : "";

  if (!fullName) return NextResponse.json({ error: "اكتب الاسم الكامل." }, { status: 400 });
  if (!isKnownRole(requestedRole)) return NextResponse.json({ error: "نوع الحساب غير صالح." }, { status: 400 });
  if (!isCountryCode(country)) return NextResponse.json({ error: "اختر دولة صحيحة." }, { status: 400 });

  // Explicit permission, not a numeric hierarchy: only these roles may be
  // selected by the account owner. A stored privileged role may be preserved
  // for an incomplete legacy profile, but never granted from this request.
  if (!isSelfSignupRole(requestedRole) && requestedRole !== storedRole) {
    return NextResponse.json(
      { error: "صلاحيات المعلم والمدرسة تتطلب اعتمادًا إداريًا منفصلًا." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  const baselineTransition =
    rpcEnabled && incompleteBaseline && isSelfSignupRole(requestedRole);

  if (storedRole && storedRole !== requestedRole && !baselineTransition) {
    return NextResponse.json(
      { error: "لا يمكن تغيير نوع الحساب من صفحة إكمال البيانات." },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Activated path: the database RPC verifies auth.uid(), consumes the
  // trigger-issued one-time token, and enforces the role allowlist. The
  // USER-scoped client is required so PostgREST supplies a genuine JWT.
  if (rpcEnabled) {
    if (!storedRole) {
      return NextResponse.json(
        { error: "لم يتم تهيئة ملف الحساب. حاول مرة أخرى." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (!baselineTransition && storedRole !== requestedRole) {
      return NextResponse.json(
        { error: "لا يمكن تغيير نوع الحساب من صفحة إكمال البيانات." },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    const { data: rpcRole, error: rpcError } = await supabase.rpc(
      ONBOARDING_COMPLETE_RPC,
      {
        p_full_name: fullName,
        p_country: country,
        p_role: requestedRole,
      },
    );

    if (rpcError || normalizeRole(rpcRole) !== requestedRole) {
      console.error(
        "PROFILE_ONBOARDING_RPC_ERROR:",
        rpcError?.message ?? "role verification failed",
      );
      return NextResponse.json(
        {
          error: rpcError?.code === "42883" || rpcError?.code === "PGRST202"
            ? "إكمال الحساب غير مفعّل في قاعدة البيانات."
            : "تعذر إكمال ملف الحساب بأمان. حاول مرة أخرى.",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({
      ok: true,
      destination: destinationFor(requestedRole),
    });
  }

  const roleToWrite = storedRole || requestedRole;
  // The admin client is created only after authentication and authorization.
  const admin = createAdminClient();

  // Existing profile: update only non-authorization fields, guarded by the
  // stored role. New profile: INSERT only — an UPSERT could overwrite a
  // concurrently verified role with a value from this request.
  const { data: written, error: writeError } = storedRole
    ? await admin.from("profiles")
      .update({ full_name: fullName, country })
      .eq("id", user.id)
      .eq("role", storedRole)
      .select("id,role")
      .maybeSingle()
    : await admin.from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        role: roleToWrite,
        country,
      })
      .select("id,role")
      .maybeSingle();

  if (writeError || !written || normalizeRole(written.role) !== roleToWrite) {
    const { data: raced, error: racedError } = await supabase
      .from("profiles")
      .select("role,country,full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (racedError || !raced?.role || !raced?.country?.trim() || !raced?.full_name?.trim()) {
      console.error("PROFILE_COMPLETION_ERROR:", writeError?.message ?? "role verification failed");
      return NextResponse.json(
        { error: "تعذر إكمال ملف الحساب." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const racedRole = normalizeRole(raced.role);
    if (racedRole !== roleToWrite) {
      return NextResponse.json(
        { error: "تغيرت صلاحيات الحساب؛ أعد تسجيل الدخول للتحقق." },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ ok: true, destination: destinationFor(racedRole) });
  }

  return NextResponse.json({ ok: true, destination: destinationFor(roleToWrite) });
}
