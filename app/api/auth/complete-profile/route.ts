import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCountryCode } from "@/lib/countries";
import { checkOnboardingRole } from "@/lib/auth/profile-role-policy.mjs";

const destinations: Record<string, string> = {
  student: "/student",
  child: "/child",
  teacher: "/teacher",
  parent: "/parent",
  school: "/school",
  admin: "/admin",
};
const headers = { "Cache-Control": "no-store" };
const respond = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });

type CompletionBody = { fullName?: unknown; role?: unknown; country?: unknown };

export async function POST(request: Request) {
  const session = await createClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user?.email) return respond({ error: "يجب تسجيل الدخول أولًا." }, 401);

  // Fail closed: a read error is NOT evidence of a missing account.
  const { data: existing, error: readError } = await session.from("profiles")
    .select("role,country,full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (readError) return respond({ error: "تعذر التحقق من صلاحيات الحساب." }, 503);

  let body: CompletionBody;
  try {
    const raw: unknown = await request.json();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("bad body");
    body = raw as CompletionBody;
  } catch {
    return respond({ error: "بيانات الحساب غير صالحة." }, 400);
  }

  const roleRequest = checkOnboardingRole({
    storedRole: existing?.role,
    requestedRole: body.role,
  });
  if (!roleRequest.ok) {
    if (roleRequest.code === "ROLE_CHANGE_FORBIDDEN") {
      return respond({ error: "لا يمكن تغيير نوع حساب قائم من صفحة التسجيل." }, 403);
    }
    return respond({ error: "هذا النوع من الحسابات يحتاج موافقة مسؤول موثقة قبل التفعيل." }, 403);
  }

  if (existing?.role && existing?.country && existing?.full_name?.trim()) {
    return respond({ ok: true, destination: destinations[roleRequest.role] });
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
  const country = typeof body.country === "string" ? body.country.trim().toUpperCase() : "";
  if (!fullName) return respond({ error: "أدخل اسمك الكامل." }, 400);
  if (!isCountryCode(country)) return respond({ error: "اختر دولة صحيحة." }, 400);

  const admin = createAdminClient();
  if (roleRequest.existing) {
    // Privileged service credentials are NEVER used to set role or email.
    const { data: saved, error: updateError } = await admin.from("profiles")
      .update({ full_name: fullName, country })
      .eq("id", user.id)
      .eq("role", roleRequest.role)
      .select("role")
      .maybeSingle();
    if (updateError || !saved || saved.role !== roleRequest.role) {
      return respond({ error: "تعذر استكمال الملف؛ أعد تحميل الصفحة وحاول مرة أخرى." }, 409);
    }
    return respond({ ok: true, destination: destinations[roleRequest.role] });
  }

  // Insert-only: never UPSERT, which can overwrite a concurrently created role.
  const { error: insertError } = await admin.from("profiles").insert({
    id: user.id,
    email: user.email,
    full_name: fullName,
    country,
    role: roleRequest.role,
  });
  if (insertError) {
    // Concurrent signup: never overwrite a row created by another operation.
    const { data: raced, error: raceError } = await session.from("profiles")
      .select("role,country,full_name")
      .eq("id", user.id)
      .maybeSingle();
    if (!raceError && raced?.role === roleRequest.role && raced.country && raced.full_name?.trim()) {
      return respond({ ok: true, destination: destinations[roleRequest.role] });
    }
    return respond({ error: "تعذر إنشاء الحساب دون تغيير صلاحياته؛ راجع إدارة الحسابات." }, 409);
  }

  return respond({ ok: true, destination: destinations[roleRequest.role] });
}
