import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const noStore = { "Cache-Control": "private, no-store" };
type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/iu;

async function context(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return { error: "الحصة غير محددة.", status: 400 } as const;
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return { error: "سجّل دخولك لفتح الحصة.", status: 401 } as const;
  const { data: allowed, error: permissionError } = await db.rpc("edu_can_join_live_session", {
    p_session: id, p_user: user.id,
  });
  if (permissionError || allowed !== true) {
    return { error: "ليس لديك تصريح لهذه الحصة.", status: 403 } as const;
  }
  const { data: meeting, error: sessionError } = await db.from("edu_live_sessions")
    .select("id,title,teacher_id").eq("id", id).maybeSingle();
  if (sessionError || !meeting) return { error: "الحصة غير موجودة.", status: 404 } as const;
  return { db, user, meeting, id } as const;
}
function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status, headers: noStore });
}
export async function GET(request: Request, ctx: Ctx) {
  try {
    const auth = await context(request, ctx);
    if (typeof auth.error === "string" && typeof auth.status === "number") return fail(auth.error, auth.status);
    const { data, error } = await auth.db.from("edu_native_room_messages")
      .select("id,user_id,body,created_at")
      .eq("session_id", auth.id).order("created_at", { ascending: false }).limit(80);
    if (error) {
      console.error("NATIVE_ROOM_READ_FAILED", error.code);
      return fail("تعذر قراءة رسائل الحصة.", 503);
    }
    const messages = (data ?? []).reverse().map(msg => ({
      id: msg.id, text: msg.body, createdAt: msg.created_at,
      isMine: msg.user_id === auth.user.id,
      isTeacher: msg.user_id === auth.meeting.teacher_id,
    }));
    return NextResponse.json({
      ok: true, title: auth.meeting.title, isTeacher: auth.meeting.teacher_id === auth.user.id, messages,
    }, { headers: noStore });
  } catch {
    return fail("تعذر تحميل الغرفة مؤقتًا.", 503);
  }
}
export async function POST(request: Request, ctx: Ctx) {
  if (request.headers.get("x-dadyoom-native-classroom") !== "1") {
    return fail("طلب غير مصرح به.", 403);
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return fail("أصل الطلب غير صحيح.", 403);
  }
  try {
    const auth = await context(request, ctx);
    if (typeof auth.error === "string" && typeof auth.status === "number") return fail(auth.error, auth.status);
    const content = (await request.json()) as { text?: unknown };
    if (typeof content.text !== "string") return fail("نص الرسالة مطلوب.", 400);
    const text = content.text.trim();
    if (text.length < 1 || text.length > 1500) return fail("الرسالة بين حرف و1500 حرف.", 400);
    // Soft anti-flood guard; database RLS is the authoritative access rule.
    const last = await auth.db.from("edu_native_room_messages").select("created_at")
      .eq("session_id", auth.id).eq("user_id", auth.user.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (last.error) return fail("تعذر التحقق من حد الرسائل.", 503);
    if (last.data && Date.now() - Date.parse(last.data.created_at) < 2500) {
      return fail("أرسل الرسالة التالية بعد ثوانٍ قليلة.", 429);
    }
    const saved = await auth.db.from("edu_native_room_messages")
      .insert({ session_id: auth.id, user_id: auth.user.id, body: text })
      .select("id").single();
    if (saved.error || !saved.data) {
      console.error("NATIVE_ROOM_WRITE_FAILED", saved.error?.code);
      return fail("تعذر حفظ الرسالة.", 503);
    }
    return NextResponse.json({ ok: true, id: saved.data.id }, { status: 201, headers: noStore });
  } catch {
    return fail("تعذر إرسال الرسالة.", 503);
  }
}
