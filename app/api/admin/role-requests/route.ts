import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** The existing admin must explicitly verify every new teacher/school. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const refuse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).origin !== new URL(request.url).origin) {
      return refuse("غير مسموح بهذا الطلب.", 403);
    }
  } catch {
    return refuse("أصل الطلب غير صالح.", 403);
  }
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) {
    return refuse("صيغة الطلب غير مدعومة.", 415);
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return refuse("يرجى تسجيل الدخول.", 401);
  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") return refuse("غير مصرح لك.", 403);

  const raw = await request.text();
  if (raw.length > 1024) return refuse("طلب كبير جدًا.", 413);
  const form = new URLSearchParams(raw);
  const userId = form.get("userId") ?? "";
  const requestedRole = form.get("requestedRole");
  if (form.get("decision") !== "approve" || !["teacher", "school"].includes(requestedRole ?? "") ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId) ||
      user.id === userId) {
    return refuse("طلب الاعتماد غير صالح.", 400);
  }

  // Only a current pending student request can be promoted. A forged/old
  // request cannot edit a third party's already trusted role or identity.
  const { data: updated, error: updateError } = await createAdminClient()
    .from("profiles")
    .update({
      role: requestedRole,
      requested_role: null,
      requested_role_at: null,
      role_approved_by: user.id,
      role_approved_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("role", "student")
    .eq("requested_role", requestedRole)
    .select("id")
    .maybeSingle();

  if (updateError || !updated) return refuse("تعذر اعتماد الطلب أو تغيّرت حالته.", 409);
  return NextResponse.redirect(new URL("/admin/role-requests?approved=1", request.url), 303);
}
