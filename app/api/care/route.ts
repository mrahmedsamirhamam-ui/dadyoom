import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set([
  "general", "technical", "account", "curriculum", "teacher",
  "school", "privacy", "suggestion", "complaint", "other",
]);
const ROLES = new Set([
  "visitor", "student", "child", "teacher", "parent", "school", "admin", "other",
]);

const noStore = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: noStore });

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max + 1) : "";
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

async function submitterHash(identity: string): Promise<string> {
  // Use a server-only secret; never store an email or an IP address in the throttle key.
  const secret = process.env.DADYOOM_CARE_HASH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("CARE_SERVER_NOT_CONFIGURED");
  const data = new TextEncoder().encode(`${secret}:${identity.toLowerCase()}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function GET() {
  try {
    const client = await createClient();
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return json({ authenticated: false, tickets: [] });

    const admin = createAdminClient();
    const { data, error: dbError } = await admin.from("support_tickets")
      .select("id,category,subject,status,public_reply,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (dbError) return json({ error: "تعذّر تحميل الطلبات." }, 500);
    return json({ authenticated: true, tickets: data ?? [] });
  } catch {
    return json({ error: "خدمة المتابعة غير متاحة حاليًا." }, 503);
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return json({ error: "تعذّر التحقق من مصدر الطلب." }, 403);
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ error: "صيغة البيانات غير مدعومة." }, 415);
  }
  try {
    if (Number(request.headers.get("content-length") || "0") > 12000) {
      return json({ error: "حجم الرسالة كبير جدًا." }, 413);
    }
    const raw = await request.text();
    if (raw.length > 12000) return json({ error: "حجم الرسالة كبير جدًا." }, 413);

    const body = JSON.parse(raw) as Record<string, unknown>;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: "البيانات غير صالحة." }, 400);
    }
    // Invisible honeypot: a normal user never fills this field.
    if (text(body.website, 200)) return json({ error: "تعذّر قبول الطلب." }, 400);

    const name = text(body.name, 100);
    const subject = text(body.subject, 160);
    const message = text(body.message, 4000);
    const suppliedEmail = text(body.email, 254).toLowerCase();
    const category = text(body.category, 30);
    const selectedRole = text(body.user_role, 24);
    if (
      name.length < 2 || name.length > 100 ||
      subject.length < 5 || subject.length > 160 ||
      message.length < 15 || message.length > 4000 ||
      !CATEGORIES.has(category) || !ROLES.has(selectedRole) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suppliedEmail)
    ) {
      return json({ error: "يرجى مراجعة الاسم والبريد ونوع الطلب والعنوان والرسالة." }, 400);
    }

    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    let userRole = selectedRole;

    if (user) {
      const { data: profile } = await client.from("profiles")
        .select("role").eq("id", user.id).maybeSingle();
      userRole = ROLES.has(profile?.role ?? "")
        ? profile!.role
        : "other";
    }
    const email = user?.email?.toLowerCase() ?? suppliedEmail;
    if (email.length < 5 || email.length > 254) {
      return json({ error: "البريد الإلكتروني غير صالح." }, 400);
    }

    const admin = createAdminClient();
    const submitter_hash = await submitterHash(user?.id ?? email);
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await admin.from("support_tickets")
      .select("id", { head: true, count: "exact" })
      .eq("submitter_hash", submitter_hash)
      .gte("created_at", since);
    if (countError) throw countError;
    if ((count ?? 0) >= 3) {
      return json({ error: "وصلت إلى حد الطلبات خلال الساعة. يرجى المحاولة لاحقًا." }, 429);
    }

    const { data, error: insertError } = await admin.from("support_tickets")
      .insert({
        user_id: user?.id ?? null,
        name, email, category, user_role: userRole, subject, message,
        submitter_hash,
      })
      .select("id")
      .single();
    if (insertError || !data?.id) throw insertError ?? new Error("INSERT_FAILED");

    return json({
      ok: true,
      id: data.id,
      message: "وصل طلبك إلى ضاديوم معك. احتفظ برقم المتابعة.",
    }, 201);
  } catch {
    return json({ error: "تعذّر تسجيل الطلب الآن. يرجى المحاولة لاحقًا." }, 503);
  }
}
