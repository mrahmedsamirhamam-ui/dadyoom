import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorizeSession } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

const reply = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

async function requireAdmin() {
  const client = await createClient();
  return authorizeSession(client, ["admin"]);
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return reply({ error: "غير مصرح." }, auth.status);
  try {
    const { data, error } = await createAdminClient().from("support_tickets")
      .select("id,created_at,updated_at,name,email,user_role,category,subject,message,status,admin_note")
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return reply({ tickets: data ?? [] });
  } catch {
    return reply({ error: "تعذّر تحميل الطلبات." }, 503);
  }
}

export async function PATCH(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return reply({ error: "مصدر الطلب غير معروف." }, 403);
  try {
    if (new URL(origin).host !== new URL(request.url).host) {
      return reply({ error: "مصدر الطلب غير مصرح." }, 403);
    }
  } catch {
    return reply({ error: "مصدر الطلب غير صالح." }, 403);
  }
  const auth = await requireAdmin();
  if (!auth.ok) return reply({ error: "غير مصرح." }, auth.status);

  try {
    if (Number(request.headers.get("content-length") || "0") > 5000) {
      return reply({ error: "حجم الطلب غير صالح." }, 413);
    }
    const raw = await request.text();
    if (raw.length > 5000) return reply({ error: "حجم الطلب غير صالح." }, 413);
    const body = JSON.parse(raw) as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const status = typeof body.status === "string" ? body.status : "";
    const note = typeof body.admin_note === "string" ? body.admin_note.trim() : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
      !["new", "in_progress", "resolved"].includes(status) || note.length > 2000) {
      return reply({ error: "يرجى مراجعة بيانات التحديث." }, 400);
    }
    const { data, error } = await createAdminClient().from("support_tickets")
      .update({ status, admin_note: note, updated_at: new Date().toISOString() })
      .eq("id", id).select("id,status,updated_at").maybeSingle();
    if (error) throw error;
    if (!data) return reply({ error: "الطلب غير موجود." }, 404);
    return reply({ ticket: data });
  } catch {
    return reply({ error: "تعذّر تحديث الطلب." }, 503);
  }
}
