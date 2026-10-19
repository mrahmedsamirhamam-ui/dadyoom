import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const categories = new Set([
  "general", "technical", "account", "curriculum", "teacher",
  "school", "privacy", "suggestion", "complaint", "other",
]);
const roles = new Set([
  "visitor", "student", "child", "teacher", "parent", "school", "admin", "other",
]);
const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
const bad = (error: string, status: number) =>
  NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  // Requests from browsers must originate from the same public Dadyoom site.
  if (!origin || origin !== new URL(request.url).origin) {
    return bad("تعذر التحقق من مصدر الطلب.", 403);
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return bad("صيغة الطلب غير صالحة.", 415);
  }
  if (Number(request.headers.get("content-length") ?? "0") > 12000) {
    return bad("حجم الرسالة أكبر من المسموح.", 413);
  }
  let body: Record<string, unknown>;
  try {
    const json: unknown = await request.json();
    if (!json || typeof json !== "object" || Array.isArray(json)) throw new Error("Invalid body");
    body = json as Record<string, unknown>;
  } catch {
    return bad("تعذر قراءة بيانات النموذج.", 400);
  }

  // Honeypot: bots should never populate this field.
  if (clean(body.website)) return bad("تعذر استلام الرسالة.", 400);

  const name = clean(body.name);
  const email = clean(body.email).toLowerCase();
  const category = clean(body.category);
  const user_role = clean(body.userRole) || "visitor";
  const subject = clean(body.subject);
  const message = clean(body.message);
  const pageValue = clean(body.pageUrl);
  const accepted = body.consent === true;
  if (
    name.length < 2 || name.length > 100 ||
    email.length < 5 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ||
    !categories.has(category) || !roles.has(user_role) ||
    subject.length < 5 || subject.length > 160 ||
    message.length < 15 || message.length > 4000 || !accepted
  ) {
    return bad("يرجى استكمال البيانات المطلوبة والتحقق منها.", 400);
  }

  let page_url: string | null = null;
  if (pageValue) {
    try {
      const url = new URL(pageValue);
      if (!["https:", "http:"].includes(url.protocol) || pageValue.length > 500) {
        return bad("رابط الصفحة غير صالح.", 400);
      }
      page_url = url.toString();
    } catch {
      return bad("رابط الصفحة غير صالح.", 400);
    }
  }

  try {
    // Hash, never store raw IP; fall back to email when no trusted edge IP exists.
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!secret) throw new Error("Support backend not configured");
    const edgeIp = request.headers.get("cf-connecting-ip")?.trim();
    const throttleId = edgeIp ? "ip:" + edgeIp : "email:" + email;
    const submitter_hash = createHmac("sha256", secret).update(throttleId).digest("hex");

    const admin = createAdminClient();
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recent = await admin.from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("submitter_hash", submitter_hash).gte("created_at", since);
    if (recent.error) throw recent.error;
    if ((recent.count ?? 0) >= 3) {
      return bad("تم استلام طلبات متعددة مؤخرًا. يُرجى المحاولة بعد ساعة.", 429);
    }
    // Attach an authenticated sender using the verified session, never a client-supplied ID.
    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    const verifiedEmail = user?.email?.trim().toLowerCase() || email;
    const inserted = await admin.from("support_tickets").insert({
      user_id: user?.id ?? null,
      name, email: verifiedEmail, category, user_role, subject, message, page_url, submitter_hash,
    }).select("id").single();
    if (inserted.error || !inserted.data?.id) throw inserted.error ?? new Error("Missing ticket id");

    return NextResponse.json(
      { ok: true, reference: String(inserted.data.id).slice(0, 8).toUpperCase() },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("DADYOOM_CONTACT_SUBMIT_FAILED", error instanceof Error ? error.message : "unknown");
    return bad("تعذر تسجيل الطلب مؤقتًا. يرجى المحاولة لاحقًا.", 503);
  }
}
