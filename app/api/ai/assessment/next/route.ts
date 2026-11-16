import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * P0 fail-closed guard: clients must not submit correctness as authority.
 * Session advancement must be performed atomically by the trusted grading RPC.
 * This endpoint intentionally cannot increment scores or grant progress.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ success: false, error: "يجب تسجيل الدخول أولًا." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "بيانات غير صالحة." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ success: false, error: "بيانات غير صالحة." }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;
  if (typeof payload.sessionId !== "string" || !payload.sessionId.trim()) {
    return NextResponse.json({ success: false, error: "معرف الجلسة مطلوب." }, { status: 400 });
  }

  // Never trust payload.correct, including false. Both must be ignored.
  // A non-mutating response avoids granting fabricated scores while the
  // transactional submission flow and its RLS permissions are still pending.
  return NextResponse.json(
    { success: false, error: "الانتقال إلى السؤال التالي متوقف مؤقتًا حتى اعتماد التصحيح الآمن." },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
}
