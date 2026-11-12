import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authorizeSession } from "@/lib/auth/authorization";
import { requireAdminResponse } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Controlled role-review endpoint, intentionally unusable until the reviewed
 * atomic SQL function is installed. Never accept proposed role or score.
 */
export async function POST(request: Request) {
  const rejectedAdminRequest = await requireAdminResponse();
  if (rejectedAdminRequest) return rejectedAdminRequest;
  // Handler-local fail-closed guard even if the hosting adapter bypasses proxy.
  const expectedOrigin = new URL(
    process.env.NEXT_PUBLIC_SITE_URL || request.url,
  ).origin;
  if (request.headers.get("origin") !== expectedOrigin) {
    return NextResponse.json({ error: "FORBIDDEN_ORIGIN" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "INVALID_CONTENT_TYPE" }, { status: 415 });
  }
  if (Number(request.headers.get("content-length") || 0) > 2048) {
    return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }

  const client = await createClient();
  const authorization = await authorizeSession(client, ["admin"]);
  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  const text = await request.text().catch(() => "");
  if (text.length > 2048) {
    return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }

  let payload: unknown;
  try { payload = JSON.parse(text); }
  catch { return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 }); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;
  if (Object.keys(body).some(key => !["targetUserId", "decision", "reason"].includes(key)) ||
      typeof body.targetUserId !== "string" || !UUID.test(body.targetUserId) ||
      (body.decision !== "approved" && body.decision !== "rejected") ||
      body.targetUserId === authorization.user.id ||
      typeof body.reason !== "string" || body.reason.trim().length < 12 ||
      body.reason.length > 500) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  try {
    // All three writes are one DB transaction: role, request status, audit.
    // The SQL revokes execution from browser JWT roles.
    const { data, error } = await createAdminClient()
      .rpc("approve_profile_role_request", {
        p_target_user_id: body.targetUserId,
        p_reviewer_id: authorization.user.id,
        p_decision: body.decision,
        p_reason: (body.reason as string).trim(),
      });
    if (error || data !== body.decision) {
      return NextResponse.json(
        { error: "REVIEW_UNAVAILABLE_OR_CONFLICT" },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      { ok: true, status: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "REVIEW_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
