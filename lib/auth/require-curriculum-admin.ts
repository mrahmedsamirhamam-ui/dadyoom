import "server-only";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Protect curriculum administration at each HTTP handler boundary.
 *
 * The session is validated with Supabase Auth first; role decisions are
 * delegated to the existing trusted is_admin() database RPC, rather than
 * client-editable metadata, query params, a bare route name or a profile
 * field supplied by the browser.
 *
 * This is defense in depth against direct /api/admin/** requests. It must
 * precede every curriculum database read, mutation, and input processing.
 */
export async function authorizeCurriculumAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "يجب تسجيل الدخول إلى حساب المدير." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      ),
    };
  }

  const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin");
  if (roleError || isAdmin !== true) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "هذه العملية متاحة لمدير ضاديوم فقط." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      ),
    };
  }

  return { authorized: true as const, supabase };
}
