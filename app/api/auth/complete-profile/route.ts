import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCountryCode } from "@/lib/countries";
import { destinationForStoredRole } from "@/lib/auth/role-destination.mjs";
import {
  ensurePendingRoleRequest, hasVerifiedPrivilegedRole, isApprovalRequired,
} from "@/lib/auth/pending-role-request";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user?.email) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { data: existing, error: lookupError } = await client.from("profiles")
    .select("role,country,full_name").eq("id", user.id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: "PROFILE_UNAVAILABLE" }, { status: 503 });
  let payload: unknown;
  try { payload = await request.json(); } catch {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  const data = payload as Record<string, unknown>;
  if (Object.keys(data).some(key => !["role","fullName","country"].includes(key)))
    return NextResponse.json({ error: "INVALID_FIELDS" }, { status: 400 });
  const requestedRole = typeof data.role === "string" ? data.role.trim().toLowerCase() : "student";
  const name = typeof data.fullName === "string" ? data.fullName.trim().slice(0,120) : "";
  const country = typeof data.country === "string" ? data.country.trim().toUpperCase() : "";
  if (!name || !isCountryCode(country)) return NextResponse.json({ error: "INVALID_PROFILE" }, { status: 400 });
  const currentRole = typeof existing?.role === "string" ? existing.role.trim().toLowerCase() : "";
  const pending = isApprovalRequired(requestedRole) && (!currentRole || currentRole === "student");
  // Teacher/school are requests, never accepted as roles; admin/parent/child
  // self-enrolment is rejected until separately reviewed.
  if (!["student","teacher","school"].includes(requestedRole) &&
      requestedRole !== currentRole)
    return NextResponse.json({ error: "ROLE_APPROVAL_REQUIRED" }, { status: 403 });
  if (currentRole && currentRole !== requestedRole && !pending)
    return NextResponse.json({ error: "IMMUTABLE_ROLE" }, { status: 409 });
  const admin = createAdminClient();
  // Security invariant: client-controlled body never appears in role assignment.
  const { data: saved, error: writeError } = currentRole
    ? await admin.from("profiles").update({ full_name: name, country })
        .eq("id", user.id).eq("role", currentRole).select("role").maybeSingle()
    : await admin.from("profiles").insert({
        id: user.id, email: user.email, full_name: name, country, role: "student",
      }).select("role").maybeSingle();
  if (writeError || !saved) {
    return NextResponse.json({ error: "PROFILE_WRITE_UNAVAILABLE" }, { status: 503 });
  }
  if (pending) {
    const result = await ensurePendingRoleRequest(admin, user.id, requestedRole);
    if (!result.ok) return NextResponse.json({ error: "ROLE_REQUEST_UNAVAILABLE" }, { status: 503 });
    return NextResponse.json({ ok: true, pendingApproval: true, destination: "/account/role-status" });
  }
  const actualRole = String(saved.role).trim().toLowerCase();
  if (!(await hasVerifiedPrivilegedRole(client, user.id, actualRole))) {
    return NextResponse.json({ ok: true, pendingApproval: true, destination: "/account/role-status" });
  }
  return NextResponse.json({ ok: true, destination: destinationForStoredRole(actualRole) });
}
