import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authorizeSession } from "@/lib/auth/authorization";

/**
 * Fail-closed, handler-local authorization for privileged API requests.
 * Cloudflare adapters may not execute Next.js Node proxy/middleware.
 */
export async function requireAdminResponse(): Promise<NextResponse | null> {
  try {
    const client = await createClient();
    const result = await authorizeSession(client, ["admin"]);
    if (result.ok) return null;
    return NextResponse.json({ error: result.error }, {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
