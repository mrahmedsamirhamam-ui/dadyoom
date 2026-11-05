import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCountryCode } from "@/lib/countries";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const db = await createClient();
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "يجب الدخول أولًا." }, { status: 401 });
  const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["student", "child", "admin"].includes(profile.role?.trim().toLowerCase() || ""))
    return NextResponse.json({ error: "هذه الإعدادات لحساب الطالب فقط." }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "البيانات غير صالحة." }, { status: 400 }); }

  const country = typeof body.country === "string" ? body.country.trim().toUpperCase() : "";
  const grade = Number(body.grade);
  const track = body.track;
  const mode = body.mode;
  if (!isCountryCode(country) || !Number.isInteger(grade) || grade < 1 || grade > 13 ||
      !["native", "non_native"].includes(String(track)) ||
      !["ministry", "dadyoom"].includes(String(mode))) {
    return NextResponse.json({ error: "اختر الدولة والصف ومسار التعلم بصورة صحيحة." }, { status: 400 });
  }

  // Educational preferences are NOT authorization claims. Never use user_metadata for RLS.
  const admin = createAdminClient();
  const { error: updateError } = await admin.from("profiles").update({
    country, grade_number: grade,
  }).eq("id", user.id);
  if (updateError) {
    console.error("STUDENT_PREFERENCE_PROFILE_FAILED", updateError.message);
    return NextResponse.json({ error: "تعذر حفظ الصف والدولة." }, { status: 500 });
  }

  const { error: metadataError } = await db.auth.updateUser({
    data: { dadyoom_learning_preferences: { track, mode, saved_at: new Date().toISOString() } },
  });
  if (metadataError) {
    console.error("STUDENT_PREFERENCE_AUTH_METADATA_FAILED", metadataError.message);
    return NextResponse.json({ error: "تم حفظ الصف لكن تعذر حفظ المسار؛ حاول مرة أخرى." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, destination: "/student" },
    { headers: { "Cache-Control": "no-store" } });
}
