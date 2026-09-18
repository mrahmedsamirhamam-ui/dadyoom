import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DADYOOM_SERVER_THROTTLED_PASSWORD_LOGIN_V1
const MAX_FAILURES = 6;
const COOLDOWN_SECONDS = 15 * 60;

type GateRow = {
  allowed?: boolean;
  locked?: boolean;
  remaining_attempts?: number;
  retry_after_seconds?: number;
};

type ThrottleRpcResult = {
  data: unknown;
  error: { message: string } | null;
};

type ThrottleAdminClient = {
  rpc: (
    name: string,
    args: { p_key: string }
  ) => Promise<ThrottleRpcResult>;
};

function throttleKey(kind: "email" | "ip", value: string) {
  return crypto
    .createHash("sha256")
    .update(`dadyoom-login-throttle-v1:${kind}:${value}`)
    .digest("hex");
}

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim().slice(0, 120) || "unknown";
  }

  return (
    request.headers.get("x-real-ip")?.trim().slice(0, 120) ||
    "unknown"
  );
}

function firstRow(value: unknown): GateRow | null {
  return Array.isArray(value) && value.length > 0
    ? (value[0] as GateRow)
    : null;
}

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };

  try {
    body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
    };
  } catch {
    return NextResponse.json(
      { error: "طلب تسجيل الدخول غير صالح." },
      { status: 400 }
    );
  }

  const email =
    typeof body.email === "string"
      ? body.email.trim().toLowerCase()
      : "";
  const password =
    typeof body.password === "string"
      ? body.password
      : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "البريد الإلكتروني وكلمة المرور مطلوبان." },
      { status: 400 }
    );
  }

  const admin =
    (await createAdminClient()) as unknown as
      ThrottleAdminClient;
  const keys = [
    throttleKey("email", email),
    throttleKey("ip", clientIp(request)),
  ];

  const checks = await Promise.all(
    keys.map((key) =>
      admin.rpc("auth_login_gate_check", { p_key: key })
    )
  );

  for (const result of checks) {
    if (result.error) {
      console.error(
        "DADYOOM_LOGIN_THROTTLE_CHECK_FAILED",
        result.error.message
      );

      return NextResponse.json(
        { error: "تعذر التحقق من حماية تسجيل الدخول." },
        { status: 503 }
      );
    }
  }

  const blocked = checks
    .map((result) => firstRow(result.data))
    .filter(
      (row): row is GateRow =>
        Boolean(row && row.allowed === false)
    );

  if (blocked.length > 0) {
    const retryAfter = Math.max(
      1,
      ...blocked.map(
        (row) => Number(row.retry_after_seconds || COOLDOWN_SECONDS)
      )
    );

    return NextResponse.json(
      {
        error:
          "تم إيقاف محاولات تسجيل الدخول مؤقتًا بعد محاولات غير صحيحة متكررة. حاول مرة أخرى بعد انتهاء المهلة.",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !publishableKey) {
    console.error("DADYOOM_PASSWORD_LOGIN_PUBLIC_CONFIG_MISSING");

    return NextResponse.json(
      { error: "خدمة تسجيل الدخول غير مهيأة." },
      { status: 503 }
    );
  }

  const authClient = createSupabaseClient(
    supabaseUrl,
    publishableKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  const { data, error } =
    await authClient.auth.signInWithPassword({
      email,
      password,
    });

  if (error || !data.session || !data.user) {
    const failures = await Promise.all(
      keys.map((key) =>
        admin.rpc("auth_login_gate_record_failure", {
          p_key: key,
        })
      )
    );

    let locked = false;
    let retryAfter = 0;

    for (const result of failures) {
      if (result.error) {
        console.error(
          "DADYOOM_LOGIN_THROTTLE_FAILURE_RECORD_FAILED",
          result.error.message
        );
        continue;
      }

      const row = firstRow(result.data);
      if (row?.locked) {
        locked = true;
        retryAfter = Math.max(
          retryAfter,
          Number(row.retry_after_seconds || COOLDOWN_SECONDS)
        );
      }
    }

    if (locked) {
      return NextResponse.json(
        {
          error:
            `تم الوصول إلى ${MAX_FAILURES} محاولات غير صحيحة. تم إيقاف تسجيل الدخول مؤقتًا لمدة 15 دقيقة.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(1, retryAfter || COOLDOWN_SECONDS)
            ),
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      { error: "بيانات تسجيل الدخول غير صحيحة." },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  await Promise.all(
    keys.map((key) =>
      admin.rpc("auth_login_gate_record_success", {
        p_key: key,
      })
    )
  );

  return NextResponse.json(
    {
      ok: true,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at ?? null,
      user: {
        id: data.user.id,
        email: data.user.email ?? null,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}
